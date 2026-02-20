import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity,
    Animated, FlatList, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSize, fontWeight, radius } from '../config/theme';
import * as Location from 'expo-location';
import { useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        key: '1',
        titleKey: 'onboard_title_1',
        descKey: 'onboard_desc_1',
        emoji: '👁️',
        color: colors.primary,
    },
    {
        key: '2',
        titleKey: 'onboard_title_2',
        descKey: 'onboard_desc_2',
        emoji: '🎯',
        color: '#00BFA5',
    },
    {
        key: '3',
        titleKey: 'onboard_title_3',
        descKey: 'onboard_desc_3',
        emoji: '🆘',
        color: colors.danger,
    },
];

export default function OnboardingScreen({ navigation }) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const dotScale = slides.map(() => useRef(new Animated.Value(1)).current);
    const [, requestCameraPermission] = useCameraPermissions();

    const goNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            // Request permissions then navigate to Auth
            await Location.requestForegroundPermissionsAsync().catch(() => { });
            await requestCameraPermission().catch(() => { });
            navigation.replace('Auth');
        }
    };

    const renderSlide = ({ item }) => (
        <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '22', borderColor: item.color }]}>
                <Text style={styles.slideEmoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
            <Text style={styles.slideDesc}>{t(item.descKey)}</Text>
        </View>
    );

    return (
        <LinearGradient colors={['#0a0a1a', '#12102f']} style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={i => i.key}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(idx);
                }}
            />

            {/* Dots */}
            <View style={styles.dotsRow}>
                {slides.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            { backgroundColor: i === currentIndex ? colors.primary : colors.border, width: i === currentIndex ? 24 : 8 },
                        ]}
                    />
                ))}
            </View>

            {/* Next / Get Started button */}
            <TouchableOpacity
                style={styles.btn}
                onPress={goNext}
                accessibilityLabel={currentIndex < slides.length - 1 ? t('onboard_next') : t('onboard_get_started')}
                accessibilityRole="button"
            >
                <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.btnText}>
                        {currentIndex < slides.length - 1 ? t('onboard_next') : t('onboard_get_started')}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.skip} onPress={() => navigation.replace('Auth')}>
                Skip
            </Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: 80,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginBottom: spacing.xl,
    },
    slideEmoji: { fontSize: 64 },
    slideTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    slideDesc: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },
    btn: {
        marginHorizontal: spacing.xl,
        borderRadius: radius.full,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    btnGradient: {
        paddingVertical: 20,
        alignItems: 'center',
        borderRadius: radius.full,
    },
    btnText: {
        color: colors.textPrimary,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        letterSpacing: 0.5,
    },
    skip: {
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: 40,
        fontSize: fontSize.sm,
    },
});
