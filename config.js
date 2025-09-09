// Social Media Dashboard Configuration
// Replace these with your actual API keys

const CONFIG = {
    // Facebook App Configuration
    // Get these from https://developers.facebook.com/
    facebook: {
        appId: 'YOUR_FACEBOOK_APP_ID',
        appSecret: 'YOUR_FACEBOOK_APP_SECRET', // Keep this secure, use only server-side
        version: 'v18.0'
    },
    
    // Instagram Basic Display API Configuration
    // Get these from https://developers.facebook.com/docs/instagram-basic-display-api
    instagram: {
        appId: 'YOUR_INSTAGRAM_APP_ID',
        appSecret: 'YOUR_INSTAGRAM_APP_SECRET', // Keep this secure, use only server-side
        redirectUri: 'YOUR_REDIRECT_URI' // Must match your app settings
    },
    
    // API Endpoints (these are the actual Facebook/Instagram Graph API endpoints)
    api: {
        facebook: {
            baseUrl: 'https://graph.facebook.com',
            userFields: 'id,name,email,picture.width(100).height(100)',
            pageFields: 'id,name,followers_count,fan_count'
        },
        instagram: {
            baseUrl: 'https://graph.instagram.com',
            userFields: 'id,username,account_type,media_count',
            mediaFields: 'id,caption,media_type,media_url,permalink,timestamp'
        }
    },
    
    // App Settings
    settings: {
        autoRefreshInterval: 300000, // 5 minutes in milliseconds
        enableDebugMode: true, // Set to false in production
        maxRetries: 3,
        timeoutDuration: 10000 // 10 seconds
    },
    
    // Demo/Testing Data (for development purposes)
    demo: {
        enabled: true, // Set to false when using real APIs
        facebook: {
            followers: 15420,
            likes: 12850,
            growth: 8.5
        },
        instagram: {
            followers: 8760,
            posts: 142,
            growth: 12.3
        }
    }
};

// Environment check
if (typeof window !== 'undefined') {
    // Browser environment
    window.APP_CONFIG = CONFIG;
} else {
    // Node.js environment
    module.exports = CONFIG;
}

// Helper function to validate configuration
function validateConfig() {
    const errors = [];
    
    if (!CONFIG.demo.enabled) {
        if (!CONFIG.facebook.appId || CONFIG.facebook.appId === 'YOUR_FACEBOOK_APP_ID') {
            errors.push('Facebook App ID is not configured');
        }
        
        if (!CONFIG.instagram.appId || CONFIG.instagram.appId === 'YOUR_INSTAGRAM_APP_ID') {
            errors.push('Instagram App ID is not configured');
        }
    }
    
    return errors;
}

// Log configuration status
if (CONFIG.settings.enableDebugMode && typeof console !== 'undefined') {
    console.log('Social Media Dashboard - Configuration loaded');
    console.log('Demo mode:', CONFIG.demo.enabled ? 'ENABLED' : 'DISABLED');
    
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
        console.warn('Configuration warnings:', configErrors);
    }
}
