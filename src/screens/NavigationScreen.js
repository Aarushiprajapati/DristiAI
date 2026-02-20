import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Dimensions, Switch, ActivityIndicator, Platform,
    ScrollView, Animated,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTTS } from '../hooks/useTTS';
import { useHaptics } from '../hooks/useHaptics';
import { useLocation } from '../hooks/useLocation';
import { useApp } from '../context/AppContext';
import { colors, spacing, fontSize, fontWeight, radius } from '../config/theme';

const { width, height } = Dimensions.get('window');

// ── Realistic navigation steps for demo ─────────────────────────────────────
const DEMO_STEPS = [
    { text: 'Head north on Main Street for 200 meters', direction: 'straight', icon: '⬆️' },
    { text: 'Turn right onto Park Avenue — wide footpath available', direction: 'right', icon: '↪️' },
    { text: 'Continue for 150 meters. Tactile paving on the left side.', direction: 'straight', icon: '⬆️' },
    { text: 'Cross at the accessible pedestrian signal — audio signal active', direction: 'cross', icon: '🚶' },
    { text: 'Stay on the footpath for 80 meters. Speed breaker ahead.', direction: 'straight', icon: '⬆️' },
    { text: 'Turn left onto Rose Lane — low traffic area', direction: 'left', icon: '↩️' },
    { text: 'Slight ramp ahead — accessible route confirmed', direction: 'straight', icon: '♿' },
    { text: 'Destination is on your right — 20 meters. You have arrived!', direction: 'arrive', icon: '🏁' },
];

// Demo route coordinates (New Delhi area)
const DEMO_ROUTE = [
    { latitude: 28.6139, longitude: 77.2090 },
    { latitude: 28.6148, longitude: 77.2093 },
    { latitude: 28.6156, longitude: 77.2100 },
    { latitude: 28.6162, longitude: 77.2108 },
    { latitude: 28.6170, longitude: 77.2115 },
    { latitude: 28.6175, longitude: 77.2122 },
    { latitude: 28.6180, longitude: 77.2128 },
    { latitude: 28.6185, longitude: 77.2132 },
];

// Progress fraction → current GPS coordinate on route
const getPositionOnRoute = (route, stepIndex, totalSteps) => {
    const fraction = stepIndex / (totalSteps - 1);
    const segLen = route.length - 1;
    const seg = Math.min(Math.floor(fraction * segLen), segLen - 1);
    const t = fraction * segLen - seg;
    return {
        latitude: route[seg].latitude + t * (route[seg + 1].latitude - route[seg].latitude),
        longitude: route[seg].longitude + t * (route[seg + 1].longitude - route[seg].longitude),
    };
};

