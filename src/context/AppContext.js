import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
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
    const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState(true);

    // Load persisted settings and listen for auth changes
    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            // 1. Load settings first
            try {
                const stored = await AsyncStorage.getItem('@drishti_settings');
                if (stored && isMounted) {
                    const s = JSON.parse(stored);
                    if (s.language) {
                        setLanguage(s.language);
                        i18n.changeLanguage(s.language);
                    }
                    if (s.voiceSpeed !== undefined) setVoiceSpeed(s.voiceSpeed);
                    if (s.sensitivity !== undefined) setSensitivity(s.sensitivity);
                    if (s.hapticEnabled !== undefined) setHapticEnabled(s.hapticEnabled);
                    if (s.highContrast !== undefined) setHighContrast(s.highContrast);
                    if (s.emergencyContacts) setEmergencyContacts(s.emergencyContacts);
                    if (s.voiceAssistantEnabled !== undefined) setVoiceAssistantEnabled(s.voiceAssistantEnabled);
                }
            } catch (e) {
                console.warn('Failed to load settings:', e);
            }

            // 2. Then set up the Auth listener
            console.log('Setting up Auth listener...');
            const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
                console.log('Auth state changed:', firebaseUser ? 'Logged In' : 'Logged Out');
                if (isMounted) {
                    if (firebaseUser) {
                        setUser(firebaseUser);
                        setIsDemoMode(false);
                    } else {
                        // Only clear if not in demo mode
                        setUser(prev => prev?.uid === 'demo' ? prev : null);
                    }
                    setIsLoading(false);
                }
            }, (error) => {
                console.error('Auth state error:', error);
                if (isMounted) setIsLoading(false);
            });

            return unsubscribe;
        };

        let authUnsubscribe;
        initialize().then(unsub => {
            authUnsubscribe = unsub;
        });

        return () => {
            isMounted = false;
            if (authUnsubscribe) authUnsubscribe();
        };
    }, []);

    const saveSettings = async (updates) => {
        try {
            const current = {
                language, voiceSpeed, sensitivity, hapticEnabled, highContrast,
                emergencyContacts, voiceAssistantEnabled,
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

    const toggleVoiceAssistant = () => {
        const next = !voiceAssistantEnabled;
        setVoiceAssistantEnabled(next);
        saveSettings({ voiceAssistantEnabled: next });
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

    // Centralized logout function
    const logout = useCallback(async () => {
        try {
            if (!isDemoMode) {
                await firebaseSignOut(firebaseAuth);
            }
        } catch (e) {
            console.warn('Sign out error:', e);
        }
        setUser(null);
        setIsDemoMode(false);
    }, [isDemoMode]);

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
                voiceAssistantEnabled, toggleVoiceAssistant,
                logout,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
