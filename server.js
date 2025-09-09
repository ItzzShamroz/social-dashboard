// server.js - Backend for real-time follower counts via Meta Graph API
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Support local JSON config without env variables
let LOCAL = null;
try {
  const localPath = path.join(__dirname, 'config.local.json');
  if (fs.existsSync(localPath)) {
    LOCAL = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    console.log('Loaded local configuration from config.local.json');
  }
} catch (e) {
  console.warn('Failed to read config.local.json:', e.message);
}

const FB_APP_ID = (LOCAL && LOCAL.FB_APP_ID) || process.env.FB_APP_ID;
const FB_APP_SECRET = (LOCAL && LOCAL.FB_APP_SECRET) || process.env.FB_APP_SECRET;

// Optional token-mode (skip login)
const TOKEN_MODE = !!(
  ((LOCAL && LOCAL.FB_PAGE_ID) || process.env.FB_PAGE_ID) &&
  (((LOCAL && (LOCAL.FB_PAGE_ACCESS_TOKEN || LOCAL.IG_ACCESS_TOKEN)) || (process.env.FB_PAGE_ACCESS_TOKEN || process.env.IG_ACCESS_TOKEN)))
);

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// Helper: Graph API request
const graph = axios.create({ baseURL: 'https://graph.facebook.com/v18.0' });

async function exchangeForLongLivedToken(shortToken) {
  const { data } = await graph.get('/oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: FB_APP_ID,
      client_secret: FB_APP_SECRET,
      fb_exchange_token: shortToken
    }
  });
  return data; // { access_token, token_type, expires_in }
}

async function getMe(accessToken) {
  const { data } = await graph.get('/me', {
    params: { fields: 'id,name', access_token: accessToken }
  });
  return data; // { id, name }
}

async function getPages(accessToken) {
  const { data } = await graph.get('/me/accounts', {
    params: { fields: 'id,name,access_token,instagram_business_account', access_token: accessToken }
  });
  return data.data || [];
}

async function getPageInsights(pageId, pageAccessToken) {
  const { data } = await graph.get(`/${pageId}`, {
    params: {
      fields: 'name,fan_count,followers_count',
      access_token: pageAccessToken
    }
  });
  return data; // { name, fan_count, followers_count }
}

async function getIGForPage(pageId, pageAccessToken) {
  const { data } = await graph.get(`/${pageId}`, {
    params: { fields: 'instagram_business_account', access_token: pageAccessToken }
  });
  return data.instagram_business_account?.id || null;
}

async function getIGInsights(igUserId, accessToken) {
  if (!igUserId) return null;
  const { data } = await graph.get(`/${igUserId}`, {
    params: { fields: 'username,followers_count,media_count', access_token: accessToken }
  });
  return data; // { username, followers_count, media_count }
}

// Auth status
app.get('/api/status', (req, res) => {
  const authed = !!(req.session.page && req.session.page.pageId && req.session.page.pageAccessToken);
  return res.json({
    authenticated: authed,
    tokenMode: TOKEN_MODE,
    user: authed ? { id: req.session.user?.id, name: req.session.user?.name } : null,
    page: authed ? { id: req.session.page.pageId, name: req.session.page.pageName } : null
  });
});

// Auth: exchange token and setup page + ig target
app.post('/api/auth/facebook', async (req, res) => {
  try {
    if (!FB_APP_ID || !FB_APP_SECRET) {
      return res.status(400).json({ error: 'Server is missing FB_APP_ID/FB_APP_SECRET' });
    }

    const shortToken = req.body?.token;
    if (!shortToken) return res.status(400).json({ error: 'Missing token' });

    // Exchange for long lived token
    const longLived = await exchangeForLongLivedToken(shortToken);
    const longUserToken = longLived.access_token;

    const me = await getMe(longUserToken);

    // Fetch pages
    const pages = await getPages(longUserToken);
    if (!pages.length) {
      return res.status(400).json({ error: 'No Facebook Pages available for this user. Ensure pages_show_list permission is granted.' });
    }

    // Pick first page (or first with IG account if available)
    let selected = pages.find(p => p.instagram_business_account) || pages[0];

    // Ensure we have a page access token
    if (!selected.access_token) {
      return res.status(400).json({ error: 'Missing Page access token. Ensure pages_read_engagement/pages_show_list are granted.' });
    }

    const pageId = selected.id;
    const pageName = selected.name;
    const pageAccessToken = selected.access_token;

    // Try to get IG business account id
    let igUserId = selected.instagram_business_account?.id || null;
    if (!igUserId) {
      igUserId = await getIGForPage(pageId, pageAccessToken);
    }

    req.session.user = { id: me.id, name: me.name, longUserToken };
    req.session.page = { pageId, pageName, pageAccessToken, igUserId };

    return res.json({
      success: true,
      user: req.session.user,
      page: req.session.page
    });
  } catch (err) {
    const msg = err.response?.data || err.message;
    return res.status(500).json({ error: 'Auth/Setup failed', details: msg });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// SSE: real-time stream of follower counts
app.get('/api/stream', async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const intervalMs = Math.max(3000, Math.min(60000, parseInt(req.query.interval, 10) || 10000));

  // Resolve token/page info (session or token-mode)
  let pageId, pageAccessToken, igUserId, igAccessToken;

  if (req.session?.page?.pageId && req.session?.page?.pageAccessToken) {
    pageId = req.session.page.pageId;
    pageAccessToken = req.session.page.pageAccessToken;
    igUserId = req.session.page.igUserId || null;
    igAccessToken = pageAccessToken; // works for IG Graph calls if perms present
  } else if (TOKEN_MODE) {
    pageId = (LOCAL && LOCAL.FB_PAGE_ID) || process.env.FB_PAGE_ID;
    pageAccessToken = (LOCAL && LOCAL.FB_PAGE_ACCESS_TOKEN) || process.env.FB_PAGE_ACCESS_TOKEN;
    igUserId = (LOCAL && LOCAL.IG_USER_ID) || process.env.IG_USER_ID || null;
    igAccessToken = (LOCAL && LOCAL.IG_ACCESS_TOKEN) || process.env.IG_ACCESS_TOKEN || pageAccessToken;
  } else {
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: 'Not authenticated and no token mode configured' })}\n\n`);
    return res.end();
  }

  let timer = null;
  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const poll = async () => {
    try {
      const [fb, ig] = await Promise.all([
        getPageInsights(pageId, pageAccessToken).catch(e => ({ error: e.message })),
        igUserId ? getIGInsights(igUserId, igAccessToken).catch(e => ({ error: e.message })) : Promise.resolve(null)
      ]);

      const payload = {
        ts: new Date().toISOString(),
        facebook: fb && !fb.error ? {
          page_id: pageId,
          page_name: fb.name,
          followers: fb.followers_count ?? null,
          likes: fb.fan_count ?? null
        } : { error: fb?.error || 'FB error' },
        instagram: ig && !ig.error ? {
          ig_user_id: igUserId,
          username: ig.username,
          followers: ig.followers_count ?? null,
          posts: ig.media_count ?? null
        } : (ig === null ? { info: 'No IG linked' } : { error: ig?.error || 'IG error' })
      };

      payload.total_followers = (payload.facebook.followers || 0) + (payload.instagram.followers || 0);

      send('message', payload);
    } catch (err) {
      send('error', { error: err.message || 'Unknown polling error' });
    }
  };

  // Start immediate + interval
  poll();
  timer = setInterval(poll, intervalMs);

  // Keep-alive
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 30000);

  req.on('close', () => {
    if (timer) clearInterval(timer);
    clearInterval(keepAlive);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

