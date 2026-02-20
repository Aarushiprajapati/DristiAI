import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';

export const useHaptics = () => {
    const { hapticEnabled } = useApp();

    const warning = useCallback(() => {
        if (!hapticEnabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, [hapticEnabled]);

    const danger = useCallback(() => {
        if (!hapticEnabled) return;
        // Double impact for danger
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
    }, [hapticEnabled]);

    const success = useCallback(() => {
        if (!hapticEnabled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [hapticEnabled]);

    const light = useCallback(() => {
        if (!hapticEnabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [hapticEnabled]);

    const medium = useCallback(() => {
        if (!hapticEnabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [hapticEnabled]);

    return { warning, danger, success, light, medium };
};
