import { useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useApp } from '../context/AppContext';

export const useTTS = () => {
    const { voiceSpeed, language } = useApp();

    const speak = useCallback((text, options = {}) => {
        if (!text) return;
        // Stop current speech before new one
        Speech.stop();
        Speech.speak(text, {
            language: language === 'hi' ? 'hi-IN' : 'en-IN',
            rate: options.rate || voiceSpeed,
            pitch: options.pitch || 1.0,
            onDone: options.onDone,
            onError: options.onError,
        });
    }, [voiceSpeed, language]);

    const stop = useCallback(() => {
        Speech.stop();
    }, []);

    const isSpeaking = useCallback(async () => {
        return await Speech.isSpeakingAsync();
    }, []);

    return { speak, stop, isSpeaking };
};
