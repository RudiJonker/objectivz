import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fonts, radius } from '../../constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams(); // 'create' or 'join'
  const isCreating = mode !== 'join';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    orgName: '',      // used when creating
    inviteToken: '',  // used when joining
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSignUp = async () => {
    if (!formData.fullName.trim()) return Alert.alert('Required', 'Please enter your full name.');
    if (!formData.email.trim()) return Alert.alert('Required', 'Please enter your email.');
    if (!formData.password) return Alert.alert('Required', 'Please enter a password.');
    if (formData.password.length < 6) return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
    if (formData.password !== formData.confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match.');
    if (isCreating && !formData.orgName.trim()) return Alert.alert('Required', 'Please enter your organisation name.');
    if (!isCreating && !formData.inviteToken.trim()) return Alert.alert('Required', 'Please enter your invite code.');

    setLoading(true);
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: { data: { full_name: formData.fullName.trim() } },
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('No user returned from sign up.');

      // Small delay to allow trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 800));

      if (isCreating) {
        // 2a. Create the organisation
        const { data: org, error: orgError } = await supabase
          .from('organisations')
          .insert({ name: formData.orgName.trim(), created_by: userId })
          .select()
          .single();
        if (orgError) throw orgError;

        // 3a. Add user as admin
        const { error: memberError } = await supabase
          .from('org_members')
          .insert({ org_id: org.id, user_id: userId, role: 'admin' });
        if (memberError) throw memberError;

      } else {
        // 2b. Look up the invite token
        const { data: invite, error: inviteError } = await supabase
          .from('invites')
          .select('*')
          .eq('token', formData.inviteToken.trim())
          .eq('accepted', false)
          .single();
        if (inviteError || !invite) throw new Error('Invalid or expired invite code.');

        // 3b. Add user as member
        const { error: memberError } = await supabase
          .from('org_members')
          .insert({ org_id: invite.org_id, user_id: userId, role: invite.role });
        if (memberError) throw memberError;

        // 4b. Mark invite as accepted
        await supabase.from('invites').update({ accepted: true }).eq('id', invite.id);
      }

      // Root layout will auto-navigate on session change

    } catch (error) {
      console.error('Sign up error:', error);
      if (error.message?.includes('already registered')) {
        Alert.alert('Already Registered', 'This email is already in use. Please log in instead.');
      } else if (error.message?.includes('Invalid or expired')) {
        Alert.alert('Invalid Code', 'That invite code is invalid or has already been used.');
      } else {
        Alert.alert('Sign Up Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>
              {isCreating ? '🏢 Creating a new organisation' : '🤝 Joining an organisation'}
            </Text>
          </View>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor={colors.textSecondary}
            value={formData.fullName} onChangeText={v => updateField('fullName', v)} autoCapitalize="words" />

          <Text style={styles.label}>Email Address *</Text>
          <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={colors.textSecondary}
            value={formData.email} onChangeText={v => updateField('email', v)}
            autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Password *</Text>
          <TextInput style={styles.input} placeholder="Minimum 6 characters" placeholderTextColor={colors.textSecondary}
            value={formData.password} onChangeText={v => updateField('password', v)} secureTextEntry />

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput style={styles.input} placeholder="Repeat your password" placeholderTextColor={colors.textSecondary}
            value={formData.confirmPassword} onChangeText={v => updateField('confirmPassword', v)} secureTextEntry />

          {isCreating ? (
            <>
              <Text style={styles.label}>Organisation Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Jonker & Venter Dev" placeholderTextColor={colors.textSecondary}
                value={formData.orgName} onChangeText={v => updateField('orgName', v)} />
            </>
          ) : (
            <>
              <Text style={styles.label}>Invite Code *</Text>
              <TextInput style={styles.input} placeholder="Paste your invite code here" placeholderTextColor={colors.textSecondary}
                value={formData.inviteToken} onChangeText={v => updateField('inviteToken', v)}
                autoCapitalize="none" autoCorrect={false} />
            </>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignUp} disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: colors.primary, fontSize: fonts.regular },
  headerTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  modeBadge: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    alignSelf: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  modeBadgeText: { color: colors.primary, fontWeight: '700', fontSize: fonts.regular },
  label: { fontSize: fonts.regular, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.md,
  },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.sm, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
  loginLink: { alignItems: 'center' },
  loginLinkText: { color: colors.primary, fontSize: fonts.regular, fontWeight: '600' },
});