export default function NavigationScreen({ navigation }) {
    const { t } = useTranslation();
    const { language } = useApp();
    const { speak, stop: stopTTS } = useTTS();
    const { light, success } = useHaptics();
    const { location, getCurrentLocation, startTracking, stopTracking } = useLocation();

    const [destination, setDestination] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [route, setRoute] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [voiceOnly, setVoiceOnly] = useState(false);
    const [accessibleOnly, setAccessibleOnly] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentPos, setCurrentPos] = useState(null);
    const [autoAdvance, setAutoAdvance] = useState(true);
    const mapRef = useRef(null);
    const autoAdvanceRef = useRef(null);
    const progressAnim = useRef(new Animated.Value(0)).current;

    const effectiveLocation = location || { latitude: 28.6139, longitude: 77.2090 };

    const defaultRegion = {
        latitude: effectiveLocation.latitude,
        longitude: effectiveLocation.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
    };

    useEffect(() => {
        getCurrentLocation();
        startTracking();
        return () => {
            stopTracking();
            if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
        };
    }, []);

    // Auto-advance navigation step every ~8 seconds to simulate walking
    useEffect(() => {
        if (isNavigating && autoAdvance) {
            autoAdvanceRef.current = setInterval(() => {
                setStepIndex(prev => {
                    if (prev < DEMO_STEPS.length - 1) {
                        const next = prev + 1;
                        announceStep(next);
                        return next;
                    } else {
                        // Arrived
                        clearInterval(autoAdvanceRef.current);
                        setIsNavigating(false);
                        return prev;
                    }
                });
            }, 8000);
        }
        return () => {
            if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
        };
    }, [isNavigating, autoAdvance]);

    // Animate progress bar
    useEffect(() => {
        if (isNavigating) {
            Animated.timing(progressAnim, {
                toValue: (stepIndex + 1) / DEMO_STEPS.length,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    }, [stepIndex, isNavigating]);

    // Update simulated current position on route
    useEffect(() => {
        if (isNavigating && route) {
            const pos = getPositionOnRoute(route, stepIndex, DEMO_STEPS.length);
            setCurrentPos(pos);
            // Pan map to current position
            mapRef.current?.animateToRegion({
                latitude: pos.latitude,
                longitude: pos.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            }, 800);
        }
    }, [stepIndex, isNavigating]);

    const announceStep = useCallback((idx) => {
        const step = DEMO_STEPS[idx];
        if (!step) return;
        const isLast = idx === DEMO_STEPS.length - 1;
        if (isLast) {
            const msg = language === 'hi' ? 'आप अपनी मंजिल पर पहुंच गए हैं। बधाई!' : 'You have arrived at your destination. Well done!';
            speak(msg);
            success();
        } else {
            speak(step.text);
            light();
        }
    }, [language, speak, light, success]);

    const handleSearch = async () => {
        if (!destination.trim()) {
            speak(language === 'hi' ? 'कृपया मंजिल बताएं।' : 'Please enter a destination.');
            return;
        }
        setIsSearching(true);
        const searchMsg = language === 'hi'
            ? `${destination} के लिए सुरक्षित रास्ता ढूंढ रहे हैं।`
            : `Finding ${accessibleOnly ? 'accessible ' : ''}route to ${destination}. Please wait.`;
        speak(searchMsg);
        light();

        // Simulate route fetch (2 second delay)
        await new Promise(r => setTimeout(r, 2000));

        setRoute(DEMO_ROUTE);
        setStepIndex(0);
        setIsSearching(false);
        setIsNavigating(true);

        // Animate map to start
        mapRef.current?.animateToRegion({ ...defaultRegion, latitudeDelta: 0.006 }, 500);

        // Announce start
        setTimeout(() => {
            const foundMsg = language === 'hi'
                ? `${destination} के लिए रास्ता मिल गया। ${DEMO_STEPS.length} कदम। ${DEMO_STEPS[0].text}`
                : `Route to ${destination} found. ${DEMO_STEPS.length} steps. ${DEMO_STEPS[0].text}`;
            speak(foundMsg);
        }, 500);
    };

    const nextStep = useCallback(() => {
        if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
        if (stepIndex < DEMO_STEPS.length - 1) {
            const next = stepIndex + 1;
            setStepIndex(next);
            announceStep(next);
        } else {
            speak(language === 'hi' ? 'आप पहुंच गए!' : t('nav_arrived'));
            setIsNavigating(false);
        }
    }, [stepIndex, announceStep, language, speak, t]);

    const prevStep = useCallback(() => {
        if (stepIndex > 0) {
            const prev = stepIndex - 1;
            setStepIndex(prev);
            speak(DEMO_STEPS[prev].text);
            light();
        }
    }, [stepIndex, speak, light]);

    const stopNavigation = useCallback(() => {
        if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
        setIsNavigating(false);
        setRoute(null);
        setCurrentPos(null);
        progressAnim.setValue(0);
        stopTTS();
        speak(language === 'hi' ? 'नेविगेशन बंद।' : 'Navigation stopped.');
    }, [language, speak, stopTTS]);

    const repeatCurrentStep = useCallback(() => {
        announceStep(stepIndex);
    }, [announceStep, stepIndex]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Map */}
            {!voiceOnly && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    initialRegion={defaultRegion}
                    showsUserLocation={!currentPos}
                    showsMyLocationButton={false}
                    mapType="standard"
                    customMapStyle={darkMapStyle}
                >
                    {/* Simulated GPS position */}
                    {currentPos && (
                        <>
                            <Circle
                                center={currentPos}
                                radius={12}
                                strokeColor={colors.primary}
                                fillColor={colors.primary + 'BB'}
                            />
                            <Circle
                                center={currentPos}
                                radius={30}
                                strokeColor={colors.primary + '55'}
                                fillColor={colors.primary + '22'}
                            />
                        </>
                    )}
                    {/* Real GPS marker when not navigating */}
                    {!currentPos && location && (
                        <Marker
                            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                            title="You are here"
                        />
                    )}
                    {/* Route polyline */}
                    {route && (
                        <>
                            <Polyline
                                coordinates={route}
                                strokeColor={colors.primary}
                                strokeWidth={6}
                                lineDashPattern={[1]}
                            />
                            {/* Completed portion */}
                            <Polyline
                                coordinates={route.slice(0, Math.min(stepIndex + 1, route.length))}
                                strokeColor={colors.safe}
                                strokeWidth={6}
                            />
                            <Marker
                                coordinate={route[route.length - 1]}
                                title={destination}
                                pinColor={colors.safe}
                            />
                        </>
                    )}
                </MapView>
            )}

            {/* Voice-only mode */}
            {voiceOnly && (
                <LinearGradient colors={['#0a0a1a', '#12102f']} style={[styles.map, styles.voiceOnlyBg]}>
                    <Text style={styles.voiceOnlyIcon}>🔊</Text>
                    <Text style={styles.voiceOnlyText}>Voice-Only Navigation</Text>
                    {isNavigating && (
                        <>
                            <Text style={styles.voiceOnlyStep}>{DEMO_STEPS[stepIndex].icon}</Text>
                            <Text style={styles.stepTextLarge}>{DEMO_STEPS[stepIndex].text}</Text>
                        </>
                    )}
                </LinearGradient>
            )}

            {/* UI overlay */}
            <SafeAreaView style={styles.uiOverlay}>
                {/* Back button */}
                <TouchableOpacity
                    onPress={() => { stopNavigation(); navigation.goBack(); }}
                    style={styles.backBtn}
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>

                {/* Search card */}
                <View style={styles.searchCard}>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.searchInput}
                            value={destination}
                            onChangeText={setDestination}
                            placeholder={t('nav_destination')}
                            placeholderTextColor={colors.textMuted}
                            onSubmitEditing={handleSearch}
                            returnKeyType="go"
                            accessibilityLabel={t('nav_destination')}
                            editable={!isNavigating}
                        />
                        {isNavigating ? (
                            <TouchableOpacity style={[styles.goBtn, { backgroundColor: colors.danger }]} onPress={stopNavigation}>
                                <Text style={styles.goBtnText}>Stop</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.goBtn}
                                onPress={handleSearch}
                                disabled={isSearching}
                                accessibilityLabel={t('nav_go')}
                            >
                                {isSearching
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.goBtnText}>Go</Text>}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Toggles */}
                    <View style={styles.togglesRow}>
                        <View style={styles.toggle}>
                            <Text style={styles.toggleLabel}>{t('nav_voice_only')}</Text>
                            <Switch
                                value={voiceOnly}
                                onValueChange={setVoiceOnly}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={voiceOnly ? colors.primaryLight : colors.textMuted}
                            />
                        </View>
                        <View style={styles.toggle}>
                            <Text style={styles.toggleLabel}>♿ Accessible</Text>
                            <Switch
                                value={accessibleOnly}
                                onValueChange={setAccessibleOnly}
                                trackColor={{ false: colors.border, true: colors.safe }}
                                thumbColor={accessibleOnly ? colors.safe : colors.textMuted}
                            />
                        </View>
                    </View>
                </View>

                {/* Navigation steps panel */}
                {isNavigating && (
                    <View style={styles.stepsPanel}>
                        {/* Progress bar */}
                        <View style={styles.progressBar}>
                            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                        </View>
                        <Text style={styles.stepLabel}>
                            Step {stepIndex + 1} of {DEMO_STEPS.length} · {destination}
                        </Text>

                        {/* Direction icon + step */}
                        <View style={styles.stepRow}>
                            <Text style={styles.stepDirectionIcon}>{DEMO_STEPS[stepIndex].icon}</Text>
                            <Text style={styles.currentStep}>{DEMO_STEPS[stepIndex].text}</Text>
                        </View>

                        {/* GPS info */}
                        {location && (
                            <Text style={styles.gpsInfo}>
                                📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                                {location.accuracy ? ` · ±${Math.round(location.accuracy)}m` : ''}
                            </Text>
                        )}

                        {/* Actions */}
                        <View style={styles.stepsActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={prevStep} disabled={stepIndex === 0}>
                                <Text style={[styles.actionBtnText, stepIndex === 0 && { opacity: 0.3 }]}>← Prev</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                onPress={repeatCurrentStep}
                            >
                                <Text style={styles.actionBtnText}>🔊 Repeat</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.safe }]}
                                onPress={nextStep}
                            >
                                <Text style={styles.actionBtnText}>Next →</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Auto-advance toggle */}
                        <View style={styles.autoAdvanceRow}>
                            <Text style={styles.autoAdvanceLabel}>Auto-advance (simulated GPS)</Text>
                            <Switch
                                value={autoAdvance}
                                onValueChange={setAutoAdvance}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={autoAdvance ? colors.primaryLight : colors.textMuted}
                            />
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

