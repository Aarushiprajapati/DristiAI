import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, fontWeight } from '../config/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

/**
 * SplashScreen — shown ONLY during the isLoading=true phase.
 * 
 * This is now a pure display component. Navigation is handled
 * entirely by AppNavigator through conditional rendering based
 * on auth state. No navigation.replace() calls here to avoid
 * race conditions with the auth listener.
 */
export default function SplashScreen() {
    const { t } = useTranslation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.6)).current;
    const taglineAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 800, useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1, friction: 4, tension: 50, useNativeDriver: true,
            }),
        ]).start(() => {
            // Tagline fades in after logo
            Animated.timing(taglineAnim, {
                toValue: 1, duration: 600, delay: 200, useNativeDriver: true,
            }).start();
        });

        // Subtle pulse loop on logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const logoScale = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    return (
        <LinearGradient
            colors={['#0a0a1a', '#12102f', '#1a0a2e']}
            style={styles.container}
        >
            {/* Decorative circles */}
            <View style={styles.circleOuter} />
            <View style={styles.circleInner} />

            {/* Logo */}
            <Animated.View style={[styles.logoWrap, {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
            }]}>
                <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
                    <Text style={styles.logoEmoji}>👁</Text>
                </Animated.View>
                <Text style={styles.appName}>DrishtiAI</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
                {t('splash_tagline')}
            </Animated.Text>

            {/* Loading indicator */}
            <Animated.View style={[styles.loadingWrap, { opacity: taglineAnim }]}>
                <View style={styles.loadingDots}>
                    {[0, 1, 2].map(i => (
                        <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.25 }]} />
                    ))}
                </View>
                <Text style={styles.loadingText}>Initializing...</Text>
            </Animated.View>

            {/* Powered by bar */}
            <Animated.View style={[styles.powered, { opacity: taglineAnim }]}>
                <Text style={styles.poweredText}>Powered by AI · Made for Independence</Text>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
    },
    circleOuter: {
        position: 'absolute',
        width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6,
        backgroundColor: 'rgba(108,99,255,0.05)', top: -width * 0.3,
    },
    circleInner: {
        position: 'absolute',
        width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4,
        backgroundColor: 'rgba(108,99,255,0.08)', bottom: -width * 0.1,
    },
    logoWrap: { alignItems: 'center', marginBottom: 24 },
    logoCircle: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 30,
        elevation: 15, marginBottom: 20,
    },
    logoEmoji: { fontSize: 54 },
    appName: {
        fontSize: 40, fontWeight: fontWeight.extrabold,
        color: colors.textPrimary, letterSpacing: 1,
    },
    tagline: {
        fontSize: fontSize.lg, color: colors.textSecondary,
        textAlign: 'center', paddingHorizontal: 40, marginTop: 8,
    },
    loadingWrap: { marginTop: 40, alignItems: 'center' },
    loadingDots: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: colors.primary,
    },
    loadingText: { color: colors.textMuted, fontSize: fontSize.xs, letterSpacing: 1 },
    powered: { position: 'absolute', bottom: 48 },
    poweredText: {
        fontSize: fontSize.xs, color: colors.textMuted, letterSpacing: 0.5,
    },
});
