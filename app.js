// Social Media Dashboard - Main Application JavaScript

class SocialMediaDashboard {
    constructor() {
        this.config = window.APP_CONFIG || CONFIG;
        this.accessToken = null;
        this.userInfo = null;
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing Social Media Dashboard...');
        
        // Wait for Facebook SDK to load
        await this.initFacebookSDK();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check login status
        this.checkLoginStatus();
        
        // Update last sync time
        this.updateLastSyncTime();
    }

    async initFacebookSDK() {
        return new Promise((resolve) => {
            window.fbAsyncInit = () => {
                FB.init({
                    appId: this.config.demo.enabled ? '123456789' : this.config.facebook.appId,
                    cookie: true,
                    xfbml: true,
                    version: this.config.facebook.version
                });
                
                console.log('Facebook SDK initialized');
                resolve();
            };
        });
    }

    setupEventListeners() {
        // Facebook login button
        document.getElementById('fbLoginBtn').addEventListener('click', () => this.loginWithFacebook());
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Refresh data button (forces a single pull; SSE continues in background)
        document.getElementById('refreshData').addEventListener('click', () => this.refreshAllData());
    }

    // Exposed to XFBML login button via window.checkLoginState()
    checkLoginState() {
        FB.getLoginStatus((response) => this.statusChangeCallback(response));
    }

    // Handle login status updates
    async statusChangeCallback(response) {
        await this.handleLoginResponse(response);
    }

    // Shared login response handler
    async handleLoginResponse(response) {
        if (response && response.status === 'connected' && response.authResponse) {
            this.accessToken = response.authResponse.accessToken;
            this.userAccessToken = response.authResponse.accessToken;
            await this.getUserInfo();
            this.showDashboard();
            await this.loadPagesAndStart();
        } else {
            this.showError('Facebook login was cancelled or failed');
        }
    }

