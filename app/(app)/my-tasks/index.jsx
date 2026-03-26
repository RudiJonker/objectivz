import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { colors, fonts, spacing, radius, statusColors } from '../../../constants/theme';

const STEP_STATUSES = ['todo', 'inprogress', 'done', 'blocked'];

export default function MyTasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('steps')
        .select(`
          id, title, status, due_date, created_at,
          goals(id, title, status)
        `)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);

    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const onRefresh = () => { setRefreshing(true); fetchTasks(); };

  const handleStatusChange = async (stepId, newStatus) => {
    try {
      await supabase.from('steps').update({ status: newStatus }).eq('id', stepId);
      fetchTasks();
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

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
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSub}>{tasks.length} assigned to me</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {['all', ...STEP_STATUSES].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No tasks assigned to you' : `No ${filter} tasks`}
            </Text>
            <Text style={styles.emptyDesc}>
              {filter === 'all' ? 'Steps assigned to you will appear here.' : 'Try a different filter.'}
            </Text>
          </View>
        ) : (
          filteredTasks.map(task => (
            <View key={task.id} style={styles.card}>

              {/* Goal reference */}
              <TouchableOpacity
                style={styles.goalRef}
                onPress={() => router.push(`/(app)/goals/${task.goals?.id}`)}
              >
                <Ionicons name="flag-outline" size={12} color={colors.primary} />
                <Text style={styles.goalRefText} numberOfLines={1}>
                  {task.goals?.title || 'Unknown Goal'}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </TouchableOpacity>

              {/* Task title and status */}
              <View style={styles.taskRow}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[task.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColors[task.status] }]}>
                    {task.status}
                  </Text>
                </View>
              </View>

              {/* Due date */}
              {task.due_date && (
                <View style={styles.dueDateRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={isOverdue(task.due_date) && task.status !== 'done' ? colors.error : colors.textSecondary}
                  />
                  <Text style={[
                    styles.dueDateText,
                    isOverdue(task.due_date) && task.status !== 'done' && styles.dueDateOverdue
                  ]}>
                    {isOverdue(task.due_date) && task.status !== 'done' ? 'Overdue · ' : ''}
                    {formatDate(task.due_date)}
                  </Text>
                </View>
              )}

              {/* Quick status change */}
              <View style={styles.chipRow}>
                {STEP_STATUSES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, task.status === s && styles.chipActive]}
                    onPress={() => handleStatusChange(task.id, s)}
                  >
                    <Text style={[styles.chipText, task.status === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

            </View>
          ))
        )}
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
  headerSub: { fontSize: fonts.small, color: colors.textSecondary, marginTop: 2 },
  filterRow: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: fonts.small, color: colors.textSecondary, textTransform: 'capitalize', fontWeight: '600' },
  filterChipTextActive: { color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.md },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  emptyDesc: { fontSize: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  goalRef: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: spacing.sm,
  },
  goalRefText: { fontSize: fonts.small, color: colors.primary, fontWeight: '600', flex: 1 },
  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  taskTitle: { flex: 1, fontSize: fonts.regular, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  statusBadge: { borderRadius: radius.sm, paddingVertical: 3, paddingHorizontal: spacing.sm },
  statusText: { fontSize: fonts.small, fontWeight: '700', textTransform: 'capitalize' },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  dueDateText: { fontSize: fonts.small, color: colors.textSecondary },
  dueDateOverdue: { color: colors.error, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fonts.small, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: colors.text, fontWeight: '600' },
});