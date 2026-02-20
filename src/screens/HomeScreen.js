import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, ScrollView, StatusBar, Modal, TextInput,
    Vibration, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTTS } from '../hooks/useTTS';
import { useHaptics } from '../hooks/useHaptics';
import { useApp } from '../context/AppContext';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { colors, spacing, fontSize, fontWeight, radius } from '../config/theme';

const { width } = Dimensions.get('window');

const MAIN_BUTTONS = [
    {
        id: 'nav',
        labelKey: 'home_start_nav',
        emoji: '🗺️',
        screen: 'Navigation',
        gradient: ['#6C63FF', '#4A44C6'],
        shadowColor: '#6C63FF',
        a11yHint: 'Opens turn-by-turn voice navigation',
        ttsMsg: { en: 'Opening navigation. Say your destination.', hi: 'नेविगेशन खोल रहे हैं।' },
    },
    {
        id: 'camera',
        labelKey: 'home_detect',
        emoji: '🎯',
        screen: 'Camera',
        gradient: ['#00BFA5', '#00897B'],
        shadowColor: '#00BFA5',
        a11yHint: 'Opens real-time obstacle detection camera',
        ttsMsg: { en: 'Opening obstacle detection. I will alert you to nearby hazards.', hi: 'बाधा पहचान खोल रहे हैं।' },
    },
    {
        id: 'settings',
        labelKey: 'home_settings',
        emoji: '⚙️',
        screen: 'Settings',
        gradient: ['#455A8A', '#2C3E66'],
        shadowColor: '#455A8A',
        a11yHint: 'Opens app settings',
        ttsMsg: { en: 'Opening settings.', hi: 'सेटिंग्स खोल रहे हैं।' },
    },
];

