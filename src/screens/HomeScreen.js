import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated,
    Dimensions, ScrollView, StatusBar, Modal, TextInput,
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
    },
    {
        id: 'camera',
        labelKey: 'home_detect',
        emoji: '🎯',
        screen: 'Camera',
        gradient: ['#00BFA5', '#00897B'],
        shadowColor: '#00BFA5',
        a11yHint: 'Opens real-time obstacle detection camera',
    },
    {
        id: 'settings',
        labelKey: 'home_settings',
        emoji: '⚙️',
        screen: 'Settings',
        gradient: ['#455A8A', '#2C3E66'],
        shadowColor: '#455A8A',
        a11yHint: 'Opens app settings',
    },
];

export default function HomeScreen({ navigation }) {
    const { t } = useTranslation();
    const { speak } = useTTS();
    const { light, success } = useHaptics();
    const { user, isDemoMode } = useApp();
    const { processCommand, isListening } = useVoiceCommands(navigation);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [voiceInput, setVoiceInput] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home_greeting_morning');
        if (hour < 17) return t('home_greeting_afternoon');
        return t('home_greeting_evening');
    };

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();

        // TTS greeting after mount
        const timer = setTimeout(() => {
            speak(t('home_tts_greeting'));
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const handlePress = (screen) => {
        light();
        navigation.navigate(screen);
    };

    const handleSOSPress = () => {
        success();
        navigation.navigate('SOS');
    };

    const handleVoiceCommand = () => {
        if (!voiceInput.trim()) return;
        processCommand(voiceInput.trim());
        setVoiceInput('');
        setShowVoiceModal(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0a0a1a', '#0f0f25']} style={StyleSheet.absoluteFill} />

            {/* Decorative glow */}
            <View style={styles.topGlow} />

            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <Text style={styles.userName}>
                            {user?.displayName || user?.email?.split('@')[0] || 'Friend'}
                        </Text>
                        {isDemoMode && (
                            <View style={styles.demoBadge}>
                                <Text style={styles.demoBadgeText}>🚀 Demo Mode</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* App Logo Area */}
                    <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>👁</Text>
                        </View>
                        <Text style={styles.appTitle}>DrishtiAI</Text>
                        <Text style={styles.appSubtitle}>Your AI eyes for safe navigation</Text>
                    </Animated.View>

                    {/* Main action buttons */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        {MAIN_BUTTONS.map((btn, i) => (
                            <TouchableOpacity
                                key={btn.id}
                                style={[styles.mainBtn, { shadowColor: btn.shadowColor }]}
                                onPress={() => handlePress(btn.screen)}
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

                    {/* SOS button — always visible */}
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

                    <Text style={styles.voiceHint}>
                        💬 Say a voice command or tap a button above
                    </Text>
                </ScrollView>
            </SafeAreaView>

            {/* Voice Command FAB */}
            <TouchableOpacity
                style={styles.voiceFab}
                onPress={() => setShowVoiceModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Open voice commands"
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.voiceFabInner}
                >
                    <Text style={styles.voiceFabEmoji}>🎤</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Voice Command Modal */}
            <Modal visible={showVoiceModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🎤 Voice Command</Text>
                        <Text style={styles.modalSubtitle}>
                            Try: "SOS", "Navigate", "Camera", "Settings", "Stop"
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={voiceInput}
                            onChangeText={setVoiceInput}
                            placeholder="Type or speak a command..."
                            placeholderTextColor={colors.textMuted}
                            autoFocus
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
    scroll: { padding: spacing.lg, paddingBottom: 40 },
    topGlow: {
        position: 'absolute',
        top: -100,
        alignSelf: 'center',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.primary,
        opacity: 0.08,
    },
    header: { marginBottom: spacing.lg },
    greeting: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
    userName: { fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.bold, marginTop: 2 },
    demoBadge: {
        alignSelf: 'flex-start',
        marginTop: 8,
        backgroundColor: colors.primary + '33',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    demoBadgeText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

    // Logo
    logoArea: { alignItems: 'center', marginBottom: spacing.xl, paddingVertical: spacing.lg },
    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.primary + '22',
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    logoEmoji: { fontSize: 44 },
    appTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
    appSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },

    // Main buttons
    mainBtn: {
        borderRadius: radius.lg,
        overflow: 'hidden',
        marginBottom: spacing.md,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
    },
    mainBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        paddingVertical: 24,
    },
    mainBtnEmoji: { fontSize: 30, marginRight: spacing.md },
    mainBtnLabel: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
    },
    mainBtnArrow: { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.xl },

    // SOS
    sosWrap: { marginTop: spacing.sm },
    sosBtn: {
        borderRadius: radius.lg,
        overflow: 'hidden',
        shadowColor: colors.danger,
        shadowOpacity: 0.5,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 15,
    },
    sosBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 28,
        gap: spacing.md,
    },
    sosBtnEmoji: { fontSize: 32 },
    sosBtnLabel: { color: '#fff', fontSize: fontSize.xxl, fontWeight: fontWeight.extrabold },

    voiceHint: {
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: fontSize.sm,
        marginTop: spacing.xl,
    },

    // Voice Command FAB
    voiceFab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
    },
    voiceFabInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    voiceFabEmoji: { fontSize: 28 },

    // Voice Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bgElevated,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: spacing.xl,
        paddingBottom: 48,
    },
    modalTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.lg,
    },
    modalInput: {
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: fontSize.lg,
        marginBottom: spacing.lg,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalBtn: {
        flex: 1,
        padding: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    modalBtnText: {
        color: '#fff',
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },
});
