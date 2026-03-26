import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { colors, fonts, spacing, radius } from '../../../constants/theme';
import { statusColors } from '../../../constants/theme';

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState('');

  const fetchGoals = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      

      // Get their org
      const { data: membership } = await supabase
  .from('org_members')
  .select('org_id, organisations(id, name)')
  .eq('user_id', user.id)
  .single();



      if (!membership) return;

      setOrgId(membership.org_id);
      setOrgName(membership.organisations.name);

      // Get goals for that org
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select(`
          id, title, description, status, due_date, created_at,
          profiles(full_name),
          steps(id, status)
        `)
        .eq('org_id', membership.org_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(goalsData || []);

    } catch (error) {
      console.error('Fetch goals error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const getStepProgress = (steps) => {
    if (!steps || steps.length === 0) return null;
    const done = steps.filter(s => s.status === 'done').length;
    return { done, total: steps.length };
  };

  const renderGoal = ({ item }) => {
    const progress = getStepProgress(item.steps);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(app)/goals/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '22' }]}>
              <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
                {item.status}
              </Text>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>

        <View style={styles.cardBottom}>
          {progress ? (
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${(progress.done / progress.total) * 100}%` }
                ]} />
              </View>
              <Text style={styles.progressText}>{progress.done}/{progress.total} steps</Text>
            </View>
          ) : (
            <Text style={styles.noSteps}>No steps yet</Text>
          )}

          <View style={styles.metaRow}>
            {item.due_date ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(item.due_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            ) : null}
            {item.profiles?.full_name ? (
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.profiles.full_name}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
  <View style={styles.headerLeft}>
    <Text style={styles.headerTitle}>Goals</Text>
    <Text style={styles.headerSub}>Digitack</Text>
  </View>
  <TouchableOpacity
    style={styles.addBtn}
    onPress={() => router.push('/(app)/goals/create')}
  >
    <Ionicons name="add" size={24} color={colors.text} />
  </TouchableOpacity>
</View>

      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        renderItem={renderGoal}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyDesc}>Tap the + button to create your first goal.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  backgroundColor: colors.surface, paddingHorizontal: spacing.md,
  paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
},
headerLeft: {
  flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
},
headerTitle: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
headerSub: { fontSize: fonts.small, color: colors.primary, fontWeight: '600' },
  addBtn: {
    backgroundColor: colors.primary, width: 40, height: 40,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cardTop: { padding: spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  cardTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: spacing.sm },
  statusBadge: { borderRadius: radius.sm, paddingVertical: 3, paddingHorizontal: spacing.sm },
  statusText: { fontSize: fonts.small, fontWeight: '700', textTransform: 'capitalize' },
  cardDesc: { fontSize: fonts.small, color: colors.textSecondary, lineHeight: 18 },
  cardBottom: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, gap: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { fontSize: fonts.small, color: colors.textSecondary, minWidth: 55 },
  noSteps: { fontSize: fonts.small, color: colors.textSecondary },
  metaRow: { flexDirection: 'row', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fonts.small, color: colors.textSecondary },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  emptyDesc: { fontSize: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
});