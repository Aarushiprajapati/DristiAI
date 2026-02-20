import { useState, useCallback, useRef, useEffect } from 'react';
import { useTTS } from './useTTS';
import { useApp } from '../context/AppContext';

/**
 * Voice command hook — processes text commands and navigates directly to screens.
 * 
 * FIX: executeAction is now defined BEFORE processCommand so the closure
 * captures the real function reference (not undefined).
 * 
 * Usage:
 *   const { processCommand, startListening, stopListening, autoActivate } = useVoiceCommands(navigation);
 *   processCommand("open camera");        // → navigates to Camera
 *   processCommand("start navigation");   // → navigates to Navigation
 *   processCommand("sos");                // → navigates to SOS
 */

const COMMANDS = {
    en: {
        sos: ['sos', 'help', 'emergency', 'send sos', 'i need help', 'danger', 'send alert', 'call help'],
        navigate: ['navigate', 'navigation', 'directions', 'go to', 'take me to', 'map', 'route', 'start navigation', 'open navigation', 'open map'],
        camera: ['camera', 'detect', 'scan', 'obstacle', 'start camera', 'what is ahead', 'look', 'obstacle detection', 'open camera', 'open detection', 'detect obstacles', 'detection'],
        stop: ['stop', 'cancel', 'pause', 'end', 'quiet', 'silence', 'shut up', 'mute'],
        home: ['home', 'go home', 'main', 'dashboard', 'back home', 'open home'],
        settings: ['settings', 'options', 'preferences', 'configure', 'open settings'],
        repeat: ['repeat', 'say again', 'what did you say', 'pardon', 'come again'],
        where: ['where am i', 'location', 'my location', 'current location', 'where'],
        time: ['time', 'what time', 'clock', 'what is the time'],
    },
    hi: {
        sos: ['मदद', 'एसओएस', 'आपातकाल', 'बचाओ', 'खतरा', 'मुझे मदद चाहिए'],
        navigate: ['नेविगेट', 'दिशा', 'रास्ता', 'ले चलो', 'नक्शा', 'नेविगेशन', 'नेविगेशन खोलो'],
        camera: ['कैमरा', 'स्कैन', 'बाधा', 'देखो', 'आगे क्या है', 'बाधा पहचान', 'कैमरा खोलो', 'पहचान'],
        stop: ['रुको', 'बंद', 'रोको', 'चुप'],
        home: ['होम', 'घर', 'मुख्य', 'होम खोलो'],
        settings: ['सेटिंग', 'विकल्प', 'सेटिंग खोलो'],
        repeat: ['दोहराओ', 'फिर से बोलो'],
        where: ['मैं कहां हूं', 'मेरी लोकेशन', 'स्थान'],
        time: ['समय', 'क्या बजे हैं', 'टाइम'],
    },
};

const GREETING = {
    en: 'Welcome to DrishtiAI. I am ready. Say: navigate, camera, SOS, settings, or help.',
    hi: 'DrishtiAI में आपका स्वागत है। मैं तैयार हूं। बोलें: नेविगेट, कैमरा, एसओएस, सेटिंग, या मदद।',
};