export default function HomeScreen({ navigation }) {
    const { t } = useTranslation();
    const { speak, stop: stopTTS } = useTTS();
    const { light, success } = useHaptics();
    const { user, isDemoMode, language, voiceAssistantEnabled } = useApp();
    const {
        processCommand,
        executeAction,
        isListening,
        isAutoActive,
        lastResponse,
        autoActivate,
        startListening,
        stopListening,
    } = useVoiceCommands(navigation);

    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [voiceInput, setVoiceInput] = useState('');
    const [voiceModalText, setVoiceModalText] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const listenRingAnim = useRef(new Animated.Value(0)).current;
    const listenRingLoopRef = useRef(null);

    // ── Entrance animation ────────────────────────────────────────────────────
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();

        // Auto-activate voice assistant (no click needed) after UI is ready
        if (voiceAssistantEnabled) {
            const timer = setTimeout(() => {
                autoActivate();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, []);

    // ── Listening ring pulse animation ────────────────────────────────────────
    useEffect(() => {
        if (isListening) {
            listenRingLoopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(listenRingAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                    Animated.timing(listenRingAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
                ])
            );
            listenRingLoopRef.current.start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
                ])
            ).start();
        } else {
            listenRingAnim.setValue(0);
            pulseAnim.setValue(1);
            if (listenRingLoopRef.current) listenRingLoopRef.current.stop();
        }
    }, [isListening]);

    // ── Greeting ──────────────────────────────────────────────────────────────
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home_greeting_morning');
        if (hour < 17) return t('home_greeting_afternoon');
        return t('home_greeting_evening');
    };

    // ── Button press handler ──────────────────────────────────────────────────
    const handlePress = useCallback((screen, btn) => {
        light();
        const msg = btn.ttsMsg[language] || btn.ttsMsg.en;
        speak(msg);
        navigation.navigate(screen);
    }, [light, speak, language, navigation]);

    const handleSOSPress = useCallback(() => {
        success();
        Vibration.vibrate(200);
        const msg = language === 'hi'
            ? 'एसओएस खोल रहे हैं। कृपया शांत रहें।'
            : 'Opening emergency SOS. Stay calm.';
        speak(msg);
        navigation.navigate('SOS');
    }, [success, speak, language, navigation]);

    const handleVoiceCommand = useCallback(() => {
        if (!voiceInput.trim()) return;
        processCommand(voiceInput.trim());
        setVoiceInput('');
        setShowVoiceModal(false);
    }, [voiceInput, processCommand]);

    const openVoiceModal = () => {
        setShowVoiceModal(true);
        const prompt = language === 'hi'
            ? 'आप क्या करना चाहते हैं?'
            : 'What would you like to do? Say: navigate, camera, SOS, settings, or stop.';
        speak(prompt);
    };

    const listenRingOpacity = listenRingAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });
    const listenRingScale = listenRingAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1.3],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0a0a1a', '#0f0f25']} style={StyleSheet.absoluteFill} />

            {/* Decorative glow */}
            <View style={styles.topGlow} />

            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Header ── */}
                    <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.headerTop}>
                            <View>
                                <Text style={styles.greeting}>{getGreeting()}</Text>
                                <Text style={styles.userName}>
                                    {user?.displayName || user?.email?.split('@')[0] || 'Friend'}
                                </Text>
                            </View>
                            {isDemoMode && (
                                <View style={styles.demoBadge}>
                                    <Text style={styles.demoBadgeText}>🚀 Demo</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* ── Voice Assistant Status ── */}
                    <Animated.View style={[styles.voiceStatusCard, { opacity: fadeAnim }]}>
                        <View style={styles.voiceStatusLeft}>
                            <Animated.View style={[
                                styles.listeningRing,
                                {
                                    opacity: isListening ? listenRingOpacity : 0.2,
                                    transform: [{ scale: isListening ? listenRingScale : 1 }],
                                }
                            ]} />
                            <Text style={styles.voiceDot}>{isListening ? '🟢' : '⚫'}</Text>
                            <View>
                                <Text style={styles.voiceStatusTitle}>
                                    {isListening
                                        ? (language === 'hi' ? 'सुन रहा हूँ...' : 'Listening...')
                                        : (language === 'hi' ? 'वॉइस असिस्टेंट' : 'Voice Assistant')
                                    }
                                </Text>
                                {lastResponse ? (
                                    <Text style={styles.voiceStatusSub} numberOfLines={1}>
                                        {lastResponse.length > 40 ? lastResponse.slice(0, 40) + '…' : lastResponse}
                                    </Text>
                                ) : (
                                    <Text style={styles.voiceStatusSub}>
                                        {language === 'hi' ? 'बोलें: नेविगेट, कैमरा, एसओएस' : 'Say: navigate, camera, SOS...'}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.voiceToggleBtn, isListening && styles.voiceToggleBtnActive]}
                            onPress={isListening ? stopListening : startListening}
                            accessibilityLabel={isListening ? 'Stop voice assistant' : 'Start voice assistant'}
                        >
                            <Text style={styles.voiceToggleBtnText}>{isListening ? '⏹' : '🎤'}</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── App Logo ── */}
                    <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>👁</Text>
                        </View>
                        <Text style={styles.appTitle}>DrishtiAI</Text>
                        <Text style={styles.appSubtitle}>AI eyes for safe navigation</Text>
                    </Animated.View>

                    {/* ── Main action buttons ── */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        {MAIN_BUTTONS.map((btn) => (
                            <TouchableOpacity
                                key={btn.id}
                                style={[styles.mainBtn, { shadowColor: btn.shadowColor }]}
                                onPress={() => handlePress(btn.screen, btn)}
                                accessibilityRole="button"
                                accessibilityLabel={t(btn.labelKey)}
                                accessibilityHint={btn.a11yHint}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={btn.gradient}
                                    style={styles.mainBtnInner}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.mainBtnEmoji}>{btn.emoji}</Text>
                                    <Text style={styles.mainBtnLabel}>{t(btn.labelKey)}</Text>
                                    <Text style={styles.mainBtnArrow}>→</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>

                    {/* ── SOS button ── */}
                    <Animated.View style={[styles.sosWrap, { opacity: fadeAnim }]}>
                        <TouchableOpacity
                            onPress={handleSOSPress}
                            style={styles.sosBtn}
                            accessibilityRole="button"
                            accessibilityLabel={t('home_sos')}
                            accessibilityHint="Sends emergency SOS alert to your contacts"
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.danger, '#C62828']}
                                style={styles.sosBtnInner}
                            >
                                <Text style={styles.sosBtnEmoji}>🆘</Text>
                                <Text style={styles.sosBtnLabel}>{t('home_sos')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── Voice command hint ── */}
                    <Text style={styles.voiceHint}>
                        {language === 'hi'
                            ? '🎤 बोलें: "नेविगेट", "कैमरा", "एसओएस", "सेटिंग"'
                            : '🎤 Say: "Navigate", "Camera", "SOS", "Settings", "Help"'}
                    </Text>
                </ScrollView>
            </SafeAreaView>

            {/* ── Floating Mic Button ── */}
            <Animated.View style={[styles.voiceFabWrap, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity
                    style={styles.voiceFab}
                    onPress={openVoiceModal}
                    accessibilityRole="button"
                    accessibilityLabel="Open voice command input"
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={isListening ? [colors.safe, '#00B96B'] : [colors.primary, colors.primaryDark]}
                        style={styles.voiceFabInner}
                    >
                        <Text style={styles.voiceFabEmoji}>{isListening ? '🎙️' : '🎤'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Voice Command Modal ── */}
            <Modal visible={showVoiceModal} transparent animationType="slide" onRequestClose={() => setShowVoiceModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>🎤 Voice Commands</Text>
                        <Text style={styles.modalSubtitle}>
                            {language === 'hi'
                                ? 'नीचे दिए बटन टैप करें या टाइप करें'
                                : 'Tap a command below — OR type it in the box'}
                        </Text>

                        {/* ── Big direct action buttons ── */}
                        <View style={styles.directBtnsGrid}>
                            {[
                                { label: 'Start Navigation', emoji: '🗺️', action: 'navigate', color: '#6C63FF' },
                                { label: 'Obstacle Detection', emoji: '🎯', action: 'camera', color: '#00BFA5' },
                                { label: 'Emergency SOS', emoji: '🆘', action: 'sos', color: '#FF1744' },
                                { label: 'Settings', emoji: '⚙️', action: 'settings', color: '#455A8A' },
                                { label: 'Where am I?', emoji: '📍', action: 'where', color: '#FF6F00' },
                                { label: 'Current Time', emoji: '🕐', action: 'time', color: '#00838F' },
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.action}
                                    style={[styles.directBtn, { borderColor: item.color }]}
                                    onPress={() => {
                                        setShowVoiceModal(false);
                                        // Call executeAction directly — no need for text processing
                                        executeAction(item.action);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={item.label}
                                >
                                    <Text style={styles.directBtnEmoji}>{item.emoji}</Text>
                                    <Text style={[styles.directBtnLabel, { color: item.color }]}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Divider */}
                        <View style={styles.orRow}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>OR TYPE A COMMAND</Text>
                            <View style={styles.orLine} />
                        </View>

                        {/* Text input fallback */}
                        <TextInput
                            style={styles.modalInput}
                            value={voiceInput}
                            onChangeText={setVoiceInput}
                            placeholder='e.g. "open camera" or "start navigation"'
                            placeholderTextColor={colors.textMuted}
                            returnKeyType="go"
                            onSubmitEditing={handleVoiceCommand}
                            accessibilityLabel="Voice command input"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.bgElevated }]}
                                onPress={() => setShowVoiceModal(false)}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleVoiceCommand}
                            >
                                <Text style={styles.modalBtnText}>Execute ▶</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: 100 },
    topGlow: {
        position: 'absolute',
        top: -100, alignSelf: 'center',
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: colors.primary, opacity: 0.07,
    },
    header: { marginBottom: spacing.md },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greeting: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
    userName: { fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.bold, marginTop: 2 },
    demoBadge: {
        backgroundColor: colors.primary + '33', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary,
    },
    demoBadgeText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

    // Voice status card
    voiceStatusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bgCard,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    voiceStatusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    listeningRing: {
        position: 'absolute',
        left: -4,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.safe,
        zIndex: -1,
    },
    voiceDot: { fontSize: 14 },
    voiceStatusTitle: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    voiceStatusSub: { color: colors.textMuted, fontSize: 11, marginTop: 2, maxWidth: width - 160 },
    voiceToggleBtn: {
        backgroundColor: colors.bgElevated,
        borderRadius: radius.full,
        width: 44, height: 44,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    voiceToggleBtnActive: { backgroundColor: colors.safe + '33', borderColor: colors.safe },
    voiceToggleBtnText: { fontSize: 18 },

    // Logo
    logoArea: { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.md },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: colors.primary + '22',
        borderWidth: 2, borderColor: colors.primary,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    logoEmoji: { fontSize: 38 },
    appTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
    appSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },

    // Main buttons
    mainBtn: {
        borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md,
        shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10,
    },
    mainBtnInner: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.lg, paddingVertical: 22,
    },
    mainBtnEmoji: { fontSize: 28, marginRight: spacing.md },
    mainBtnLabel: { flex: 1, color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    mainBtnArrow: { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.xl },

    // SOS
    sosWrap: { marginTop: spacing.xs },
    sosBtn: {
        borderRadius: radius.lg, overflow: 'hidden',
        shadowColor: colors.danger, shadowOpacity: 0.5,
        shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 15,
    },
    sosBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 26, gap: spacing.md,
    },
    sosBtnEmoji: { fontSize: 30 },
    sosBtnLabel: { color: '#fff', fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold },

    voiceHint: {
        textAlign: 'center', color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.lg,
        lineHeight: 22,
    },

    // Floating mic button
    voiceFabWrap: {
        position: 'absolute', bottom: 32, right: 24,
    },
    voiceFab: {
        width: 68, height: 68, borderRadius: 34, overflow: 'hidden',
        shadowColor: colors.primary, shadowOpacity: 0.5,
        shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12,
    },
    voiceFabInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    voiceFabEmoji: { fontSize: 28 },

    // Voice Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: colors.bgElevated,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: spacing.xl, paddingBottom: 48,
    },
    modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
    modalSubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
    commandChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
    commandChip: {
        backgroundColor: colors.primary + '33', borderWidth: 1, borderColor: colors.primary,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    },
    commandChipText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    modalInput: {
        backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.md, padding: spacing.md, color: colors.textPrimary,
        fontSize: fontSize.lg, marginBottom: spacing.lg,
    },
    modalActions: { flexDirection: 'row', gap: spacing.md },
    modalBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    modalBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },

    // Modal handle
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md,
    },

    // Direct action button grid (2 columns)
    directBtnsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md,
    },
    directBtn: {
        width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.bgCard, borderWidth: 1.5, borderRadius: radius.md,
        paddingHorizontal: spacing.sm, paddingVertical: 14,
    },
    directBtnEmoji: { fontSize: 22 },
    directBtnLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, flexShrink: 1 },

    // OR divider
    orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    orLine: { flex: 1, height: 1, backgroundColor: colors.border },
    orText: { color: colors.textMuted, fontSize: 10, marginHorizontal: spacing.sm, letterSpacing: 1 },
});
