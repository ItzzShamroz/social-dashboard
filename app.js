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
        
        // Check if user is already logged in
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
        
        // Refresh data button
        document.getElementById('refreshData').addEventListener('click', () => this.refreshAllData());
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
                    scope: 'email,pages_read_engagement,instagram_basic'
                });
            });

            if (response.authResponse) {
                this.accessToken = response.authResponse.accessToken;
                await this.getUserInfo();
                this.showDashboard();
                await this.loadAllData();
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
        
        try {
            // Load Facebook data
            await this.loadFacebookData();
            
            // Load Instagram data
            await this.loadInstagramData();
            
            // Update combined stats
            this.updateCombinedStats();
            
            // Set up auto-refresh
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
            await this.loadAllData();
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
                this.getUserInfo().then(() => {
                    this.showDashboard();
                    this.loadAllData();
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
});
