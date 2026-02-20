import { useState, useCallback, useRef } from 'react';
import { useTTS } from './useTTS';
import { useApp } from '../context/AppContext';

/**
 * Voice command system for hands-free control.
 * 
 * In a production app, this would integrate with:
 *  - expo-speech-recognition (when available)
 *  - Google Cloud Speech-to-Text API
 *  - On-device speech recognition
 * 
 * Currently provides:
 *  - Command processing (text → action)
 *  - Command vocabulary for en/hi
 *  - Integration hooks for navigation
 */

const COMMANDS = {
    en: {
        sos: ['sos', 'help', 'emergency', 'send sos'],
        navigate: ['navigate', 'navigation', 'directions', 'go to', 'take me to'],
        camera: ['camera', 'detect', 'scan', 'obstacle', 'start camera'],
        stop: ['stop', 'cancel', 'pause', 'end'],
        home: ['home', 'go home', 'main', 'dashboard'],
        settings: ['settings', 'options', 'preferences'],
    },
    hi: {
        sos: ['मदद', 'एसओएस', 'आपातकाल', 'बचाओ'],
        navigate: ['नेविगेट', 'दिशा', 'रास्ता', 'ले चलो'],
        camera: ['कैमरा', 'स्कैन', 'बाधा', 'देखो'],
        stop: ['रुको', 'बंद', 'रोको'],
        home: ['होम', 'घर', 'मुख्य'],
        settings: ['सेटिंग', 'विकल्प'],
    },
};

export const useVoiceCommands = (navigation) => {
    const { language } = useApp();
    const { speak } = useTTS();
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState(null);

    /**
     * Process a text command and execute the matching action.
     * Returns { matched: bool, action: string }
     */
    const processCommand = useCallback((text) => {
        if (!text) return { matched: false, action: null };

        const lower = text.toLowerCase().trim();
        const commandSet = COMMANDS[language] || COMMANDS.en;

        for (const [action, keywords] of Object.entries(commandSet)) {
            if (keywords.some(kw => lower.includes(kw))) {
                setLastCommand(action);
                executeAction(action);
                return { matched: true, action };
            }
        }

        speak(language === 'hi'
            ? 'आदेश समझ नहीं आया। कृपया पुनः प्रयास करें।'
            : 'Command not understood. Please try again.'
        );
        return { matched: false, action: null };
    }, [language, navigation]);

    const executeAction = useCallback((action) => {
        switch (action) {
            case 'sos':
                speak(language === 'hi' ? 'एसओएस खोल रहे हैं' : 'Opening SOS');
                navigation?.navigate('SOS');
                break;
            case 'navigate':
                speak(language === 'hi' ? 'नेविगेशन खोल रहे हैं' : 'Opening navigation');
                navigation?.navigate('Navigation');
                break;
            case 'camera':
                speak(language === 'hi' ? 'कैमरा खोल रहे हैं' : 'Opening obstacle detection');
                navigation?.navigate('Camera');
                break;
            case 'stop':
                speak(language === 'hi' ? 'रुक गया' : 'Stopped');
                break;
            case 'home':
                speak(language === 'hi' ? 'होम पर जा रहे हैं' : 'Going home');
                navigation?.navigate('Home');
                break;
            case 'settings':
                speak(language === 'hi' ? 'सेटिंग्स खोल रहे हैं' : 'Opening settings');
                navigation?.navigate('Settings');
                break;
            default:
                break;
        }
    }, [language, navigation, speak]);

    /**
     * Simulated voice listening toggle.
     * In production, this starts/stops the speech recognizer.
     */
    const startListening = useCallback(() => {
        setIsListening(true);
        speak(language === 'hi' ? 'सुन रहा हूंँ...' : 'Listening...');
    }, [language, speak]);

    const stopListening = useCallback(() => {
        setIsListening(false);
    }, []);

    return {
        isListening,
        lastCommand,
        processCommand,
        startListening,
        stopListening,
        COMMANDS: COMMANDS[language] || COMMANDS.en,
    };
};
