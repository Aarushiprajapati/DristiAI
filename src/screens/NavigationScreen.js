import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Dimensions, ScrollView, Switch, ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTTS } from '../hooks/useTTS';
import { useHaptics } from '../hooks/useHaptics';
import { useLocation } from '../hooks/useLocation';
import { colors, spacing, fontSize, fontWeight, radius } from '../config/theme';

const { width, height } = Dimensions.get('window');

// Demo route steps for offline/demo mode
const DEMO_STEPS = [
    'Head north on Main Street for 200 meters',
    'Turn right onto Park Road',
    'Continue for 150 meters, footpath on the left',
    'Cross at the accessible pedestrian crossing',
    'Destination is on your right — 50 meters',
];

const DEMO_ROUTE = [
    { latitude: 28.6139, longitude: 77.2090 },
    { latitude: 28.6150, longitude: 77.2100 },
    { latitude: 28.6165, longitude: 77.2095 },
    { latitude: 28.6175, longitude: 77.2110 },
    { latitude: 28.6185, longitude: 77.2120 },
];

export default function NavigationScreen({ navigation }) {
    const { t } = useTranslation();
    const { speak, stop: stopTTS } = useTTS();
    const { light } = useHaptics();
    const { location, getCurrentLocation, startTracking } = useLocation();

    const [destination, setDestination] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [route, setRoute] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [voiceOnly, setVoiceOnly] = useState(false);
    const [accessibleOnly, setAccessibleOnly] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const mapRef = useRef(null);

    const defaultRegion = {
        latitude: location?.latitude || 28.6139,
        longitude: location?.longitude || 77.2090,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    useEffect(() => {
        getCurrentLocation();
        startTracking();
    }, []);

    const handleSearch = async () => {
        if (!destination.trim()) return;
        setIsSearching(true);
        speak(`${t('nav_searching')} ${destination}`);
        light();

        // Simulate route fetch (replace with real Google Directions API)
        await new Promise(r => setTimeout(r, 1500));
        setRoute(DEMO_ROUTE);
        setStepIndex(0);
        setIsSearching(false);
        setIsNavigating(true);

        // Announce first step
        speak(`Route found. ${DEMO_STEPS[0]}`);
    };

    const nextStep = () => {
        if (stepIndex < DEMO_STEPS.length - 1) {
            const next = stepIndex + 1;
            setStepIndex(next);
            speak(DEMO_STEPS[next]);
            light();
        } else {
            speak(t('nav_arrived'));
            setIsNavigating(false);
        }
    };

    const stopNavigation = () => {
        setIsNavigating(false);
        setRoute(null);
        stopTTS();
        speak('Navigation stopped.');
    };

    return (
        <View style={styles.container}>
            {/* Map */}
            {!voiceOnly && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    region={defaultRegion}
                    showsUserLocation
                    showsMyLocationButton={false}
                    mapType="standard"
                    customMapStyle={darkMapStyle}
                >
                    {location && (
                        <Marker
                            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                            title="You are here"
                        />
                    )}
                    {route && (
                        <>
                            <Polyline
                                coordinates={route}
                                strokeColor={colors.primary}
                                strokeWidth={5}
                            />
                            <Marker coordinate={route[route.length - 1]} title={destination} pinColor={colors.safe} />
                        </>
                    )}
                </MapView>
            )}

            {/* Voice-only overlay */}
            {voiceOnly && (
                <LinearGradient colors={['#0a0a1a', '#12102f']} style={[styles.map, styles.voiceOnlyBg]}>
                    <Text style={styles.voiceOnlyIcon}>🔊</Text>
                    <Text style={styles.voiceOnlyText}>Voice-Only Navigation Active</Text>
                    {isNavigating && (
                        <Text style={styles.stepText}>{DEMO_STEPS[stepIndex]}</Text>
                    )}
                </LinearGradient>
            )}

            {/* UI overlay */}
            <SafeAreaView style={styles.uiOverlay}>
                {/* Top search bar */}
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
                        />
                        <TouchableOpacity
                            style={styles.goBtn}
                            onPress={handleSearch}
                            disabled={isSearching}
                            accessibilityLabel={t('nav_go')}
                        >
                            {isSearching
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.goBtnText}>{t('nav_go')}</Text>}
                        </TouchableOpacity>
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
                            <Text style={styles.toggleLabel}>{t('nav_accessible')}</Text>
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
                        <Text style={styles.stepLabel}>Step {stepIndex + 1} of {DEMO_STEPS.length}</Text>
                        <Text style={styles.currentStep}>{DEMO_STEPS[stepIndex]}</Text>
                        <View style={styles.stepsActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={stopNavigation}>
                                <Text style={styles.actionBtnText}>⏹ Stop</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                onPress={() => speak(DEMO_STEPS[stepIndex])}
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
                    </View>
                )}

                {/* Back button */}
                <TouchableOpacity
                    onPress={() => { stopNavigation(); navigation.goBack(); }}
                    style={styles.backBtn}
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
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
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    map: { flex: 1 },
    voiceOnlyBg: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    voiceOnlyIcon: { fontSize: 80, marginBottom: spacing.lg },
    voiceOnlyText: { fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.bold, textAlign: 'center' },
    stepText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, lineHeight: 26 },

    uiOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
    },
    searchCard: {
        margin: spacing.md,
        backgroundColor: 'rgba(18,18,42,0.95)',
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchRow: { flexDirection: 'row', gap: spacing.sm },
    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        fontSize: fontSize.md,
    },
    goBtn: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
    },
    goBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },
    togglesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
    toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    toggleLabel: { color: colors.textSecondary, fontSize: fontSize.xs },

    stepsPanel: {
        margin: spacing.md,
        marginTop: 0,
        backgroundColor: 'rgba(18,18,42,0.95)',
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary + '55',
    },
    stepLabel: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginBottom: 6 },
    currentStep: {
        color: colors.textPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.medium,
        lineHeight: 26,
        marginBottom: spacing.md,
    },
    stepsActions: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: {
        flex: 1,
        backgroundColor: colors.bgElevated,
        borderRadius: radius.md,
        padding: spacing.sm,
        alignItems: 'center',
    },
    actionBtnText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

    backBtn: {
        margin: spacing.md,
        marginTop: 0,
        backgroundColor: 'rgba(18,18,42,0.9)',
        borderRadius: radius.md,
        padding: spacing.sm,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.border,
    },
    backBtnText: { color: colors.textPrimary, fontSize: fontSize.sm },
});
