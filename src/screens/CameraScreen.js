import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions,
    Animated, StatusBar, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useObstacleDetection } from '../hooks/useObstacleDetection';
import { useTTS } from '../hooks/useTTS';
import { useHaptics } from '../hooks/useHaptics';
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

export default function CameraScreen({ navigation }) {
    const { t } = useTranslation();
    const [permission, requestPermission] = useCameraPermissions();
    const { detections, isRunning, start, stop } = useObstacleDetection();
    const { speak } = useTTS();
    const { danger, warning } = useHaptics();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const lastAlertRef = useRef(null);

    // Pulse animation for detection indicator
    useEffect(() => {
        if (isRunning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRunning]);

    // Announce detections via TTS + haptic, throttled to 3s
    useEffect(() => {
        if (!isRunning || detections.length === 0) return;
        const now = Date.now();
        const top = detections[0]; // highest severity detection
        if (!lastAlertRef.current || now - lastAlertRef.current > 3000) {
            lastAlertRef.current = now;
            const distText = top.distanceM < 1 ? 'less than 1' : String(top.distanceM);
            const msg = `${top.class} detected, ${distText} meters ahead`;
            speak(msg);
            if (top.severity === 'danger') danger();
            else warning();
        }
    }, [detections]);

    const toggleDetection = async () => {
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                Alert.alert('Camera Permission', 'Camera access is required for obstacle detection.');
                return;
            }
        }
        if (isRunning) stop();
        else start();
    };

    const worstSeverity = detections.length > 0
        ? (detections.some(d => d.severity === 'danger') ? 'danger'
            : detections.some(d => d.severity === 'warning') ? 'warning' : 'safe')
        : null;

    const statusColor = worstSeverity ? SEVERITY_COLOR[worstSeverity] : colors.primary;

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
                    <Text style={styles.noCameraHint}>Demo detections are still running</Text>
                </LinearGradient>
            )}

            {/* Dark overlay */}
            <View style={styles.overlay} />

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
                <View style={styles.backBtn} />
            </SafeAreaView>

            {/* Bounding box overlays */}
            {isRunning && detections.map((det, i) => {
                const [x, y, bw, bh] = det.bbox;
                const scale = width / 375;
                return (
                    <View
                        key={i}
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
                                {det.class} · {det.distanceM}m
                            </Text>
                        </View>
                    </View>
                );
            })}

            {/* Status indicator */}
            {isRunning && worstSeverity && (
                <View style={[styles.statusBanner, { borderColor: statusColor, backgroundColor: statusColor + '22' }]}>
                    <Text style={[styles.statusBannerText, { color: statusColor }]}>
                        {SEVERITY_LABEL[worstSeverity]}
                    </Text>
                    {detections[0] && (
                        <Text style={styles.statusDetailText}>
                            {detections[0].class} · {detections[0].distanceM}m ahead
                        </Text>
                    )}
                </View>
            )}

            {/* Bottom control */}
            <View style={styles.bottom}>
                {/* Scanning label */}
                {isRunning && (
                    <Animated.View style={[styles.scanIndicator, { transform: [{ scale: pulseAnim }] }]}>
                        <View style={[styles.scanDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.scanText, { color: statusColor }]}>
                            {worstSeverity === null ? t('camera_safe') : t('camera_scanning')}
                        </Text>
                    </Animated.View>
                )}

                {/* Detections list */}
                {detections.length > 0 && (
                    <View style={styles.detectList}>
                        {detections.slice(0, 3).map((d, i) => (
                            <View
                                key={i}
                                style={[styles.detectCard, { borderLeftColor: SEVERITY_COLOR[d.severity] }]}
                            >
                                <Text style={styles.detectClass}>{d.class}</Text>
                                <Text style={styles.detectDist}>{d.distanceM}m · {Math.round(d.score * 100)}%</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Toggle button */}
                <TouchableOpacity
                    onPress={toggleDetection}
                    style={[styles.toggleBtn, { backgroundColor: isRunning ? colors.danger : colors.safe }]}
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
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    noCameraView: { alignItems: 'center', justifyContent: 'center' },
    noCameraText: { fontSize: 72, marginBottom: 16 },
    noCameraLabel: { fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.bold },
    noCameraHint: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 8 },

    // Top bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    backBtn: { minWidth: 70 },
    backBtnText: { color: colors.textPrimary, fontSize: fontSize.md },
    screenTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },

    // Bounding boxes
    bbox: {
        position: 'absolute',
        borderWidth: 2,
        borderRadius: 4,
        justifyContent: 'flex-start',
    },
    bboxLabel: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    bboxText: { color: '#fff', fontSize: 11, fontWeight: fontWeight.bold },

    // Status banner
    statusBanner: {
        position: 'absolute',
        top: 120,
        alignSelf: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    statusBannerText: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold },
    statusDetailText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },

    // Bottom
    bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: 48,
        backgroundColor: 'rgba(10,10,26,0.85)',
    },
    scanIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    scanDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    scanText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },

    detectList: { marginBottom: spacing.md, gap: 6 },
    detectCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.bgCard,
        borderRadius: radius.sm,
        padding: spacing.sm,
        borderLeftWidth: 3,
    },
    detectClass: { color: colors.textPrimary, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
    detectDist: { color: colors.textSecondary, fontSize: fontSize.sm },

    toggleBtn: {
        padding: 18,
        borderRadius: radius.full,
        alignItems: 'center',
    },
    toggleBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