    async loginWithFacebook() {
        if (this.config.demo.enabled) {
            // Demo mode - simulate login
            console.log('Demo mode: Simulating Facebook login...');
            this.simulateLogin();
            return;
        }

        try {
            const response = await new Promise((resolve) => {
                FB.login((response) => resolve(response), {
                    scope: this.config.facebook.loginScopes,
                    return_scopes: true
                });
            });

            if (response.authResponse) {
                // Browser-only flow: store user access token and initialize
                this.accessToken = response.authResponse.accessToken;
                this.userAccessToken = response.authResponse.accessToken;
                await this.getUserInfo();
                this.showDashboard();
                await this.loadPagesAndStart();
            } else {
                console.error('Facebook login failed');
                this.showError('Facebook login was cancelled or failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred during login');
        }
    }

    simulateLogin() {
        // Simulate demo user data
        this.userInfo = {
            name: 'Demo User',
            email: 'demo@example.com',
            picture: {
                data: {
                    url: 'https://via.placeholder.com/100x100/007bff/ffffff?text=Demo'
                }
            }
        };
        
        this.showDashboard();
        this.loadAllData();
    }

    async getUserInfo() {
        if (this.config.demo.enabled) return;

        try {
            const response = await new Promise((resolve) => {
                FB.api('/me', {
                    fields: this.config.api.facebook.userFields
                }, (response) => resolve(response));
            });

            this.userInfo = response;
            console.log('User info loaded:', this.userInfo);
        } catch (error) {
            console.error('Error getting user info:', error);
        }
    }

    showDashboard() {
        // Hide login page and show dashboard
        document.getElementById('loginPage').classList.add('d-none');
        document.getElementById('dashboard').classList.remove('d-none');
        document.getElementById('dashboard').classList.add('fade-in');

        // Update user info in navbar
        if (this.userInfo) {
            document.getElementById('userName').textContent = this.userInfo.name;
            if (this.userInfo.picture && this.userInfo.picture.data) {
                document.getElementById('userPhoto').src = this.userInfo.picture.data.url;
            }
        }
    }

    async loadAllData() {
        console.log('Loading social media data...');
        if (!this.config.demo.enabled) {
            await this.loadPagesAndStart();
            return;
        }
        
        try {
            // Demo data
            await this.loadFacebookData();
            await this.loadInstagramData();
            this.updateCombinedStats();
            this.setupAutoRefresh();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadFacebookData() {
        const loadingElement = document.getElementById('fbFollowersLoading');
        const contentElement = document.getElementById('fbFollowersContent');
        const errorElement = document.getElementById('fbFollowersError');

        try {
            loadingElement.classList.remove('d-none');
            contentElement.classList.add('d-none');
            errorElement.classList.add('d-none');

            let data;
            
            if (this.config.demo.enabled) {
                // Use demo data
                data = {
                    followers: this.config.demo.facebook.followers,
                    likes: this.config.demo.facebook.likes,
                    growth: this.config.demo.facebook.growth
                };
                
                // Simulate loading delay
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                // Real API call would go here
                data = await this.fetchFacebookData();
            }

            // Update UI with data
            document.getElementById('fbFollowersCount').textContent = this.formatNumber(data.followers);
            document.getElementById('fbLikes').textContent = this.formatNumber(data.likes);
            document.getElementById('fbGrowth').textContent = `+${data.growth}%`;

            loadingElement.classList.add('d-none');
            contentElement.classList.remove('d-none');
            contentElement.classList.add('slide-up');

        } catch (error) {
            console.error('Facebook data loading error:', error);
            loadingElement.classList.add('d-none');
            errorElement.classList.remove('d-none');
            document.getElementById('fbErrorMessage').textContent = error.message;
        }
    }

    async loadInstagramData() {
        const loadingElement = document.getElementById('igFollowersLoading');
        const contentElement = document.getElementById('igFollowersContent');
        const errorElement = document.getElementById('igFollowersError');

        try {
            loadingElement.classList.remove('d-none');
            contentElement.classList.add('d-none');
            errorElement.classList.add('d-none');

            let data;
            
            if (this.config.demo.enabled) {
                // Use demo data
                data = {
                    followers: this.config.demo.instagram.followers,
                    posts: this.config.demo.instagram.posts,
                    growth: this.config.demo.instagram.growth
                };
                
                // Simulate loading delay
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                // Real API call would go here
                data = await this.fetchInstagramData();
            }

            // Update UI with data
            document.getElementById('igFollowersCount').textContent = this.formatNumber(data.followers);
            document.getElementById('igPosts').textContent = this.formatNumber(data.posts);
            document.getElementById('igGrowth').textContent = `+${data.growth}%`;

            loadingElement.classList.add('d-none');
            contentElement.classList.remove('d-none');
            contentElement.classList.add('slide-up');

        } catch (error) {
            console.error('Instagram data loading error:', error);
            loadingElement.classList.add('d-none');
            errorElement.classList.remove('d-none');
            document.getElementById('igErrorMessage').textContent = error.message;
        }
    }

    async fetchFacebookData() {
        // This would make real API calls to Facebook Graph API
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        try {
            const response = await fetch(
                `${this.config.api.facebook.baseUrl}/me?fields=${this.config.api.facebook.pageFields}&access_token=${this.accessToken}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch Facebook data');
            }
            
            const data = await response.json();
            
            return {
                followers: data.followers_count || 0,
                likes: data.fan_count || 0,
                growth: 5.2 // This would be calculated from historical data
            };
        } catch (error) {
            throw new Error(`Facebook API error: ${error.message}`);
        }
    }

    async fetchInstagramData() {
        // This would make real API calls to Instagram Graph API
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        try {
            const response = await fetch(
                `${this.config.api.instagram.baseUrl}/me?fields=${this.config.api.instagram.userFields}&access_token=${this.accessToken}`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch Instagram data');
            }
            
            const data = await response.json();
            
            return {
                followers: data.followers_count || 0,
                posts: data.media_count || 0,
                growth: 8.7 // This would be calculated from historical data
            };
        } catch (error) {
            throw new Error(`Instagram API error: ${error.message}`);
        }
    }

    updateCombinedStats() {
        // Get current values
        const fbFollowers = this.parseNumber(document.getElementById('fbFollowersCount').textContent);
        const igFollowers = this.parseNumber(document.getElementById('igFollowersCount').textContent);
        const fbGrowth = parseFloat(document.getElementById('fbGrowth').textContent.replace('+', '').replace('%', ''));
        const igGrowth = parseFloat(document.getElementById('igGrowth').textContent.replace('+', '').replace('%', ''));

        // Update combined stats
        const totalFollowers = fbFollowers + igFollowers;
        const avgGrowth = ((fbGrowth + igGrowth) / 2).toFixed(1);
        
        document.getElementById('totalFollowers').textContent = this.formatNumber(totalFollowers);
        document.getElementById('monthlyGrowth').textContent = `+${avgGrowth}%`;
        document.getElementById('avgEngagement').textContent = '3.2%'; // Mock data
        document.getElementById('lastSync').textContent = '0m';
    }

    async loadPagesAndStart() {
        // List pages and pick one, then start polling
        const pagesResp = await new Promise((resolve, reject) => {
            FB.api('/me/accounts', { fields: 'id,name,access_token,instagram_business_account' }, (resp) => {
                if (!resp || resp.error) return reject(resp?.error || 'Failed to load pages');
                resolve(resp);
            });
        });
        const pages = pagesResp.data || [];
        if (!pages.length) {
            this.showError('No Facebook Pages found. Ensure pages_show_list permission was granted.');
            return;
        }

        // Populate selector
        this.setupPageSelector(pages);

        // Prefer a page with IG linked, else first
        let selected = pages.find(p => p.instagram_business_account) || pages[0];
        this.pageId = selected.id;
        this.pageAccessToken = selected.access_token;
        this.igUserId = selected.instagram_business_account?.id || null;

        this.startRealtimeStream();
    }

    setupPageSelector(pages) {
        const sel = document.getElementById('pageSelector');
        if (!sel) return;
        sel.innerHTML = '';
        pages.forEach(p => {
            const opt = document.createElement('option');
            opt.value = JSON.stringify({ id: p.id, token: p.access_token, ig: p.instagram_business_account?.id || null, name: p.name });
            opt.textContent = p.name + (p.instagram_business_account ? ' (IG linked)' : '');
            sel.appendChild(opt);
        });
        sel.disabled = false;
        sel.addEventListener('change', () => {
            try {
                const val = JSON.parse(sel.value);
                this.pageId = val.id;
                this.pageAccessToken = val.token;
                this.igUserId = val.ig;
                this.startRealtimeStream();
            } catch (e) {}
        });
    }

    startRealtimeStream() {
        // Client-only polling every N ms
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }

        const fbLoading = document.getElementById('fbFollowersLoading');
        const fbContent = document.getElementById('fbFollowersContent');
        const fbError = document.getElementById('fbFollowersError');
        const igLoading = document.getElementById('igFollowersLoading');
        const igContent = document.getElementById('igFollowersContent');
        const igError = document.getElementById('igFollowersError');

        // Show loading initially
        [fbLoading, igLoading].forEach(el => el.classList.remove('d-none'));
        [fbContent, igContent].forEach(el => el.classList.add('d-none'));
        [fbError, igError].forEach(el => el.classList.add('d-none'));

        const poll = async () => {
            try {
                // Facebook Page counts
                const fb = await new Promise((resolve, reject) => {
                    FB.api('/' + this.pageId, { fields: 'name,fan_count,followers_count', access_token: this.pageAccessToken }, (resp) => {
                        if (!resp || resp.error) return reject(resp?.error || 'FB page error');
                        resolve(resp);
                    });
                });

                document.getElementById('fbFollowersCount').textContent = this.formatNumber(fb.followers_count || 0);
                document.getElementById('fbLikes').textContent = this.formatNumber(fb.fan_count || 0);
                document.getElementById('fbGrowth').textContent = '+0%';
                fbLoading.classList.add('d-none');
                fbContent.classList.remove('d-none');

                // Instagram (if linked)
                if (this.igUserId) {
                    const ig = await new Promise((resolve, reject) => {
                        FB.api('/' + this.igUserId, { fields: 'username,followers_count,media_count', access_token: this.pageAccessToken }, (resp) => {
                            if (!resp || resp.error) return reject(resp?.error || 'IG error');
                            resolve(resp);
                        });
                    });

                    document.getElementById('igFollowersCount').textContent = this.formatNumber(ig.followers_count || 0);
                    document.getElementById('igPosts').textContent = this.formatNumber(ig.media_count || 0);
                    document.getElementById('igGrowth').textContent = '+0%';
                    igLoading.classList.add('d-none');
                    igContent.classList.remove('d-none');
                } else {
                    igLoading.classList.add('d-none');
                    igError.classList.remove('d-none');
                    document.getElementById('igErrorMessage').textContent = 'No Instagram Business account linked to the selected Page';
                }

                // Combined
                const fbFollowers = this.parseNumber(document.getElementById('fbFollowersCount').textContent);
                const igFollowers = this.parseNumber(document.getElementById('igFollowersCount').textContent || '0');
                document.getElementById('totalFollowers').textContent = this.formatNumber(fbFollowers + igFollowers);
                this.updateLastSyncTime();
            } catch (err) {
                console.error('Polling error', err);
                fbLoading.classList.add('d-none');
                fbError.classList.remove('d-none');
                document.getElementById('fbErrorMessage').textContent = (err && err.message) || 'Error loading data';
            }
        };

        // Run now and on interval
        poll();
        const interval = this.config.settings.autoRefreshInterval || 10000;
        this.pollTimer = setInterval(poll, interval);
    }

    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            console.log('Auto-refreshing data...');
            this.refreshAllData();
        }, this.config.settings.autoRefreshInterval);
    }

    async refreshAllData() {
        const refreshBtn = document.getElementById('refreshData');
        refreshBtn.classList.add('loading-state');
        
        try {
            if (this.config.demo.enabled) {
                await this.loadAllData();
            } else {
                // Force one poll tick
                await new Promise((resolve) => {
                    // call poll once by restarting stream which runs immediately
                    if (this.pollTimer) {
                        clearInterval(this.pollTimer);
                        this.pollTimer = null;
                    }
                    this.startRealtimeStream();
                    resolve();
                });
            }
            this.updateLastSyncTime();
            
            // Show success feedback
            this.showNotification('Data refreshed successfully!', 'success');
            
        } catch (error) {
            console.error('Refresh error:', error);
            this.showNotification('Failed to refresh data', 'error');
        } finally {
            refreshBtn.classList.remove('loading-state');
        }
    }

    async bootstrapFromServer() {
        try {
            const res = await fetch('/api/status', { credentials: 'include' });
            const data = await res.json();
            if (data.authenticated || data.tokenMode) {
                // We can stream immediately
                if (data.user?.name) this.userInfo = { name: data.user.name, picture: { data: { url: '' } } };
                this.showDashboard();
                this.startRealtimeStream();
                return;
            }
        } catch (e) {
            // ignore
        }
        // Otherwise show login screen (default UI state)
    }

    logout() {
        if (this.config.demo.enabled) {
            // Demo mode logout
            this.performLogout();
            return;
        }

        FB.logout((response) => {
            console.log('Logged out:', response);
            this.performLogout();
        });
    }

    performLogout() {
        // Clear user data
        this.accessToken = null;
        this.userInfo = null;
        
        // Clear auto-refresh
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        // Show login page
        document.getElementById('dashboard').classList.add('d-none');
        document.getElementById('loginPage').classList.remove('d-none');
        
        console.log('User logged out successfully');
    }

    checkLoginStatus() {
        if (this.config.demo.enabled) {
            // In demo mode, always show login page initially
            return;
        }

        FB.getLoginStatus((response) => {
            if (response.status === 'connected') {
                this.accessToken = response.authResponse.accessToken;
                this.userAccessToken = response.authResponse.accessToken;
                this.getUserInfo().then(() => {
                    this.showDashboard();
                    this.loadPagesAndStart();
                });
            }
        });
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    parseNumber(str) {
        const cleaned = str.replace(/[KM]/g, '');
        const num = parseFloat(cleaned);
        if (str.includes('M')) return num * 1000000;
        if (str.includes('K')) return num * 1000;
        return num;
    }

    updateLastSyncTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('lastUpdated').textContent = timeStr;
    }

    showError(message) {
        console.error('Error:', message);
        // You could add a toast notification here
        alert(message); // Simple error display
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // You could implement a proper notification system here
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.socialMediaDashboard = new SocialMediaDashboard();
    // Bridge global callbacks used by the XFBML login button
    window.checkLoginState = () => window.socialMediaDashboard.checkLoginState();
    window.statusChangeCallback = (response) => window.socialMediaDashboard.statusChangeCallback(response);
});
