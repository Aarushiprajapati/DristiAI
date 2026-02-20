import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth } from '../config/firebase';
import i18n from '../i18n';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [language, setLanguage] = useState('en');
    const [voiceSpeed, setVoiceSpeed] = useState(0.9);
    const [sensitivity, setSensitivity] = useState(0.5); // 0 = low, 1 = high
    const [hapticEnabled, setHapticEnabled] = useState(true);
    const [highContrast, setHighContrast] = useState(false);
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load persisted settings and listen for auth changes
    useEffect(() => {
        loadSettings();

        // Listen for Firebase Auth changes
        const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setIsDemoMode(false);
            } else {
                // Only clear if not in demo mode
                setUser(prev => prev?.uid === 'demo' ? prev : null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem('@drishti_settings');
            if (stored) {
                const s = JSON.parse(stored);
                if (s.language) { setLanguage(s.language); i18n.changeLanguage(s.language); }
                if (s.voiceSpeed !== undefined) setVoiceSpeed(s.voiceSpeed);
                if (s.sensitivity !== undefined) setSensitivity(s.sensitivity);
                if (s.hapticEnabled !== undefined) setHapticEnabled(s.hapticEnabled);
                if (s.highContrast !== undefined) setHighContrast(s.highContrast);
                if (s.emergencyContacts) setEmergencyContacts(s.emergencyContacts);
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (updates) => {
        try {
            const current = {
                language, voiceSpeed, sensitivity, hapticEnabled, highContrast, emergencyContacts,
                ...updates,
            };
            await AsyncStorage.setItem('@drishti_settings', JSON.stringify(current));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    };

    const updateLanguage = (lang) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        saveSettings({ language: lang });
    };

    const updateVoiceSpeed = (speed) => {
        setVoiceSpeed(speed);
        saveSettings({ voiceSpeed: speed });
    };

    const updateSensitivity = (val) => {
        setSensitivity(val);
        saveSettings({ sensitivity: val });
    };

    const toggleHaptic = () => {
        const next = !hapticEnabled;
        setHapticEnabled(next);
        saveSettings({ hapticEnabled: next });
    };

    const toggleHighContrast = () => {
        const next = !highContrast;
        setHighContrast(next);
        saveSettings({ highContrast: next });
    };

    const addEmergencyContact = (contact) => {
        const updated = [...emergencyContacts, { ...contact, id: Date.now().toString() }];
        setEmergencyContacts(updated);
        saveSettings({ emergencyContacts: updated });
    };

    const removeEmergencyContact = (id) => {
        const updated = emergencyContacts.filter(c => c.id !== id);
        setEmergencyContacts(updated);
        saveSettings({ emergencyContacts: updated });
    };

    return (
        <AppContext.Provider
            value={{
                user, setUser,
                isDemoMode, setIsDemoMode,
                language, updateLanguage,
                voiceSpeed, updateVoiceSpeed,
                sensitivity, updateSensitivity,
                hapticEnabled, toggleHaptic,
                highContrast, toggleHighContrast,
                emergencyContacts, addEmergencyContact, removeEmergencyContact,
                isLoading,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
