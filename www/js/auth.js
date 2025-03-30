class AuthenticationSystem {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Guest Mode
        document.getElementById('guestModeBtn').addEventListener('click', () => {
            this.handleGuestMode();
        });
    }

    // Add authentication methods from previous responses
}

// Initialize authentication
document.addEventListener('DOMContentLoaded', () => {
    new AuthenticationSystem();
}); 