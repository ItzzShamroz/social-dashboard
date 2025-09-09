# Social Media Dashboard

A complete HTML/CSS/JavaScript application with Bootstrap that displays Facebook and Instagram followers with a beautiful, responsive interface.

## 🚀 Features

- **Facebook Login Integration** - Login with Facebook button
- **Real-time Follower Counts** - Display Facebook and Instagram followers
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Bootstrap UI** - Modern, clean interface
- **Demo Mode** - Test the app without API keys
- **Auto-refresh** - Updates data every 5 minutes
- **Error Handling** - Graceful error states
- **Loading States** - Professional loading indicators

## 📁 Files Structure

```
SocialMediaDashboard/
├── index.html          # Main HTML file with login and dashboard
├── styles.css          # Custom CSS styles
├── app.js             # Main JavaScript application
├── config.js          # Configuration file (API keys)
├── privacy-policy.html # Privacy policy (required for Facebook approval)
├── terms-of-service.html # Terms of service (required for Facebook approval)
├── data-deletion.html # Data deletion instructions (required for Facebook approval)
└── README.md          # This file
```

## 🎯 Quick Start (Demo Mode)

The application works immediately in demo mode with fake data:

1. Open `index.html` in your web browser
2. Click "Login with Facebook" 
3. Explore the dashboard with demo data

## 🔑 Getting API Keys

To use real data, you need to get API keys from Facebook and Instagram:

### Facebook App Setup

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Click "Get Started" and create a developer account

2. **Create a New App**
   - Click "Create App"
   - Select "Consumer" for app type
   - Fill in app details:
     - App Name: "Social Media Dashboard"
     - Contact Email: Your email
     - App Purpose: Choose appropriate option

3. **Get App ID and Secret**
   - Go to Settings → Basic
   - Copy your `App ID` and `App Secret`
   - Add your domain to "App Domains"

4. **Configure Facebook Login**
   - Go to Products → Facebook Login → Settings
   - Add Valid OAuth Redirect URIs: `http://localhost/` or your domain
   - Save changes

5. **Request Permissions**
   - Go to App Review → Permissions and Features
   - Request these permissions:
     - `email` (approved by default)
     - `pages_read_engagement` (for page data)
     - `pages_show_list` (for page access)

### Instagram Basic Display API Setup

1. **Add Instagram Product**
   - In your Facebook app, go to Products
   - Find "Instagram Basic Display" and click "Set Up"

2. **Create Instagram App**
   - Go to Instagram Basic Display → Basic Display
   - Create a new app
   - Fill in the required fields

3. **Configure Settings**
   - Add Valid OAuth Redirect URIs
   - Add Deauthorize and Data Deletion Request URLs
   - Save settings

4. **Get App ID and Secret**
   - Copy your Instagram `App ID` and `App Secret`

### Instagram Graph API (Alternative - More Features)

For more advanced features, use Instagram Graph API:

1. **Business Account Required**
   - Convert your Instagram account to Business
   - Connect it to a Facebook Page

2. **Request Permissions**
   - `instagram_basic` - Basic profile access
   - `instagram_manage_insights` - Analytics data

## ⚙️ Configuration

Edit `config.js` and replace the placeholder values:

```javascript
const CONFIG = {
    facebook: {
        appId: 'YOUR_FACEBOOK_APP_ID',           // Replace with your Facebook App ID
        appSecret: 'YOUR_FACEBOOK_APP_SECRET',   // Replace with your Facebook App Secret
        version: 'v18.0'
    },
    
    instagram: {
        appId: 'YOUR_INSTAGRAM_APP_ID',          // Replace with your Instagram App ID
        appSecret: 'YOUR_INSTAGRAM_APP_SECRET',  // Replace with your Instagram App Secret
        redirectUri: 'http://localhost/'        // Replace with your redirect URI
    },
    
    demo: {
        enabled: false,  // Set to false to use real APIs
        // ... demo data
    }
};
```

## 📋 Facebook App Compliance

For Facebook app approval, you **MUST** have these legal pages:

### Required Legal Pages
1. **Privacy Policy** (`privacy-policy.html`)
   - Comprehensive data handling policies
   - Facebook/Instagram-specific data usage
   - User rights and data retention
   - GDPR and CCPA compliance

2. **Terms of Service** (`terms-of-service.html`)
   - Service usage terms
   - User obligations and prohibited activities
   - Third-party service integration policies
   - Limitation of liability

3. **Data Deletion Instructions** (`data-deletion.html`)
   - Step-by-step deletion process
   - User rights and data control
   - Required for Facebook app approval

### Facebook App Setup Requirements
When setting up your Facebook app, you'll need to provide:
- **Privacy Policy URL**: `https://yourdomain.com/privacy-policy.html`
- **Terms of Service URL**: `https://yourdomain.com/terms-of-service.html`
- **Data Deletion Instructions URL**: `https://yourdomain.com/data-deletion.html`

### Customization Required
Before submitting for Facebook approval:
1. Replace `[Your Company Name]` with your actual company name
2. Update contact email addresses
3. Add your physical address
4. Update the jurisdiction for legal compliance
5. Ensure all URLs match your domain

## 🔒 Security Notes

**Important Security Considerations:**

1. **App Secrets**: Never expose App Secrets in client-side code
   - The provided config is for development only
   - In production, use server-side endpoints for sensitive operations

2. **HTTPS Required**: Facebook requires HTTPS for production apps
   - Use `https://` URLs for redirect URIs in production
   - Local development can use `http://localhost`

3. **Domain Validation**: Add your domain to Facebook App settings
   - App Domains in Facebook App Settings
   - Valid OAuth Redirect URIs in Login settings

## 🌐 Deployment

### Local Testing
```bash
# Simple HTTP server with Python
python -m http.server 8000

# Or with Node.js
npx http-server
```

### Production Deployment
1. Upload files to your web server
2. Update config.js with production API keys
3. Set `demo.enabled` to `false`
4. Ensure HTTPS is enabled
5. Update Facebook app settings with production domain

## 🛠️ Customization

### Adding More Social Platforms
1. Add new platform config in `config.js`
2. Create new card in `index.html`
3. Add API integration methods in `app.js`

### Styling Changes
- Modify `styles.css` for custom colors/layout
- Update Bootstrap classes in `index.html`
- Add your own animations and transitions

### Data Refresh Interval
```javascript
// Change auto-refresh interval (in milliseconds)
settings: {
    autoRefreshInterval: 300000  // 5 minutes
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Login Not Working**
   - Check if App ID is correct in config.js
   - Verify domain is added to Facebook App settings
   - Ensure redirect URI matches app configuration

2. **API Errors**
   - Check access token validity
   - Verify required permissions are granted
   - Review Facebook/Instagram API documentation

3. **Data Not Loading**
   - Enable demo mode to test interface
   - Check browser console for error messages
   - Verify API endpoints in config.js

4. **CORS Issues**
   - Use a local server (not file:// protocol)
   - Check Facebook app domain settings

### Debug Mode
Enable debug mode in config.js:
```javascript
settings: {
    enableDebugMode: true
}
```

## 📚 API Documentation

- [Facebook Login](https://developers.facebook.com/docs/facebook-login/web)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## 🤝 Support

If you need help:
1. Check the troubleshooting section above
2. Review Facebook/Instagram API documentation
3. Check browser console for error messages
4. Ensure all configuration steps are completed

---

**Ready to go!** Open `index.html` in your browser and start exploring your social media dashboard! 🎉
