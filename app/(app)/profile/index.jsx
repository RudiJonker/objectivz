import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, TextInput, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { colors, fonts, spacing, radius } from '../../../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile({ ...profileData, email: user.email });
      setFullName(profileData?.full_name || '');

      const { data: membership } = await supabase
        .from('org_members')
        .select('role, organisations(name)')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        setOrg(membership.organisations?.name);
        setRole(membership.role);
      }

    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!fullName.trim()) return Alert.alert('Required', 'Name cannot be empty.');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);
      if (error) throw error;
      setEditing(false);
      fetchProfile();
    } catch (error) {
      Alert.alert('Error', 'Could not update your name.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => await supabase.auth.signOut(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar and name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{profile?.full_name || 'No name set'}</Text>
          <Text style={styles.displayEmail}>{profile?.email}</Text>
        </View>

        {/* Org info */}
        {org && (
          <View style={styles.orgCard}>
            <View style={styles.orgRow}>
              <Ionicons name="business-outline" size={18} color={colors.primary} />
              <Text style={styles.orgName}>{org}</Text>
              <View style={[
                styles.roleBadge,
                role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeMember
              ]}>
                <Text style={[
                  styles.roleText,
                  role === 'admin' ? styles.roleTextAdmin : styles.roleTextMember
                ]}>
                  {role}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Edit name */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Full Name</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                autoFocus
                autoCapitalize="words"
                placeholder="Your full name"
                placeholderTextColor={colors.textSecondary}
              />
              <View style={styles.editBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setEditing(false);
                    setFullName(profile?.full_name || '');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.fieldValue}>{profile?.full_name || '—'}</Text>
          )}
        </View>

        {/* Email — read only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email</Text>
          <Text style={styles.fieldValue}>{profile?.email}</Text>
          <Text style={styles.fieldNote}>Email cannot be changed.</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.text} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.md },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  displayName: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  displayEmail: { fontSize: fonts.small, color: colors.textSecondary },
  orgCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orgName: { flex: 1, fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  roleBadge: { borderRadius: radius.sm, paddingVertical: 3, paddingHorizontal: spacing.sm },
  roleBadgeAdmin: { backgroundColor: colors.primary + '33' },
  roleBadgeMember: { backgroundColor: colors.surfaceLight },
  roleText: { fontSize: fonts.small, fontWeight: '700', textTransform: 'capitalize' },
  roleTextAdmin: { color: colors.primary },
  roleTextMember: { color: colors.textSecondary },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fonts.small, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  fieldValue: { fontSize: fonts.regular, color: colors.text, marginTop: spacing.xs },
  fieldNote: { fontSize: fonts.small, color: colors.textSecondary, marginTop: spacing.xs },
  editRow: { gap: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surfaceLight,
  },
  editBtns: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  cancelBtn: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { fontSize: fonts.small, color: colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.sm, backgroundColor: colors.primary,
  },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveBtnText: { fontSize: fonts.small, color: colors.text, fontWeight: '600' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    padding: spacing.md, borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  signOutText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
});