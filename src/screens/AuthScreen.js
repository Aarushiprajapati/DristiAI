import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useApp } from '../context/AppContext';
import { colors, fontSize, fontWeight, spacing, radius } from '../config/theme';

export default function AuthScreen() {
    const { t } = useTranslation();
    const { setUser, setIsDemoMode } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter email and password.');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Please enter a valid email address.');
            return;
        }

        // Password length check for sign up
        if (isSignUp && password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            let result;
            if (isSignUp) {
                result = await createUserWithEmailAndPassword(auth, email.trim(), password);
            } else {
                result = await signInWithEmailAndPassword(auth, email.trim(), password);
            }
            // setUser is handled by onAuthStateChanged in AppContext
            // The navigator will automatically switch to MainNavigator
        } catch (error) {
            let errorMessage = 'Something went wrong. Please try again.';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address format.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/Password sign-in is not enabled. Please contact the app administrator or enable it in Firebase Console.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found. Please sign up first.';
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Incorrect email or password.';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Try signing in.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Use at least 6 characters.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Check your internet connection.';
                    break;
                default:
                    errorMessage = error.message;
            }
            Alert.alert(t('auth_error'), errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Forgot Password', 'Please enter your email address first.');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert('Password Reset', 'A password reset link has been sent to your email.');
        } catch (error) {
            Alert.alert('Error', 'Could not send reset email. Please check your email address.');
        }
    };

    const handleDemo = () => {
        setIsDemoMode(true);
        setUser({ uid: 'demo', displayName: 'Demo User', email: 'demo@drishti.ai' });
        // Navigator auto-switches to Main when user is set
    };

    return (
        <LinearGradient colors={['#0a0a1a', '#12102f']} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.kav}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>👁 DrishtiAI</Text>
                        <Text style={styles.title}>{t('auth_welcome')}</Text>
                        <Text style={styles.subtitle}>
                            {isSignUp ? 'Create your account to get started' : 'Sign in to continue'}
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Text style={styles.label}>{t('auth_email')}</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            accessibilityLabel={t('auth_email')}
                        />

                        <Text style={styles.label}>{t('auth_password')}</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={colors.textMuted}
                            secureTextEntry
                            autoComplete={isSignUp ? 'password-new' : 'password'}
                            accessibilityLabel={t('auth_password')}
                        />

                        {/* Forgot password */}
                        {!isSignUp && (
                            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={handleAuth}
                            disabled={loading}
                            accessibilityRole="button"
                            accessibilityLabel={isSignUp ? t('auth_sign_up') : t('auth_sign_in')}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.primaryDark]}
                                style={styles.btnInner}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.btnText}>{isSignUp ? t('auth_sign_up') : t('auth_sign_in')}</Text>
                                }
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleRow}>
                            <Text style={styles.toggleText}>
                                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                <Text style={{ color: colors.primary, fontWeight: fontWeight.bold }}>
                                    {isSignUp ? t('auth_sign_in') : t('auth_sign_up')}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>{t('auth_or')}</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Demo mode */}
                        <TouchableOpacity
                            style={styles.demoBtn}
                            onPress={handleDemo}
                            accessibilityRole="button"
                            accessibilityLabel={t('auth_demo')}
                        >
                            <Text style={styles.demoBtnText}>🚀 {t('auth_demo')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    kav: { flex: 1 },
    scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: 80 },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    logo: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 16 },
    title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.extrabold, color: colors.textPrimary },
    subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 8 },
    form: { flex: 1 },
    label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 8, fontWeight: fontWeight.medium },
    input: {
        backgroundColor: colors.bgCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: fontSize.md,
        marginBottom: spacing.lg,
    },
    forgotRow: { alignItems: 'flex-end', marginBottom: spacing.md, marginTop: -spacing.sm },
    forgotText: { color: colors.primary, fontSize: fontSize.sm },
    primaryBtn: { borderRadius: radius.full, overflow: 'hidden', marginTop: spacing.sm },
    btnInner: { padding: 20, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    toggleRow: { alignItems: 'center', marginTop: spacing.lg },
    toggleText: { color: colors.textSecondary, fontSize: fontSize.sm },
    divider: {
        flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textMuted, marginHorizontal: spacing.md, fontSize: fontSize.sm },
    demoBtn: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: radius.full,
        padding: 18,
        alignItems: 'center',
    },
    demoBtnText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
