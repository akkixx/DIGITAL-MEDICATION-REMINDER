class DMRApp {
    constructor() {
        this.currentView = 'home';
        this.views = {
            home: document.querySelector('.content'),
            history: null,
            meds: null,
            settings: null
        };
        this.isProfileOpen = false;
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.checkAuth();
        this.initializeApp();
        this.setupEventListeners();
    }

    checkAuth() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.isAuthenticated) {
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    }

    initializeApp() {
        if (!this.checkAuth()) return;

        // Load user data
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Update header with user info
        const profileIcon = document.querySelector('.profile-icon');
        if (profileIcon) {
            profileIcon.textContent = user.name.charAt(0);
        }

        // Initialize other app features
        MedicationData.loadFromStorage();
        this.renderCurrentView();
        this.startMedicationTimer();

        // Load saved theme preference
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'true') {
            document.body.classList.add('dark-mode');
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            await Notification.requestPermission();
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelector('.nav-bar').addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const view = navItem.querySelector('span:last-child').textContent.toLowerCase();
                this.switchView(view);
            }
        });

        // Search
        const searchInput = document.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Profile
        const profileIcon = document.querySelector('.profile-icon');
        if (profileIcon) {
            profileIcon.addEventListener('click', (e) => {
                e.preventDefault();
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || !user.isAuthenticated) {
                    window.location.href = 'auth.html';
                } else {
            this.toggleProfile();
                }
        });
        }

        // Close profile
        const closeProfile = document.querySelector('.close-profile');
        if (closeProfile) {
            closeProfile.addEventListener('click', () => {
            this.closeProfile();
        });
        }

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isProfileOpen && !e.target.closest('.profile-sidebar') && !e.target.closest('.profile-icon')) {
            this.closeProfile();
            }
        });

        // Dark mode toggle
        document.querySelector('.nav-bar').addEventListener('click', (e) => {
            if (e.target.closest('.nav-item') && 
                e.target.closest('.nav-item').querySelector('span:last-child').textContent === 'Settings') {
                this.switchView('settings');
            }
        });

        // Calendar navigation
        document.querySelector('.prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.querySelector('.next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Medication confirmation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('confirm-btn')) {
                const medCard = e.target.closest('.medication-card');
                if (medCard) {
                    this.confirmMedication(medCard.dataset.medId);
                }
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    switchView(view) {
        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', 
                item.querySelector('span:last-child').textContent.toLowerCase() === view);
        });

        this.currentView = view;
        this.renderCurrentView();
    }

    renderCurrentView() {
        const mainContent = document.querySelector('.content');
        mainContent.innerHTML = '';

        switch (this.currentView) {
            case 'home':
                this.renderHomeView(mainContent);
                break;
            case 'history':
                this.renderHistoryView(mainContent);
                break;
            case 'meds':
                this.renderMedsView(mainContent);
                break;
            case 'settings':
                this.renderSettingsView(mainContent);
                break;
            case 'pharmacy':
                this.renderPharmacyView(mainContent);
                break;
        }
    }

    renderHomeView(container) {
        const todaysMeds = this.getTodaysMedications();
        const upcomingMeds = this.getUpcomingMedications();

        container.innerHTML = `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">Today's Medications</h2>
                    <span class="date">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div class="medication-list">
                    ${this.renderMedicationCards(todaysMeds)}
                </div>
            </section>

            ${this.renderLowStockAlerts()}

            ${this.renderUpcomingSection()}
        `;
    }

    renderHistoryView(container) {
        const history = MedicationData.medicationHistory;
        container.innerHTML = `
            <section class="section">
                <h2 class="section-title">Medication History</h2>
                ${history.map(item => `
                    <div class="medication-card">
                        <div class="med-info">
                            <div class="med-icon">💊</div>
                            <div>
                                <h3>${item.name}</h3>
                                <p>${item.action} • ${new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </section>
        `;
    }

    renderMedsView(container) {
        container.innerHTML = `
            <section class="section">
                <h2 class="section-title">My Medications</h2>
                ${MedicationData.medications.map(med => `
                    <div class="medication-card">
                        <div class="med-info">
                            <div class="med-icon">💊</div>
                            <div>
                                <h3>${med.name}</h3>
                                <p>${med.dosage.amount} ${med.dosage.unit} • ${med.time}</p>
                                <p>Stock: ${med.stockCount} remaining</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </section>
        `;
    }

    renderSettingsView(container) {
        container.innerHTML = `
            <div class="settings-view">
                <!-- Profile Settings -->
                <section class="settings-section">
                    <h2 class="section-title">Profile Settings</h2>
                    <div class="profile-settings">
                        <div class="profile-edit">
                            <div class="avatar-edit">
                                <div class="user-avatar large">${this.getUserInitials()}</div>
                                <button class="edit-avatar-btn">Change Photo</button>
                            </div>
                            <div class="profile-fields">
                                <div class="form-group">
                                    <label>Name</label>
                                    <input type="text" id="userName" value="${MedicationData.currentUser.name}">
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" id="userEmail" value="${MedicationData.currentUser.email}">
                                </div>
                            </div>
                            <button class="save-profile-btn">Save Changes</button>
                        </div>
                    </div>
                </section>

                <!-- Notification Preferences -->
                <section class="settings-section">
                    <h2 class="section-title">Notifications</h2>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-info">
                                <i class="icon">🔔</i>
                                <div>
                                    <span>Push Notifications</span>
                                    <p class="setting-description">Medication reminders</p>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="pushToggle" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <i class="icon">📱</i>
                                <div>
                                    <span>SMS Reminders</span>
                                    <p class="setting-description">Text message alerts</p>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="smsToggle">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <i class="icon">📧</i>
                                <div>
                                    <span>Email Reports</span>
                                    <p class="setting-description">Weekly medication summary</p>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="emailToggle">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- App Preferences -->
                <section class="settings-section">
                    <h2 class="section-title">App Preferences</h2>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-info">
                                <i class="icon">🌓</i>
                                <div>
                                    <span>Dark Mode</span>
                                    <p class="setting-description">Switch app theme</p>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="darkModeToggle">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <i class="icon">🔊</i>
                                <div>
                                    <span>Sound Effects</span>
                                    <p class="setting-description">App sounds and alerts</p>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="soundToggle" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <i class="icon">🌍</i>
                                <div>
                                    <span>Language</span>
                                    <p class="setting-description">Choose app language</p>
                                </div>
                            </div>
                            <select id="languageSelect" class="settings-select">
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                            </select>
                        </div>
                    </div>
                </section>

                <!-- Privacy & Security -->
                <section class="settings-section">
                    <h2 class="section-title">Privacy & Security</h2>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-info">
                                <i class="icon">🔒</i>
                                <div>
                                    <span>App Lock</span>
                                    <p class="setting-description">Require authentication to open</p>
                                </div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="appLockToggle">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <button class="settings-action-btn" onclick="app.changePassword()">
                            <i class="icon">🔑</i>
                            <span>Change Password</span>
                        </button>
                        <button class="settings-action-btn" onclick="app.exportData()">
                            <i class="icon">📤</i>
                            <span>Export Health Data</span>
                        </button>
                    </div>
                </section>

                <!-- Account Actions -->
                <section class="settings-section danger-zone">
                    <h2 class="section-title">Account Actions</h2>
                    <div class="settings-list">
                        <button class="danger-btn" onclick="app.deleteAccount()">
                            <i class="icon">⚠️</i>
                            <span>Delete Account</span>
                        </button>
                        <button class="logout-btn" onclick="app.logout()">
                            <i class="icon">🚪</i>
                            <span>Log Out</span>
                        </button>
                    </div>
                </section>
            </div>
        `;

        this.setupSettingsEventListeners(container);
    }

    setupSettingsEventListeners(container) {
        const darkModeToggle = container.querySelector('#darkModeToggle');
        darkModeToggle.addEventListener('change', () => {
            this.toggleDarkMode();
        });

        const notificationToggle = container.querySelector('#notificationToggle');
        notificationToggle.addEventListener('change', (e) => {
            MedicationData.currentUser.settings.notifications = e.target.checked;
            MedicationData.saveToStorage();
        });

        const soundToggle = container.querySelector('#soundToggle');
        soundToggle.addEventListener('change', (e) => {
            MedicationData.currentUser.settings.sound = e.target.checked;
            MedicationData.saveToStorage();
        });

        const logoutBtn = container.querySelector('#logoutBtn');
        logoutBtn.addEventListener('click', () => this.logout());
    }

    renderPharmacyView(container) {
        container.innerHTML = `
            <section class="pharmacy-view">
                <h2 class="section-title">Nearby Pharmacies</h2>
                
                <div class="pharmacy-search">
                    <input type="text" class="search-input" placeholder="Search pharmacies or medications...">
                </div>
                
                <div class="pharmacy-list">
                    ${this.renderPharmacyList()}
                </div>
            </section>
        `;

        // Add search functionality
        const searchInput = container.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.handlePharmacySearch(e.target.value);
        });
    }

    renderPharmacyList() {
        const pharmacies = [
            {
                name: "HealthCare Pharmacy",
                address: "123 Main St",
                distance: "0.3 miles",
                status: "Open",
                hasDelivery: true
            },
            {
                name: "MedPlus",
                address: "456 Oak Ave",
                distance: "0.7 miles",
                status: "Open",
                hasDelivery: true
            },
            {
                name: "City Drugs",
                address: "789 Pine St",
                distance: "1.2 miles",
                status: "Closes Soon",
                hasDelivery: false
            }
        ];

        return pharmacies.map(pharmacy => `
            <div class="pharmacy-card">
                <div class="pharmacy-icon">💊</div>
                <div class="pharmacy-info">
                    <h3>${pharmacy.name}</h3>
                    <p>${pharmacy.address}</p>
                    <p>
                        <span class="pharmacy-status ${pharmacy.status.toLowerCase()}">${pharmacy.status}</span>
                        ${pharmacy.hasDelivery ? '• Delivery Available' : ''}
                    </p>
                </div>
                <div class="pharmacy-distance">${pharmacy.distance}</div>
            </div>
        `).join('');
    }

    handlePharmacySearch(query) {
        // Implement pharmacy search logic
    }

    getTodaysMedications() {
        return MedicationData.medications.filter(med => 
            med.status === 'pending' && this.isMedicationForToday(med)
        );
    }

    getUpcomingMedications() {
        return MedicationData.medications.filter(med => 
            med.status === 'upcoming' && this.isMedicationForToday(med)
        );
    }

    isMedicationForToday(medication) {
        const now = new Date();
        const medTime = new Date(medication.nextDose);
        return medTime.toDateString() === now.toDateString();
    }

    renderMedicationCards(medications, isUpcoming = false) {
        return medications.map(med => `
            <div class="medication-card" data-med-id="${med.id}">
                <div class="med-info">
                    <div class="med-icon">💊</div>
                    <div>
                        <h3>${med.name}</h3>
                        <p>${med.dosage.amount} ${med.dosage.unit} • ${med.time}</p>
                    </div>
                </div>
                ${isUpcoming ? 
                    `<span style="color: #666">In ${this.getTimeUntil(med.nextDose)}</span>` :
                    '<button class="confirm-btn">CONFIRM</button>'}
            </div>
        `).join('');
    }

    renderLowStockAlerts() {
        const lowStockMeds = MedicationData.medications.filter(med => 
            med.stockCount <= med.lowStockThreshold
        );

        return lowStockMeds.length > 0 ? `
            <section class="section">
                <div class="alert">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span>⚠️</span>
                        <strong>Low Stock Alert</strong>
                    </div>
                    <p>Stock is running low for <span style="color: var(--alert-color)">${lowStockMeds[0].name}</span> 
                       (${lowStockMeds[0].stockCount} doses left)</p>
                    <p>Please contact your pharmacy.</p>
                </div>
            </section>
        ` : '';
    }

    getTimeUntil(timestamp) {
        const diff = new Date(timestamp) - new Date();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h` : `${minutes}m`;
    }

    handleSearch(query) {
        const medications = MedicationData.medications;
        if (!query) {
            this.renderCurrentView();
            return;
        }

        const filtered = medications.filter(med => 
            med.name.toLowerCase().includes(query.toLowerCase())
        );

        const searchResults = document.createElement('section');
        searchResults.className = 'section';
        searchResults.innerHTML = `
            <h2 class="section-title">Search Results</h2>
            ${this.renderMedicationCards(filtered)}
        `;

        const content = document.querySelector('.content');
        content.innerHTML = '';
        content.appendChild(searchResults);
    }

    confirmMedication(medId) {
        const medication = MedicationData.medications.find(med => med.id === medId);
        if (medication) {
            medication.status = 'taken';
            medication.stockCount--;
            MedicationData.addToHistory(medication, 'taken');

            this.showNotification(medication.name);
            this.renderCurrentView();
        }
    }

    showNotification(medName, isReminder = false) {
        // Create alarm container
        const alarmContainer = document.createElement('div');
        alarmContainer.className = 'alarm-popup' + (isReminder ? ' reminder' : '');
        
        // Add alarm content
        alarmContainer.innerHTML = `
            <div class="alarm-content">
                <div class="alarm-header">
                    <span class="alarm-icon">${isReminder ? '⏰' : '✅'}</span>
                    <h3>${isReminder ? 'Medication Reminder' : 'Medication Taken'}</h3>
                    <button class="close-alarm">✕</button>
                </div>
                <div class="alarm-body">
                    <p class="med-name">${medName}</p>
                    <p class="alarm-message">
                        ${isReminder ? 'Time to take your medication!' : 'Good job! Get Med\'d'}
                    </p>
                    ${isReminder ? `
                        <div class="alarm-actions">
                            <button class="confirm-alarm">
                                <span class="icon">✓</span>
                                Take Now
                            </button>
                            <button class="snooze-alarm">
                                <span class="icon">⏰</span>
                                Snooze 5m
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add to body
        document.body.appendChild(alarmContainer);

        // Play sound if enabled
        if (MedicationData.currentUser.settings.sound) {
            const audio = new Audio('assets/notification.mp3');
            audio.play();
        }

        // Setup event listeners
        const closeBtn = alarmContainer.querySelector('.close-alarm');
        const confirmBtn = alarmContainer.querySelector('.confirm-alarm');
        const snoozeBtn = alarmContainer.querySelector('.snooze-alarm');

        closeBtn.addEventListener('click', () => {
            alarmContainer.classList.add('fade-out');
            setTimeout(() => alarmContainer.remove(), 300);
        });

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmMedication(medName);
                alarmContainer.remove();
            });
        }

        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => {
                // Snooze for 5 minutes
                setTimeout(() => {
                    this.showNotification(medName, true);
                }, 5 * 60 * 1000);
                
                alarmContainer.classList.add('fade-out');
                setTimeout(() => alarmContainer.remove(), 300);
            });
        }

        // Auto-dismiss after 30 seconds if not a reminder
        if (!isReminder) {
            setTimeout(() => {
                if (document.body.contains(alarmContainer)) {
                    alarmContainer.classList.add('fade-out');
                    setTimeout(() => alarmContainer.remove(), 300);
                }
            }, 30000);
        }

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
            new Notification('DMR - Digital Medication Reminder', {
                body: isReminder ? `Time to take ${medName}` : `Good job! Get Med'd - ${medName} taken`,
                icon: '💊'
            });
        }
    }

    startMedicationTimer() {
        setInterval(() => {
            this.checkMedicationSchedule();
        }, 60000); // Check every minute
    }

    checkMedicationSchedule() {
        const now = new Date();
        MedicationData.medications.forEach(med => {
            const medTime = new Date(med.nextDose);
            if (medTime <= now && med.status === 'upcoming') {
                med.status = 'pending';
                this.renderCurrentView();
                
                if (MedicationData.currentUser.settings.notifications) {
                    this.showNotification(med.name, true);
                }
            }
        });
    }

    toggleProfile() {
        const profileSidebar = document.querySelector('.profile-sidebar');
        const overlay = document.querySelector('.overlay');
        
        if (!profileSidebar || !overlay) {
            console.error('Profile sidebar or overlay elements not found');
            return;
        }

        if (this.isProfileOpen) {
            this.closeProfile();
        } else {
            this.openProfile();
        }
    }

    openProfile() {
        if (!this.isProfileOpen) {
            const profileSidebar = document.querySelector('.profile-sidebar');
            const overlay = document.querySelector('.overlay');
            
            profileSidebar.classList.add('active');
            overlay.classList.add('active');
            this.isProfileOpen = true;
            
            // Update profile content with user data
            this.updateProfileContent();
        }
    }

    closeProfile() {
        const profileSidebar = document.querySelector('.profile-sidebar');
        const overlay = document.querySelector('.overlay');
        
        profileSidebar.classList.remove('active');
        overlay.classList.remove('active');
        this.isProfileOpen = false;
    }

    updateProfileContent() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        const profileContent = `
            <div class="profile-header">
                <div class="profile-header-content">
                    <div class="profile-avatar">${user.name.charAt(0)}</div>
                    <div class="profile-info">
                        <h2>${user.name}</h2>
                        <p>${user.email}</p>
                    </div>
                </div>
                <span class="close-profile">✕</span>
            </div>
            <div class="profile-content">
                <div class="profile-section">
                    <div class="profile-stats">
                        <div class="stat-card">
                            <h4>Total Meds</h4>
                            <p class="total-meds">${MedicationData.medications.length}</p>
                        </div>
                        <div class="stat-card">
                            <h4>Taken Today</h4>
                            <p class="taken-today">${this.getTodaysMedicationCount()}</p>
                        </div>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="action-btn" onclick="window.location.href='settings.html'">
                        <i class="icon">⚙️</i>
                        Settings
                    </button>
                    <button class="action-btn" id="logoutBtn">
                        <i class="icon">🚪</i>
                        Logout
                    </button>
                </div>
            </div>
        `;

        const profileSidebar = document.querySelector('.profile-sidebar');
        if (profileSidebar) {
            profileSidebar.innerHTML = profileContent;
        }
    }

    getTodaysMedicationCount() {
        // Count medications taken today
        return MedicationData.medicationHistory.filter(med => {
            const today = new Date().toDateString();
            const medDate = new Date(med.timestamp).toDateString();
            return today === medDate;
        }).length;
    }

    logout() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('user');
            window.location.href = 'auth.html';
        }
    }

    renderUpcomingSection() {
        return `
        <section class="section upcoming-section">
            <div class="section-header">
                <h2 class="section-title">Upcoming</h2>
                <button class="view-all-btn">View All</button>
            </div>
            <div class="upcoming-timeline">
                ${this.getUpcomingMedications().map(med => `
                    <div class="timeline-item">
                        <div class="time-marker">
                            <span class="time">${med.time}</span>
                            <div class="timeline-line"></div>
                        </div>
                        <div class="medication-card upcoming" data-med-id="${med.id}">
                            <div class="med-info">
                                <div class="med-icon-container">
                                    <span class="med-icon">💊</span>
                                    <span class="time-remaining">${this.getTimeUntil(med.nextDose)}</span>
                                </div>
                                <div class="med-details">
                                    <h3>${med.name}</h3>
                                    <p>${med.dosage.amount} ${med.dosage.unit}</p>
                                    <div class="med-tags">
                                        ${med.withFood ? '<span class="tag">With Food</span>' : ''}
                                        ${med.important ? '<span class="tag important">Important</span>' : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="med-actions">
                                <button class="action-btn remind">
                                    <span class="icon">⏰</span>
                                    Remind
                                </button>
                                <button class="action-btn skip">
                                    <span class="icon">⏭️</span>
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>`;
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        document.querySelector('.month-year').textContent = 
            this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        const calendarGrid = document.querySelector('.calendar-grid');
        calendarGrid.innerHTML = '';

        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            if (day === this.selectedDate.getDate() && 
                month === this.selectedDate.getMonth() && 
                year === this.selectedDate.getYear()) {
                dayElement.classList.add('active');
            }

            dayElement.addEventListener('click', () => {
                this.selectedDate = new Date(year, month, day);
                this.renderCalendar();
                // You can add functionality to show medications for selected date
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    exportMedicationData() {
        const data = {
            medications: MedicationData.medications,
            history: MedicationData.medicationHistory,
            user: MedicationData.currentUser
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medication_history.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    shareWithDoctor() {
        // Implement share functionality
        alert('Share with doctor feature coming soon!');
    }

    showAnalytics() {
        // Implement analytics view
        alert('Analytics feature coming soon!');
    }

    syncData() {
        // Implement sync functionality
        alert('Data synced successfully!');
    }

    showClearDataConfirmation() {
        if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
            localStorage.clear();
            alert('Data cleared successfully. The app will now reload.');
            window.location.reload();
        }
    }

    getUserInitials() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return '';
        return user.name.split(' ').map(name => name.charAt(0)).join('');
    }

    renderUserPanel() {
        const userPanel = `
            <div class="user-panel">
                <!-- User Header -->
                <div class="user-header">
                    <div class="user-profile">
                        <div class="user-avatar">${this.getUserInitials()}</div>
                        <div class="user-info">
                            <h3>${MedicationData.currentUser.name}</h3>
                            <span class="user-status ${MedicationData.currentUser.isGuest ? 'guest' : 'premium'}">
                                ${MedicationData.currentUser.isGuest ? 'Guest User' : 'Premium Member'}
                            </span>
                        </div>
                    </div>
                    <button class="close-panel">✕</button>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                    <div class="stat-item">
                        <span class="stat-value">${this.getTodaysMedicationCount()}</span>
                        <span class="stat-label">Today's Meds</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${this.getAdherenceRate()}%</span>
                        <span class="stat-label">Adherence</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">🔥 ${this.getStreak()}</span>
                        <span class="stat-label">Day Streak</span>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="action-btn" onclick="app.showMedSchedule()">
                        <i class="icon">📅</i>
                        <span>View Schedule</span>
                    </button>
                    <button class="action-btn" onclick="app.showReports()">
                        <i class="icon">📊</i>
                        <span>Health Reports</span>
                    </button>
                    <button class="action-btn" onclick="app.connectDoctor()">
                        <i class="icon">👨‍⚕️</i>
                        <span>Connect Doctor</span>
                    </button>
                </div>

                <!-- Health Insights -->
                <div class="health-insights">
                    <h4>Health Insights</h4>
                    <div class="insight-card">
                        <i class="icon">⚡</i>
                        <div class="insight-info">
                            <h5>Adherence Trend</h5>
                            <p>Your medication adherence has improved by 15% this week!</p>
                        </div>
                    </div>
                </div>

                <!-- Connected Devices -->
                <div class="connected-devices">
                    <h4>Connected Devices</h4>
                    <div class="device-list">
                        <div class="device-item">
                            <i class="icon">📱</i>
                            <span>iPhone 13 Pro</span>
                            <span class="device-status active">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return userPanel;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new DMRApp();
}); 