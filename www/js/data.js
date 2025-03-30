const MedicationData = {
    currentUser: {
        id: 'user123',
        name: "John's Profile",
        email: 'john@example.com',
        joinDate: '2024-05-01',
        avatar: '👤',
        settings: {
            darkMode: false,
            notifications: true,
            smsAlerts: false,
            timezone: 'America/New_York'
        }
    },

    medications: [
        {
            id: '1',
            name: 'Aspirin',
            dosage: {
                amount: 1,
                unit: 'tablet'
            },
            time: '8:00 AM',
            status: 'pending',
            stockCount: 15,
            lowStockThreshold: 5,
            nextDose: new Date().setHours(8, 0, 0, 0)
        },
        {
            id: '2',
            name: 'Metformin',
            dosage: {
                amount: 1,
                unit: 'tablet'
            },
            time: '9:00 AM',
            status: 'upcoming',
            stockCount: 20,
            lowStockThreshold: 5,
            nextDose: new Date().setHours(9, 0, 0, 0)
        },
        {
            id: '3',
            name: 'Lipitor',
            dosage: {
                amount: 1,
                unit: 'tablet'
            },
            time: '10:00 AM',
            status: 'upcoming',
            stockCount: 2,
            lowStockThreshold: 5,
            nextDose: new Date().setHours(10, 0, 0, 0)
        },
        {
            id: '4',
            name: 'Vitamin D3',
            dosage: {
                amount: 1,
                unit: 'tablet'
            },
            time: '11:00 AM',
            status: 'upcoming',
            stockCount: 30,
            lowStockThreshold: 5
        },
        {
            id: '5',
            name: 'Omega-3',
            dosage: {
                amount: 2,
                unit: 'capsules'
            },
            time: '1:00 PM',
            status: 'upcoming',
            stockCount: 45,
            lowStockThreshold: 10
        },
        {
            id: '6',
            name: 'Calcium',
            dosage: {
                amount: 1,
                unit: 'tablet'
            },
            time: '3:00 PM',
            status: 'upcoming',
            stockCount: 8,
            lowStockThreshold: 5
        }
    ],

    medicationHistory: [],

    profiles: [
        {
            id: 'john123',
            name: "John's Profile",
            isCaregiver: false,
            linkedProfiles: [],
            settings: {
                darkMode: false,
                offlineMode: false,
                accessibility: {
                    fontSize: 'normal',
                    highContrast: false,
                    soundEnabled: true
                }
            }
        }
    ],

    saveToStorage() {
        localStorage.setItem('dmrData', JSON.stringify({
            medications: this.medications,
            history: this.medicationHistory,
            currentUser: this.currentUser
        }));
    },

    loadFromStorage() {
        const stored = localStorage.getItem('dmrData');
        if (stored) {
            const data = JSON.parse(stored);
            this.medications = data.medications;
            this.medicationHistory = data.history;
            this.currentUser = data.currentUser;
        }
    },

    addToHistory(medication, action) {
        this.medicationHistory.unshift({
            ...medication,
            action,
            timestamp: new Date().toISOString()
        });
        this.saveToStorage();
    }
};

// Data structure for a medication
const MedicationSchema = {
    id: String,
    name: String,
    dosage: {
        amount: Number,
        unit: String
    },
    schedule: {
        frequency: String, // daily/weekly/as-needed
        times: Array,
        daysOfWeek: Array // for weekly medications
    },
    stockCount: Number,
    lowStockThreshold: Number,
    profileId: String
};

// Data structure for a profile
const ProfileSchema = {
    id: String,
    name: String,
    isCaregiver: Boolean,
    linkedProfiles: Array
}; 