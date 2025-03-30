class App {
    constructor() {
        this.currentView = 'home';
        this.initializeApp();
        this.setupEventListeners();
    }

    initializeApp() {
        // Check authentication
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.isAuthenticated) {
            window.location.href = 'auth.html';
            return;
        }

        MedicationData.loadFromStorage();
        this.renderView(this.currentView);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Profile
        this.setupProfileHandlers();
    }

    setupProfileHandlers() {
        const profileBtn = document.getElementById('profileBtn');
        const profileSidebar = document.getElementById('profileSidebar');
        const overlay = document.getElementById('overlay');
        const closeProfile = document.getElementById('closeProfile');
        const logoutBtn = document.getElementById('logoutBtn');

        profileBtn.addEventListener('click', () => {
            profileSidebar.classList.add('active');
            overlay.classList.add('active');
        });

        closeProfile.addEventListener('click', () => {
            profileSidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', () => {
            profileSidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update view
        this.currentView = view;
        this.renderView(view);
    }

    renderView(view) {
        const content = document.querySelector('.content');
        content.innerHTML = this.getViewContent(view);
    }

    getViewContent(view) {
        // Add view content from previous responses
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            window.location.href = 'auth.html';
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 