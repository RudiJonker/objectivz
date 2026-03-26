import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { colors, fonts, spacing, radius } from '../../../constants/theme';

export default function InviteScreen() {
  const router = useRouter();
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) throw new Error('No org found.');

      const { data, error } = await supabase
        .from('invites')
        .insert({
          org_id: membership.org_id,
          email: '',
          role: role,
        })
        .select()
        .single();

      if (error) throw error;
      setGeneratedToken(data.token);

    } catch (error) {
      console.error('Generate invite error:', error);
      Alert.alert('Error', 'Could not generate invite code.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `You've been invited to join our organisation on Objectivz!\n\nYour invite code is:\n\n${generatedToken}\n\nDownload Objectivz and use this code when signing up.`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Member</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Generate an invite code and share it with the person you want to add.
            They'll enter it when signing up for Objectivz.
          </Text>
        </View>

        {/* Role selector */}
        <Text style={styles.label}>Invite as</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'member' && styles.roleCardActive]}
            onPress={() => setRole('member')}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={role === 'member' ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.roleTitle, role === 'member' && styles.roleTitleActive]}>
              Member
            </Text>
            <Text style={styles.roleDesc}>Can create goals, manage steps and comment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === 'admin' && styles.roleCardActive]}
            onPress={() => setRole('admin')}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={role === 'admin' ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.roleTitle, role === 'admin' && styles.roleTitleActive]}>
              Admin
            </Text>
            <Text style={styles.roleDesc}>Full access including inviting members</Text>
          </TouchableOpacity>
        </View>

        {/* Generate button */}
        {!generatedToken ? (
          <TouchableOpacity
            style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            <Ionicons name="key-outline" size={18} color={colors.text} />
            <Text style={styles.generateBtnText}>
              {loading ? 'Generating...' : 'Generate Invite Code'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>Invite Code</Text>
            <Text style={styles.tokenValue}>{generatedToken}</Text>
            <Text style={styles.tokenNote}>
              This code can only be used once. Share it via WhatsApp or any messaging app.
            </Text>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color={colors.text} />
              <Text style={styles.shareBtnText}>Share Invite Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => setGeneratedToken(null)}
            >
              <Text style={styles.newBtnText}>Generate Another</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text },
  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  infoCard: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.primary + '18', borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + '44', padding: spacing.md,
  },
  infoText: { flex: 1, fontSize: fonts.small, color: colors.textSecondary, lineHeight: 18 },
  label: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    alignItems: 'center', gap: spacing.xs,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  roleTitle: { fontSize: fonts.regular, fontWeight: '700', color: colors.textSecondary },
  roleTitleActive: { color: colors.text },
  roleDesc: { fontSize: fonts.small, color: colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    padding: spacing.md, borderRadius: radius.sm,
  },
  generateBtnDisabled: { backgroundColor: colors.border },
  generateBtnText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
  tokenCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
    alignItems: 'center', gap: spacing.md,
  },
  tokenLabel: { fontSize: fonts.small, color: colors.textSecondary, fontWeight: '600' },
  tokenValue: {
    fontSize: fonts.large, fontWeight: 'bold', color: colors.primary,
    letterSpacing: 2, textAlign: 'center',
  },
  tokenNote: { fontSize: fonts.small, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, padding: spacing.md,
    borderRadius: radius.sm, width: '100%', justifyContent: 'center',
  },
  shareBtnText: { color: colors.text, fontSize: fonts.regular, fontWeight: 'bold' },
  newBtn: { padding: spacing.sm },
  newBtnText: { color: colors.primary, fontSize: fonts.regular, fontWeight: '600' },
});