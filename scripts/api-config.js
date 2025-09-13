// API Configuration
// This file contains the backend API endpoint configuration

const API_CONFIG = {
    // Use your deployed backend URL
    BASE_URL: 'https://code-d-code-website-backend.onrender.com',
    
    // API endpoints
    ENDPOINTS: {
        CONTACT: '/api/contact',
        MEMBERSHIP: '/api/membership',
        HEALTH: '/health'
    },

    // Get full endpoint URL
    getEndpoint: function(endpoint) {
        return this.BASE_URL + this.ENDPOINTS[endpoint];
    },

    // Default headers for API requests
    getHeaders: function() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
}
