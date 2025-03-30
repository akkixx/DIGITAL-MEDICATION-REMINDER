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
            timezone: 'America/New_York',
            sound: true
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
            nextDose: new Date().setHours(8, 0, 0, 0),
            withFood: true,
            important: true,
            description: 'Take with water',
            color: '#FF6B6B'
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
            nextDose: new Date().setHours(9, 0, 0, 0),
            withFood: true,
            important: true,
            description: 'Take with breakfast',
            color: '#4ECDC4'
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
            nextDose: new Date().setHours(10, 0, 0, 0),
            withFood: false,
            important: true,
            description: 'Take on empty stomach',
            color: '#45B7D1'
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
            lowStockThreshold: 5,
            nextDose: new Date().setHours(11, 0, 0, 0),
            withFood: true,
            important: false,
            description: 'Take with fatty meal',
            color: '#96CEB4'
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
            lowStockThreshold: 10,
            nextDose: new Date().setHours(13, 0, 0, 0),
            withFood: true,
            important: false,
            description: 'Take with lunch',
            color: '#FFD93D'
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
            lowStockThreshold: 5,
            nextDose: new Date().setHours(15, 0, 0, 0),
            withFood: false,
            important: false,
            description: 'Take between meals',
            color: '#FF8B94'
        },
        {
            id: '7',
            name: 'Zinc',
            dosage: {
                amount: 1,
                unit: 'tablet'
            },
            time: '4:00 PM',
            status: 'upcoming',
            stockCount: 12,
            lowStockThreshold: 5,
            nextDose: new Date().setHours(16, 0, 0, 0),
            withFood: false,
            important: false,
            description: 'Take on empty stomach',
            color: '#98B4D4'
        },
        {
            id: '8',
            name: 'Magnesium',
            dosage: {
                amount: 1,
                unit: 'tablet'
            },
            time: '8:00 PM',
            status: 'upcoming',
            stockCount: 25,
            lowStockThreshold: 5,
            nextDose: new Date().setHours(20, 0, 0, 0),
            withFood: false,
            important: false,
            description: 'Take before bed',
            color: '#9B5DE5'
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
    },

    updateMedicationStatus(id, status) {
        const med = this.medications.find(m => m.id === id);
        if (med) {
            med.status = status;
            if (status === 'taken') {
                med.stockCount--;
                this.addToHistory(med, 'taken');
            } else if (status === 'skipped') {
                this.addToHistory(med, 'skipped');
            }
            this.saveToStorage();
        }
    },

    resetDailyMedications() {
        const now = new Date();
        this.medications.forEach(med => {
            const medTime = new Date(med.nextDose);
            if (medTime.toDateString() !== now.toDateString()) {
                med.status = 'upcoming';
                med.nextDose = new Date(now.toDateString() + ' ' + med.time).getTime();
            }
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