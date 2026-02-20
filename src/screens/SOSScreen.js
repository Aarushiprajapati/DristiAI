import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Animated, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { sendSOSAlert } from '../services/sosService';
import { useTTS } from '../hooks/useTTS';
import { useHaptics } from '../hooks/useHaptics';
import { useLocation } from '../hooks/useLocation';
import { useApp } from '../context/AppContext';
import { colors, spacing, fontSize, fontWeight, radius } from '../config/theme';

// SOS countdown seconds
const COUNTDOWN = 5;

export default function SOSScreen({ navigation }) {
    const { t } = useTranslation();
    const { user, emergencyContacts } = useApp();
    const { speak } = useTTS();
    const { danger } = useHaptics();
    const { location, getCurrentLocation } = useLocation();

    const [phase, setPhase] = useState('confirm'); // confirm | countdown | sending | sent | error
    const [countdown, setCountdown] = useState(COUNTDOWN);
    const [alertId, setAlertId] = useState(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    // Pulse the SOS button
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.95, duration: 700, useNativeDriver: true }),
            ])
        ).start();
        // Get location immediately
        getCurrentLocation();
    }, []);

    // Cleanup countdown timer on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startCountdown = () => {
        setPhase('countdown');
        speak(`Sending SOS alert in ${COUNTDOWN} seconds. Double tap Cancel to abort.`);
        danger();
        Vibration.vibrate([0, 200, 100, 200]);

        let count = COUNTDOWN;
        timerRef.current = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count <= 0) {
                clearInterval(timerRef.current);
                sendSOS();
            }
        }, 1000);
    };

    const cancelSOS = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('confirm');
        setCountdown(COUNTDOWN);
        speak('SOS cancelled.');
    };

    const sendSOS = async () => {
        setPhase('sending');
        speak('Sending SOS alert now. Help is coming.');
        Vibration.vibrate([0, 500, 200, 500]);

        try {
            const loc = location || await getCurrentLocation();
            const result = await sendSOSAlert({
                user,
                location: loc,
                emergencyContacts: emergencyContacts.length > 0
                    ? emergencyContacts
                    : [{ name: 'Emergency Services', phone: '112' }],
            });
            setAlertId(result.alertId);
            setPhase('sent');
            speak('SOS sent! Your emergency contacts have been notified and your location has been shared. Stay calm, help is on the way.');
        } catch (error) {
            setPhase('error');
            speak('Failed to send SOS. Please call emergency services directly at 1 1 2.');
        }
    };

    // ── Render based on phase ──────────────────────────────────────────────────

    if (phase === 'sent') {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#0a1a0a', '#0a2a0a']} style={StyleSheet.absoluteFill} />
                <View style={styles.centeredContent}>
                    <Text style={styles.sentIcon}>✅</Text>
                    <Text style={styles.sentTitle}>SOS Sent!</Text>
                    <Text style={styles.sentMsg}>{t('sos_sent')}</Text>
                    {alertId && (
                        <Text style={styles.alertId}>Alert ID: {alertId.slice(0, 10)}...</Text>
                    )}
                    <View style={styles.sentInfo}>
                        <Text style={styles.sentInfoLabel}>📍 Location Shared</Text>
                        <Text style={styles.sentInfoLabel}>📞 {emergencyContacts.length || 1} contacts notified</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.homeBtn}
                        onPress={() => navigation.navigate('Home')}
                        accessibilityLabel="Go to home screen"
                    >
                        <Text style={styles.homeBtnText}>← Return to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === 'sending') {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#1a0a0a', '#2a0a0a']} style={StyleSheet.absoluteFill} />
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color={colors.danger} />
                    <Text style={styles.sendingText}>{t('sos_sending')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1a0a0a', '#0a0a1a']} style={StyleSheet.absoluteFill} />

            {/* Back */}
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
            >
                <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.centeredContent}>
                {/* Title */}
                <Text style={styles.title}>{t('sos_title')}</Text>
                <Text style={styles.subtitle}>{t('sos_confirm_msg')}</Text>

                {/* Countdown display */}
                {phase === 'countdown' && (
                    <View style={styles.countdownBox}>
                        <Text style={styles.countdownNum}>{countdown}</Text>
                        <Text style={styles.countdownLabel}>seconds until SOS is sent</Text>
                    </View>
                )}

                {/* Big SOS button */}
                {phase === 'confirm' && (
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            onPress={startCountdown}
                            style={styles.sosCircle}
                            accessibilityRole="button"
                            accessibilityLabel={t('sos_send')}
                        >
                            <LinearGradient
                                colors={[colors.danger, '#7B0000']}
                                style={styles.sosCircleInner}
                            >
                                <Text style={styles.sosEmoji}>🆘</Text>
                                <Text style={styles.sosBtnText}>{t('sos_send')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Emergency contacts */}
                <View style={styles.contactsList}>
                    <Text style={styles.contactsLabel}>📞 Will notify:</Text>
                    {emergencyContacts.length > 0
                        ? emergencyContacts.map(c => (
                            <Text key={c.id} style={styles.contactItem}>• {c.name} · {c.phone}</Text>
                        ))
                        : <Text style={styles.noContacts}>
                            {t('sos_contacts_empty')}
                        </Text>
                    }
                    <Text style={styles.contactItem}>• 🚨 Emergency Services (112)</Text>
                </View>

                {/* Cancel / Cancel countdown */}
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={phase === 'countdown' ? cancelSOS : () => navigation.goBack()}
                    accessibilityLabel={t('sos_cancel')}
                >
                    <Text style={styles.cancelBtnText}>
                        {phase === 'countdown' ? '✕ CANCEL SOS NOW' : t('sos_cancel')}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centeredContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    backBtn: { position: 'absolute', top: 52, left: spacing.lg, zIndex: 10 },
    backBtnText: { color: colors.textSecondary, fontSize: fontSize.md },

    title: {
        fontSize: fontSize.xxxl,
        fontWeight: fontWeight.extrabold,
        color: colors.danger,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },

    // Countdown
    countdownBox: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.xl,
        borderRadius: radius.lg,
        borderWidth: 2,
        borderColor: colors.danger,
        backgroundColor: colors.danger + '15',
    },
    countdownNum: { fontSize: 80, fontWeight: fontWeight.extrabold, color: colors.danger },
    countdownLabel: { fontSize: fontSize.md, color: colors.textSecondary },

    // SOS circle
    sosCircle: {
        width: 220,
        height: 220,
        borderRadius: 110,
        overflow: 'hidden',
        marginBottom: spacing.xl,
        shadowColor: colors.danger,
        shadowOpacity: 0.7,
        shadowRadius: 30,
        elevation: 20,
    },
    sosCircleInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosEmoji: { fontSize: 60, marginBottom: 8 },
    sosBtnText: {
        color: '#fff',
        fontSize: fontSize.xl,
        fontWeight: fontWeight.extrabold,
        letterSpacing: 1,
    },

    // Contacts
    contactsList: {
        backgroundColor: colors.bgCard,
        borderRadius: radius.md,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    contactsLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm, fontWeight: fontWeight.semibold },
    contactItem: { color: colors.textPrimary, fontSize: fontSize.md, marginBottom: 4 },
    noContacts: { color: colors.warning, fontSize: fontSize.sm },

    cancelBtn: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radius.full,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
    },
    cancelBtnText: { color: colors.textSecondary, fontSize: fontSize.md },

    // Sent
    sentIcon: { fontSize: 80, marginBottom: spacing.lg },
    sentTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.safe, marginBottom: spacing.sm },
    sentMsg: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
    alertId: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.lg },
    sentInfo: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, width: '100%', gap: 8, marginBottom: spacing.xl },
    sentInfoLabel: { color: colors.safe, fontSize: fontSize.md },
    homeBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
    homeBtnText: { color: colors.textPrimary, fontSize: fontSize.md },

    // Sending
    sendingText: { color: colors.textPrimary, fontSize: fontSize.xl, marginTop: spacing.lg, fontWeight: fontWeight.bold },
});
