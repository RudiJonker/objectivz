import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { colors, fonts, spacing, radius } from '../../../constants/theme';

export default function OrgScreen() {
  const router = useRouter();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrg = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id, role, organisations(id, name, created_at)')
        .eq('user_id', user.id)
        .single();

      if (!membership) return;
      setOrg(membership.organisations);
      setCurrentRole(membership.role);

      const { data: membersData } = await supabase
        .from('org_members')
        .select('user_id, role, joined_at, profiles(full_name)')
        .eq('org_id', membership.org_id)
        .order('joined_at', { ascending: true });

      setMembers(membersData || []);

    } catch (error) {
      console.error('Fetch org error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrg(); }, [fetchOrg]);

  const onRefresh = () => { setRefreshing(true); fetchOrg(); };

  const handleChangeRole = async (userId, currentMemberRole) => {
    if (userId === currentUser.id) {
      return Alert.alert('Not allowed', 'You cannot change your own role.');
    }
    const newRole = currentMemberRole === 'admin' ? 'member' : 'admin';
    Alert.alert(
      'Change Role',
      `Change this member to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await supabase
              .from('org_members')
              .update({ role: newRole })
              .eq('user_id', userId)
              .eq('org_id', org.id);
            fetchOrg();
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (userId) => {
    if (userId === currentUser.id) {
      return Alert.alert('Not allowed', 'You cannot remove yourself.');
    }
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the organisation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('org_members')
              .delete()
              .eq('user_id', userId)
              .eq('org_id', org.id);
            fetchOrg();
          },
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
        <Text style={styles.headerTitle}>Organisation</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Org Info Card */}
        <View style={styles.orgCard}>
          <View style={styles.orgIconRow}>
            <View style={styles.orgIcon}>
              <Text style={styles.orgIconText}>
                {org?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>{org?.name}</Text>
              <Text style={styles.orgMeta}>
                Created {new Date(org?.created_at).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </Text>
            </View>
          </View>
          <View style={styles.orgStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {members.filter(m => m.role === 'admin').length}
              </Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            {currentRole === 'admin' && (
              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={() => router.push('/(app)/org/invite')}
              >
                <Ionicons name="person-add-outline" size={16} color={colors.text} />
                <Text style={styles.inviteBtnText}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>

          {members.map(member => {
            const isMe = member.user_id === currentUser?.id;
            return (
              <View key={member.user_id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>

                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>
                      {member.profiles?.full_name || 'Unknown'}
                      {isMe ? '  (you)' : ''}
                    </Text>
                  </View>
                  <Text style={styles.memberJoined}>
                    Joined {new Date(member.joined_at).toLocaleDateString('en-ZA', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </Text>
                </View>

                <View style={styles.memberRight}>
                  <View style={[
                    styles.roleBadge,
                    member.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeMember
                  ]}>
                    <Text style={[
                      styles.roleText,
                      member.role === 'admin' ? styles.roleTextAdmin : styles.roleTextMember
                    ]}>
                      {member.role}
                    </Text>
                  </View>

                  {currentRole === 'admin' && !isMe && (
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleChangeRole(member.user_id, member.role)}
                      >
                        <Ionicons name="swap-vertical-outline" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleRemoveMember(member.user_id)}
                      >
                        <Ionicons name="remove-circle-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

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
  orgCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  orgIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  orgIcon: {
    width: 56, height: 56, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  orgIconText: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  orgInfo: { flex: 1 },
  orgName: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
  orgMeta: { fontSize: fonts.small, color: colors.textSecondary, marginTop: 2 },
  orgStats: {
    flexDirection: 'row', borderTopWidth: 1,
    borderTopColor: colors.border, paddingTop: spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: fonts.small, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm, borderRadius: radius.sm,
  },
  inviteBtnText: { fontSize: fonts.small, color: colors.text, fontWeight: '600' },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  memberAvatarText: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.primary },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center' },
  memberName: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  memberJoined: { fontSize: fonts.small, color: colors.textSecondary, marginTop: 2 },
  memberRight: { alignItems: 'flex-end', gap: spacing.xs },
  roleBadge: { borderRadius: radius.sm, paddingVertical: 3, paddingHorizontal: spacing.sm },
  roleBadgeAdmin: { backgroundColor: colors.primary + '33' },
  roleBadgeMember: { backgroundColor: colors.surfaceLight },
  roleText: { fontSize: fonts.small, fontWeight: '700', textTransform: 'capitalize' },
  roleTextAdmin: { color: colors.primary },
  roleTextMember: { color: colors.textSecondary },
  memberActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { padding: 4 },
});