import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../config/theme';

const formatCoord = (value) => (typeof value === 'number' ? value.toFixed(4) : '--');

const MapView = forwardRef(({ style, initialRegion }, ref) => {
    useImperativeHandle(ref, () => ({
        animateToRegion: () => {},
    }));

    return (
        <View style={[style, styles.container]} accessibilityRole="image">
            <View style={styles.grid} />
            <View style={styles.card}>
                <Text style={styles.title}>Navigation preview</Text>
                <Text style={styles.subtitle}>
                    {formatCoord(initialRegion?.latitude)}, {formatCoord(initialRegion?.longitude)}
                </Text>
            </View>
        </View>
    );
});

MapView.displayName = 'MapView';

export const Marker = () => null;
export const Polyline = () => null;
export const Circle = () => null;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0e1626',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    grid: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.22,
        backgroundImage:
            'linear-gradient(90deg, rgba(142,195,185,0.22) 1px, transparent 1px), linear-gradient(rgba(142,195,185,0.22) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
    },
    card: {
        borderWidth: 1,
        borderColor: colors.primary + '77',
        backgroundColor: 'rgba(18,18,42,0.9)',
        borderRadius: 16,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    title: {
        color: colors.textPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        marginTop: 4,
    },
});

export default MapView;