// Dark map style for Google Maps
const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    map: { flex: 1 },
    voiceOnlyBg: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    voiceOnlyIcon: { fontSize: 80, marginBottom: spacing.lg },
    voiceOnlyText: { fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.bold, textAlign: 'center' },
    voiceOnlyStep: { fontSize: 60, marginVertical: spacing.md },
    stepTextLarge: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, lineHeight: 28 },

    uiOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },

    backBtn: {
        margin: spacing.sm, backgroundColor: 'rgba(18,18,42,0.95)',
        borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border,
    },
    backBtnText: { color: colors.textPrimary, fontSize: fontSize.sm },

    searchCard: {
        marginHorizontal: spacing.md, marginBottom: spacing.sm,
        backgroundColor: 'rgba(18,18,42,0.97)', borderRadius: radius.lg,
        padding: spacing.md, borderWidth: 1, borderColor: colors.border,
    },
    searchRow: { flexDirection: 'row', gap: spacing.sm },
    searchInput: {
        flex: 1, color: colors.textPrimary, backgroundColor: colors.bgElevated,
        borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
        fontSize: fontSize.md,
    },
    goBtn: {
        backgroundColor: colors.primary, borderRadius: radius.md,
        paddingHorizontal: spacing.lg, justifyContent: 'center', minWidth: 56,
    },
    goBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },
    togglesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    toggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    toggleLabel: { color: colors.textSecondary, fontSize: fontSize.xs },

    stepsPanel: {
        marginHorizontal: spacing.md,
        backgroundColor: 'rgba(18,18,42,0.97)', borderRadius: radius.lg,
        padding: spacing.lg, borderWidth: 1, borderColor: colors.primary + '55',
    },
    progressBar: {
        height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: spacing.sm,
    },
    progressFill: {
        height: 4, backgroundColor: colors.primary, borderRadius: 2,
    },
    stepLabel: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginBottom: 8 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: spacing.sm },
    stepDirectionIcon: { fontSize: 28 },
    currentStep: {
        flex: 1, color: colors.textPrimary, fontSize: fontSize.md,
        fontWeight: fontWeight.medium, lineHeight: 24,
    },
    gpsInfo: { color: colors.textMuted, fontSize: 10, marginBottom: spacing.sm },
    stepsActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    actionBtn: {
        flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.md,
        padding: spacing.sm, alignItems: 'center',
    },
    actionBtnText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    autoAdvanceRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm,
    },
    autoAdvanceLabel: { color: colors.textMuted, fontSize: fontSize.xs },
});
