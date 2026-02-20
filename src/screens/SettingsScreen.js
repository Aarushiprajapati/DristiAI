import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Switch, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useTTS } from '../hooks/useTTS';
import { colors, spacing, fontSize, fontWeight, radius } from '../config/theme';
// signOut and auth are now handled by AppContext logout function

const VOICE_SPEEDS = [
    { label: 'Slow', value: 0.6 },
    { label: 'Normal', value: 0.9 },
    { label: 'Fast', value: 1.3 },
];

const SENSITIVITIES = [
    { label: 'Low', value: 0.2 },
    { label: 'Medium', value: 0.5 },
    { label: 'High', value: 0.8 },
];

export default function SettingsScreen({ navigation }) {
    const { t, i18n } = useTranslation();
    const {
        user, setUser,
        language, updateLanguage,
        voiceSpeed, updateVoiceSpeed,
        sensitivity, updateSensitivity,
        hapticEnabled, toggleHaptic,
        highContrast, toggleHighContrast,
        emergencyContacts, addEmergencyContact, removeEmergencyContact,
        setIsDemoMode,
        voiceAssistantEnabled, toggleVoiceAssistant,
        logout,
    } = useApp();
    const { speak } = useTTS();

    const [showAddContact, setShowAddContact] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const handleAddContact = () => {
        if (!newName.trim() || !newPhone.trim()) {
            Alert.alert('Error', 'Please enter both name and phone number.');
            return;
        }
        addEmergencyContact({ name: newName.trim(), phone: newPhone.trim() });
        setNewName('');
        setNewPhone('');
        setShowAddContact(false);
        speak(`Emergency contact ${newName} added.`);
    };

    const handleDeleteContact = (contact) => {
        Alert.alert(
            'Remove Contact',
            `Remove ${contact.name} from emergency contacts?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeEmergencyContact(contact.id),
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            t('settings_logout'),
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    // logout() calls Firebase signOut, clears user state.
                    // AppNavigator auto-switches to Auth flow when user becomes null.
                    onPress: () => logout(),
                },
            ]
        );
    };

    const SectionHeader = ({ title }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    const Row = ({ label, children }) => (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            {children}
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0a0a1a', '#12102f']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('settings_title')}</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Voice & Language ── */}
                    <SectionHeader title="🔊 Voice & Language" />
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>{t('settings_voice_speed')}</Text>
                        <View style={styles.chipRow}>
                            {VOICE_SPEEDS.map(s => (
                                <TouchableOpacity
                                    key={s.label}
                                    style={[styles.chip, voiceSpeed === s.value && styles.chipActive]}
                                    onPress={() => { updateVoiceSpeed(s.value); speak(`Voice speed set to ${s.label}`); }}
                                    accessibilityLabel={`Voice speed: ${s.label}`}
                                >
                                    <Text style={[styles.chipText, voiceSpeed === s.value && styles.chipTextActive]}>
                                        {s.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>{t('settings_language')}</Text>
                        <View style={styles.chipRow}>
                            {[{ label: 'English', value: 'en' }, { label: 'हिंदी', value: 'hi' }].map(l => (
                                <TouchableOpacity
                                    key={l.value}
                                    style={[styles.chip, language === l.value && styles.chipActive, { flex: 1 }]}
                                    onPress={() => updateLanguage(l.value)}
                                    accessibilityLabel={`Language: ${l.label}`}
                                >
                                    <Text style={[styles.chipText, language === l.value && styles.chipTextActive]}>
                                        {l.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ── Alerts & Accessibility ── */}
                    <SectionHeader title="⚡ Alerts & Accessibility" />
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>{t('settings_sensitivity')}</Text>
                        <View style={styles.chipRow}>
                            {SENSITIVITIES.map(s => (
                                <TouchableOpacity
                                    key={s.label}
                                    style={[styles.chip, sensitivity === s.value && styles.chipActive]}
                                    onPress={() => updateSensitivity(s.value)}
                                >
                                    <Text style={[styles.chipText, sensitivity === s.value && styles.chipTextActive]}>
                                        {s.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Row label={t('settings_haptic')}>
                            <Switch
                                value={hapticEnabled}
                                onValueChange={toggleHaptic}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={hapticEnabled ? colors.primaryLight : colors.textMuted}
                            />
                        </Row>
                        <View style={styles.divider} />
                        <View style={styles.divider} />
                        <Row label={t('settings_dark_mode')}>
                            <Switch
                                value={highContrast}
                                onValueChange={toggleHighContrast}
                                trackColor={{ false: colors.border, true: colors.warning }}
                                thumbColor={highContrast ? colors.warning : colors.textMuted}
                            />
                        </Row>
                        <View style={styles.divider} />
                        <Row label="🎤 Voice Assistant (Auto-on)">
                            <Switch
                                value={voiceAssistantEnabled}
                                onValueChange={toggleVoiceAssistant}
                                trackColor={{ false: colors.border, true: colors.safe }}
                                thumbColor={voiceAssistantEnabled ? colors.safe : colors.textMuted}
                            />
                        </Row>
                        {voiceAssistantEnabled && (
                            <Text style={styles.voiceAssistHint}>
                                Voice assistant will greet you and start listening automatically when you open the app. No button press needed.
                            </Text>
                        )}
                    </View>

                    {/* ── Emergency Contacts ── */}
                    <SectionHeader title="🆘 Emergency Contacts" />
                    <View style={styles.card}>
                        {emergencyContacts.length === 0 && (
                            <Text style={styles.noContactsText}>No contacts yet. Add one below.</Text>
                        )}
                        {emergencyContacts.map(c => (
                            <View key={c.id} style={styles.contactRow}>
                                <View style={styles.contactAvatar}>
                                    <Text style={styles.contactAvatarText}>{c.name[0]?.toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.contactName}>{c.name}</Text>
                                    <Text style={styles.contactPhone}>{c.phone}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteContact(c)} accessibilityLabel={`Remove ${c.name}`}>
                                    <Text style={styles.deleteBtn}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity
                            style={styles.addContactBtn}
                            onPress={() => setShowAddContact(true)}
                            accessibilityLabel={t('settings_add_contact')}
                        >
                            <Text style={styles.addContactBtnText}>+ {t('settings_add_contact')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Account ── */}
                    <SectionHeader title="👤 Account" />
                    <View style={styles.card}>
                        <Text style={styles.emailText}>
                            {user?.email || user?.displayName || 'Demo User'}
                        </Text>
                        <TouchableOpacity
                            style={styles.logoutBtn}
                            onPress={handleLogout}
                            accessibilityLabel={t('settings_logout')}
                        >
                            <Text style={styles.logoutBtnText}>{t('settings_logout')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* About */}
                    <Text style={styles.about}>
                        DrishtiAI v1.0 · Built for Independence{'\n'}Made with ❤️ for visually impaired users
                    </Text>
                </ScrollView>
            </SafeAreaView>

            {/* Add Contact Modal */}
            <Modal visible={showAddContact} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t('settings_add_contact')}</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder={t('settings_contact_name')}
                            placeholderTextColor={colors.textMuted}
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newPhone}
                            onChangeText={setNewPhone}
                            placeholder={t('settings_contact_phone')}
                            placeholderTextColor={colors.textMuted}
                            keyboardType="phone-pad"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.bgElevated }]}
                                onPress={() => setShowAddContact(false)}
                            >
                                <Text style={styles.modalBtnText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAddContact}
                            >
                                <Text style={styles.modalBtnText}>{t('save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    backText: { color: colors.textSecondary, fontSize: fontSize.md },
    title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
    scroll: { padding: spacing.lg, paddingBottom: 60 },

    sectionHeader: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    card: {
        backgroundColor: colors.bgCard,
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    cardLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.sm },
    chipRow: { flexDirection: 'row', gap: spacing.sm },
    chip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: radius.md,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    chipActive: { backgroundColor: colors.primary + '33', borderColor: colors.primary },
    chipText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    chipTextActive: { color: colors.primary, fontWeight: fontWeight.bold },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    rowLabel: { color: colors.textPrimary, fontSize: fontSize.md },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

    // Contacts
    noContactsText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
    contactAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primary + '33',
        alignItems: 'center', justifyContent: 'center',
    },
    contactAvatarText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.md },
    contactName: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: fontWeight.medium },
    contactPhone: { color: colors.textSecondary, fontSize: fontSize.sm },
    deleteBtn: { color: colors.danger, fontSize: fontSize.lg, padding: 4 },
    addContactBtn: {
        borderWidth: 1.5, borderColor: colors.primary,
        borderRadius: radius.md, padding: spacing.sm,
        alignItems: 'center', borderStyle: 'dashed',
        marginTop: spacing.xs,
    },
    addContactBtnText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

    emailText: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md },
    logoutBtn: {
        borderWidth: 1, borderColor: colors.danger,
        borderRadius: radius.md, padding: spacing.sm,
        alignItems: 'center',
    },
    logoutBtnText: { color: colors.danger, fontSize: fontSize.md, fontWeight: fontWeight.semibold },

    about: {
        textAlign: 'center', color: colors.textMuted,
        fontSize: fontSize.xs, lineHeight: 20, marginTop: spacing.xl,
    },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: colors.bgElevated,
        borderTopLeftRadius: radius.xl || 32,
        borderTopRightRadius: radius.xl || 32,
        padding: spacing.xl,
    },
    modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.lg },
    modalInput: {
        backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: fontSize.md,
        marginBottom: spacing.md,
    },
    modalActions: { flexDirection: 'row', gap: spacing.md },
    modalBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
    modalBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
    voiceAssistHint: {
        color: colors.textMuted, fontSize: fontSize.xs,
        lineHeight: 18, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm,
    },
});