export const useVoiceCommands = (navigation) => {
    const { language, voiceAssistantEnabled } = useApp();
    const { speak } = useTTS();
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState(null);
    const [lastResponse, setLastResponse] = useState('');
    const [isAutoActive, setIsAutoActive] = useState(false);
    const greetedRef = useRef(false);
    const navigationRef = useRef(navigation);

    // Keep navigation ref fresh — avoids stale closure
    useEffect(() => {
        navigationRef.current = navigation;
    }, [navigation]);

    // ─────────────────────────────────────────────────────────────────────────
    // executeAction — MUST be defined before processCommand
    // ─────────────────────────────────────────────────────────────────────────
    const executeAction = useCallback((action, lang) => {
        const nav = navigationRef.current;
        const l = lang || language;

        const say = (en, hi) => {
            const msg = l === 'hi' ? hi : en;
            speak(msg);
            setLastResponse(msg);
        };

        switch (action) {
            case 'camera':
                say(
                    'Opening obstacle detection. I will alert you to nearby hazards.',
                    'बाधा पहचान खोल रहे हैं। मैं आपको पास की बाधाओं के बारे में बताऊंगा।'
                );
                nav?.navigate('Camera');
                break;

            case 'navigate':
                say(
                    'Opening navigation. Tell me your destination.',
                    'नेविगेशन खोल रहे हैं। अपनी मंजिल बताएं।'
                );
                nav?.navigate('Navigation');
                break;

            case 'sos':
                say(
                    'Opening emergency SOS. Stay calm, help is on the way.',
                    'एसओएस खोल रहे हैं। शांत रहें, मदद आ रही है।'
                );
                nav?.navigate('SOS');
                break;

            case 'home':
                say('Going to home screen.', 'होम स्क्रीन पर जा रहे हैं।');
                nav?.navigate('Home');
                break;

            case 'settings':
                say('Opening settings.', 'सेटिंग्स खोल रहे हैं।');
                nav?.navigate('Settings');
                break;

            case 'stop':
                say('Stopped. Say a command whenever you are ready.', 'रुक गया। जब तैयार हों तो बोलें।');
                break;

            case 'repeat':
                if (lastResponse) {
                    speak(lastResponse);
                } else {
                    say('No previous message.', 'कोई पिछला संदेश नहीं।');
                }
                break;

            case 'where':
                say(
                    'Opening navigation to show your current location.',
                    'आपकी वर्तमान स्थान दिखाने के लिए नेविगेशन खोल रहे हैं।'
                );
                nav?.navigate('Navigation');
                break;

            case 'time': {
                const now = new Date();
                const h = now.getHours() % 12 || 12;
                const m = now.getMinutes().toString().padStart(2, '0');
                const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                say(`The time is ${h}:${m} ${ampm}.`, `अभी ${h} बजकर ${m} मिनट हुए हैं।`);
                break;
            }

            default:
                say(
                    'Command not understood. Try: navigate, camera, SOS, settings, or help.',
                    'आदेश समझ नहीं आया। बोलें: नेविगेट, कैमरा, एसओएस, सेटिंग, या मदद।'
                );
        }
    }, [language, speak, lastResponse]);

    // ─────────────────────────────────────────────────────────────────────────
    // processCommand — matches text → action → calls executeAction
    // ─────────────────────────────────────────────────────────────────────────
    const processCommand = useCallback((text) => {
        if (!text) return { matched: false, action: null };

        const lower = text.toLowerCase().trim();
        const commandSet = COMMANDS[language] || COMMANDS.en;

        for (const [action, keywords] of Object.entries(commandSet)) {
            if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
                console.log('[Voice] matched:', action, '← input:', lower);
                setLastCommand(action);
                executeAction(action, language);
                return { matched: true, action };
            }
        }

        // No match found
        const notUnderstood = language === 'hi'
            ? 'आदेश समझ नहीं आया। कृपया बोलें: नेविगेट, कैमरा, एसओएस, या मदद।'
            : 'Command not understood. Try: navigate, camera, SOS, settings, or help.';
        speak(notUnderstood);
        setLastResponse(notUnderstood);
        return { matched: false, action: null };
    }, [language, executeAction, speak]);

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-activate on Home screen mount — greet + start listening
    // ─────────────────────────────────────────────────────────────────────────
    const autoActivate = useCallback(() => {
        if (greetedRef.current || !voiceAssistantEnabled) return;
        greetedRef.current = true;
        setIsAutoActive(true);
        setIsListening(true);
        setTimeout(() => {
            const msg = GREETING[language] || GREETING.en;
            speak(msg);
            setLastResponse(msg);
        }, 1000);
    }, [language, speak, voiceAssistantEnabled]);

    const startListening = useCallback(() => {
        setIsListening(true);
        const msg = language === 'hi' ? 'सुन रहा हूँ... बोलिए।' : 'Listening. Go ahead.';
        speak(msg);
    }, [language, speak]);

    const stopListening = useCallback(() => {
        setIsListening(false);
        setIsAutoActive(false);
        greetedRef.current = false;
    }, []);

    return {
        isListening,
        isAutoActive,
        lastCommand,
        lastResponse,
        processCommand,
        executeAction,
        startListening,
        stopListening,
        autoActivate,
    };
};
