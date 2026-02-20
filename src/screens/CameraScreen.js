import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    Animated, StatusBar, Alert, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useObstacleDetection } from '../hooks/useObstacleDetection';
import { useTTS } from '../hooks/useTTS';
import { useHaptics } from '../hooks/useHaptics';
import { useApp } from '../context/AppContext';
import { colors, spacing, fontSize, fontWeight, radius } from '../config/theme';

const { width, height } = Dimensions.get('window');

const SEVERITY_COLOR = {
    danger: colors.danger,
    warning: colors.warning,
    safe: colors.safe,
};

const SEVERITY_LABEL = {
    danger: '⚠️ DANGER',
    warning: '⚡ WARNING',
    safe: '✅ CLEAR',
};

const SEVERITY_BG = {
    danger: 'rgba(255,23,68,0.15)',
    warning: 'rgba(255,171,0,0.15)',
    safe: 'rgba(0,230,118,0.15)',
};

export default function CameraScreen({ navigation }) {
    const { t } = useTranslation();
    const { language } = useApp();
    const [permission, requestPermission] = useCameraPermissions();
    const { detections, isRunning, start, stop, stats } = useObstacleDetection();
    const { speak } = useTTS();
    const { danger, warning } = useHaptics();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const lastAlertRef = useRef(null);
    const lastAlertClassRef = useRef(null);
    const [autoSpeak, setAutoSpeak] = useState(true);

    // ── Pulse & scan animations ──────────────────────────────────────────────
    useEffect(() => {
        if (isRunning) {
            // Pulsing dot
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.25, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
            // Scan line animation
            Animated.loop(
                Animated.timing(scanLineAnim, {
                    toValue: 1, duration: 2200, useNativeDriver: true,
                })
            ).start();
        } else {
            pulseAnim.setValue(1);
            scanLineAnim.setValue(0);
        }
    }, [isRunning]);

    // ── Announce detections via TTS + haptic ─────────────────────────────────
    useEffect(() => {
        if (!isRunning || detections.length === 0 || !autoSpeak) return;
        const now = Date.now();
        const top = detections[0]; // Closest / most severe

        // Throttle alerts: 3s general + re-alert if different object
        const isDifferentObject = top.class !== lastAlertClassRef.current;
        if (!lastAlertRef.current || now - lastAlertRef.current > 3000 || isDifferentObject) {
            lastAlertRef.current = now;
            lastAlertClassRef.current = top.class;

            const distText = top.distanceM < 1
                ? (language === 'hi' ? 'एक मीटर से कम' : 'less than 1 meter')
                : `${top.distanceM} ${language === 'hi' ? 'मीटर' : 'meters'}`;

            let msg;
            if (language === 'hi') {
                msg = top.severity === 'danger'
                    ? `खतरा! ${top.distanceM < 1 ? 'बहुत पास में' : distText + ' पर'} ${top.class} है। रुकें!`
                    : top.severity === 'warning'
                        ? `सावधान! ${top.class} ${distText} आगे है।`
                        : `${top.class} ${distText} आगे दिखा।`;
            } else {
                msg = top.severity === 'danger'
                    ? `Danger! ${top.class} detected ${distText} ahead. Stop immediately!`
                    : top.severity === 'warning'
                        ? `Warning! ${top.class} ${distText} ahead. Be careful.`
                        : `${top.class} spotted ${distText} ahead.`;
            }

            speak(msg);
            if (top.severity === 'danger') danger();
            else if (top.severity === 'warning') warning();
        }
    }, [detections]);

    const toggleDetection = async () => {
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                Alert.alert(
                    'Camera Permission',
                    'Camera access is required for obstacle detection. Tap OK to open settings.',
                    [{ text: 'OK' }]
                );
            }
        }
        if (isRunning) {
            stop();
            speak(language === 'hi' ? 'पहचान बंद। पथ स्कैनिंग रुकी।' : 'Detection stopped. Scanning ended.');
        } else {
            start();
            speak(language === 'hi' ? 'बाधा पहचान शुरू। आगे के रास्ते को स्कैन कर रहा हूँ।' : 'Obstacle detection started. Scanning your path. I will alert you to hazards.');
        }
    };

    const worstSeverity = detections.length > 0
        ? (detections.some(d => d.severity === 'danger') ? 'danger'
            : detections.some(d => d.severity === 'warning') ? 'warning' : 'safe')
        : null;

    const statusColor = worstSeverity ? SEVERITY_COLOR[worstSeverity] : colors.primary;

    const scanLineTranslateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height * 0.65],
    });

    const sessionTime = stats.sessionStart
        ? Math.floor((Date.now() - stats.sessionStart) / 1000)
        : 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Camera or placeholder */}
            {permission?.granted ? (
                <CameraView style={StyleSheet.absoluteFill} facing="back" />
            ) : (
                <LinearGradient
                    colors={['#0a0a1a', '#1a1a1a']}
                    style={[StyleSheet.absoluteFill, styles.noCameraView]}
                >
                    <Text style={styles.noCameraText}>📷</Text>
                    <Text style={styles.noCameraLabel}>Camera unavailable</Text>
                    <Text style={styles.noCameraHint}>Real-time detections are still active</Text>
                </LinearGradient>
            )}

            {/* Dark overlay */}
            <View style={styles.overlay} />

            {/* Scan line animation */}
            {isRunning && (
                <Animated.View
                    style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
                />
            )}

            {/* Corner scan brackets */}
            {isRunning && (
                <>
                    <View style={[styles.bracket, styles.bracketTL]} />
                    <View style={[styles.bracket, styles.bracketTR]} />
                    <View style={[styles.bracket, styles.bracketBL]} />
                    <View style={[styles.bracket, styles.bracketBR]} />
                </>
            )}

            {/* Top bar */}
            <SafeAreaView style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => { stop(); navigation.goBack(); }}
                    style={styles.backBtn}
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Obstacle Detection</Text>
                <TouchableOpacity
                    style={styles.speakToggle}
                    onPress={() => setAutoSpeak(v => !v)}
                    accessibilityLabel={autoSpeak ? 'Mute voice alerts' : 'Enable voice alerts'}
                >
                    <Text style={styles.speakToggleText}>{autoSpeak ? '🔊' : '🔇'}</Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* Bounding box overlays */}
            {isRunning && detections.map((det, i) => {
                const [x, y, bw, bh] = det.bbox;
                const scale = width / 375;
                return (
                    <View
                        key={det.id || i}
                        style={[
                            styles.bbox,
                            {
                                left: x * scale,
                                top: y * 0.7 + 100,
                                width: bw * scale,
                                height: bh * 0.7,
                                borderColor: SEVERITY_COLOR[det.severity],
                            },
                        ]}
                    >
                        <View style={[styles.bboxLabel, { backgroundColor: SEVERITY_COLOR[det.severity] }]}>
                            <Text style={styles.bboxText}>
                                {det.emoji} {det.class} · {det.distanceM}m
                            </Text>
                        </View>
                    </View>
                );
            })}

            {/* Status banner */}
            {isRunning && worstSeverity && (
                <View style={[styles.statusBanner, {
                    borderColor: statusColor,
                    backgroundColor: SEVERITY_BG[worstSeverity],
                }]}>
                    <Text style={[styles.statusBannerText, { color: statusColor }]}>
                        {SEVERITY_LABEL[worstSeverity]}
                    </Text>
                    {detections[0] && (
                        <Text style={styles.statusDetailText}>
                            {detections[0].emoji} {detections[0].class} · {detections[0].distanceM}m ahead
                        </Text>
                    )}
                </View>
            )}

            {/* Bottom control panel */}
            <View style={styles.bottom}>
                {/* Stats bar when running */}
                {isRunning && stats.sessionStart && (
                    <View style={styles.statsRow}>
                        <View style={styles.statChip}>
                            <Text style={styles.statValue}>{detections.length}</Text>
                            <Text style={styles.statLabel}>Detected</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Text style={[styles.statValue, { color: colors.danger }]}>
                                {detections.filter(d => d.severity === 'danger').length}
                            </Text>
                            <Text style={styles.statLabel}>Dangers</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Text style={[styles.statValue, { color: colors.warning }]}>
                                {detections.filter(d => d.severity === 'warning').length}
                            </Text>
                            <Text style={styles.statLabel}>Warnings</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Text style={styles.statValue}>{stats.totalDetected}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                    </View>
                )}

                {/* Scan indicator */}
                {isRunning && (
                    <Animated.View style={[styles.scanIndicator, { transform: [{ scale: pulseAnim }] }]}>
                        <View style={[styles.scanDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.scanText, { color: statusColor }]}>
                            {worstSeverity === null || worstSeverity === 'safe'
                                ? (language === 'hi' ? 'रास्ता साफ है' : t('camera_safe'))
                                : t('camera_scanning')
                            }
                        </Text>
                    </Animated.View>
                )}

                {/* Detection cards */}
                {detections.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.detectScrollList}
                        contentContainerStyle={styles.detectScrollContent}
                    >
                        {detections.slice(0, 5).map((d, i) => (
                            <View
                                key={d.id || i}
                                style={[styles.detectCard, { borderLeftColor: SEVERITY_COLOR[d.severity] }]}
                            >
                                <Text style={styles.detectEmoji}>{d.emoji}</Text>
                                <Text style={styles.detectClass}>{d.class}</Text>
                                <Text style={[styles.detectDist, { color: SEVERITY_COLOR[d.severity] }]}>
                                    {d.distanceM}m
                                </Text>
                                <Text style={styles.detectScore}>{Math.round(d.score * 100)}%</Text>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Toggle button */}
                <TouchableOpacity
                    onPress={toggleDetection}
                    style={[styles.toggleBtn, {
                        backgroundColor: isRunning ? colors.danger : colors.safe,
                        shadowColor: isRunning ? colors.danger : colors.safe,
                    }]}
                    accessibilityRole="button"
                    accessibilityLabel={isRunning ? t('camera_stop') : t('camera_start')}
                >
                    <Text style={styles.toggleBtnText}>
                        {isRunning ? '⏹ ' + t('camera_stop') : '▶ ' + t('camera_start')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    noCameraView: { alignItems: 'center', justifyContent: 'center' },
    noCameraText: { fontSize: 72, marginBottom: 16 },
    noCameraLabel: { fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.bold },
    noCameraHint: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 8 },

    // Scan effects
    scanLine: {
        position: 'absolute',
        left: 0, right: 0, height: 2,
        backgroundColor: colors.primary,
        opacity: 0.7,
        shadowColor: colors.primary,
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    bracket: {
        position: 'absolute',
        width: 30, height: 30,
        borderColor: colors.primary,
        opacity: 0.8,
    },
    bracketTL: { top: 100, left: 20, borderTopWidth: 2, borderLeftWidth: 2 },
    bracketTR: { top: 100, right: 20, borderTopWidth: 2, borderRightWidth: 2 },
    bracketBL: { bottom: 260, left: 20, borderBottomWidth: 2, borderLeftWidth: 2 },
    bracketBR: { bottom: 260, right: 20, borderBottomWidth: 2, borderRightWidth: 2 },

    // Top bar
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
    },
    backBtn: { minWidth: 70 },
    backBtnText: { color: colors.textPrimary, fontSize: fontSize.md },
    screenTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    speakToggle: { minWidth: 44, alignItems: 'flex-end' },
    speakToggleText: { fontSize: 22 },

    // Bounding boxes
    bbox: {
        position: 'absolute', borderWidth: 2, borderRadius: 4,
        justifyContent: 'flex-start',
    },
    bboxLabel: {
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
        alignSelf: 'flex-start',
    },
    bboxText: { color: '#fff', fontSize: 11, fontWeight: fontWeight.bold },

    // Status banner
    statusBanner: {
        position: 'absolute', top: 120, alignSelf: 'center',
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center',
    },
    statusBannerText: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold },
    statusDetailText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },

    // Bottom panel
    bottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: spacing.lg, paddingBottom: 48,
        backgroundColor: 'rgba(10,10,26,0.90)',
        borderTopWidth: 1, borderTopColor: colors.border,
    },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm,
    },
    statChip: { alignItems: 'center' },
    statValue: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
    scanIndicator: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    scanDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    scanText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
    detectScrollList: { marginBottom: spacing.sm },
    detectScrollContent: { gap: 8, paddingHorizontal: 2 },
    detectCard: {
        alignItems: 'center',
        backgroundColor: colors.bgCard, borderRadius: radius.md,
        padding: spacing.sm, borderLeftWidth: 3, minWidth: 80,
    },
    detectEmoji: { fontSize: 20, marginBottom: 2 },
    detectClass: {
        color: colors.textPrimary, fontWeight: fontWeight.semibold,
        textTransform: 'capitalize', fontSize: fontSize.xs, textAlign: 'center',
    },
    detectDist: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, marginTop: 2 },
    detectScore: { color: colors.textMuted, fontSize: 10 },
    toggleBtn: {
        padding: 18, borderRadius: radius.full, alignItems: 'center',
        shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },
    toggleBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
