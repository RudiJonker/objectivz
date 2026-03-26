import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
  TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../lib/supabase';
import { colors, fonts, spacing, radius, statusColors } from '../../../constants/theme';

const STEP_STATUSES = ['todo', 'inprogress', 'done', 'blocked'];

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [goal, setGoal] = useState(null);
  const [steps, setSteps] = useState([]);
  const [comments, setComments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [showStepForm, setShowStepForm] = useState(false);
  const [stepTitle, setStepTitle] = useState('');
  const [stepStatus, setStepStatus] = useState('todo');
  const [stepAssignee, setStepAssignee] = useState(null);
  const [stepDueDate, setStepDueDate] = useState(null);
  const [showStepDatePicker, setShowStepDatePicker] = useState(false);
  const [savingStep, setSavingStep] = useState(false);

  const [commentBody, setCommentBody] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: goalData } = await supabase
        .from('goals')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single();
      setGoal(goalData);

      const { data: stepsData } = await supabase
        .from('steps')
        .select('*, profiles(full_name)')
        .eq('goal_id', id)
        .order('created_at', { ascending: true });
      setSteps(stepsData || []);

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profiles(full_name)')
        .eq('entity_type', 'goal')
        .eq('entity_id', id)
        .order('created_at', { ascending: true });
      setComments(commentsData || []);

      const { data: membership } = await supabase
        .from('org_members')
        .select('user_id, profiles(full_name)')
        .eq('org_id', goalData?.org_id);
      setMembers(membership || []);

    } catch (error) {
      console.error('Fetch goal detail error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleAddStep = async () => {
    if (!stepTitle.trim()) return Alert.alert('Required', 'Please enter a step title.');
    setSavingStep(true);
    try {
      const { error } = await supabase.from('steps').insert({
        goal_id: id,
        title: stepTitle.trim(),
        status: stepStatus,
        assigned_to: stepAssignee,
        due_date: stepDueDate ? stepDueDate.toISOString().split('T')[0] : null,
      });
      if (error) throw error;
      setStepTitle('');
      setStepStatus('todo');
      setStepAssignee(null);
      setStepDueDate(null);
      setShowStepForm(false);
      fetchAll();
    } catch (error) {
      Alert.alert('Error', 'Could not add step.');
    } finally {
      setSavingStep(false);
    }
  };

  const handleStepStatusChange = async (stepId, newStatus) => {
    try {
      await supabase.from('steps').update({ status: newStatus }).eq('id', stepId);
      fetchAll();
    } catch (error) {
      Alert.alert('Error', 'Could not update step status.');
    }
  };

  const handleAddComment = async () => {
    if (!commentBody.trim()) return;
    setSavingComment(true);
    try {
      const { error } = await supabase.from('comments').insert({
        entity_type: 'goal',
        entity_id: id,
        user_id: currentUser.id,
        body: commentBody.trim(),
      });
      if (error) throw error;
      setCommentBody('');
      fetchAll();
    } catch (error) {
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setSavingComment(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{goal?.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Goal Info Card */}
          <View style={styles.goalCard}>
            <View style={styles.goalTopRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[goal?.status] + '22' }]}>
                <Text style={[styles.statusText, { color: statusColors[goal?.status] }]}>
                  {goal?.status}
                </Text>
              </View>
              {goal?.due_date && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{formatDate(goal.due_date)}</Text>
                </View>
              )}
            </View>
            {goal?.description ? (
              <Text style={styles.goalDesc}>{goal.description}</Text>
            ) : null}
            <Text style={styles.goalMeta}>
              Created by {goal?.profiles?.full_name || 'Unknown'}
            </Text>
          </View>

          {/* Steps Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Steps</Text>
              <TouchableOpacity
                style={styles.sectionAddBtn}
                onPress={() => setShowStepForm(!showStepForm)}
              >
                <Ionicons name={showStepForm ? 'close' : 'add'} size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {showStepForm && (
              <View style={styles.stepForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Step title"
                  placeholderTextColor={colors.textSecondary}
                  value={stepTitle}
                  onChangeText={setStepTitle}
                />
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.chipRow}>
                  {STEP_STATUSES.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, stepStatus === s && styles.chipActive]}
                      onPress={() => setStepStatus(s)}
                    >
                      <Text style={[styles.chipText, stepStatus === s && styles.chipTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.formLabel}>Assign To</Text>
                <View style={styles.chipRow}>
                  {members.map(m => (
                    <TouchableOpacity
                      key={m.user_id}
                      style={[styles.chip, stepAssignee === m.user_id && styles.chipActive]}
                      onPress={() => setStepAssignee(stepAssignee === m.user_id ? null : m.user_id)}
                    >
                      <Text style={[styles.chipText, stepAssignee === m.user_id && styles.chipTextActive]}>
                        {m.profiles?.full_name || 'Unknown'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.formLabel}>Due Date</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowStepDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.dateBtnText, stepDueDate && styles.dateBtnTextActive]}>
                    {stepDueDate
                      ? stepDueDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Select a date (optional)'}
                  </Text>
                  {stepDueDate && (
                    <TouchableOpacity onPress={() => setStepDueDate(null)}>
                      <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {showStepDatePicker && (
                  <DateTimePicker
                    value={stepDueDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      setShowStepDatePicker(false);
                      if (date) setStepDueDate(date);
                    }}
                    minimumDate={new Date()}
                  />
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, savingStep && styles.saveBtnDisabled]}
                  onPress={handleAddStep}
                  disabled={savingStep}
                >
                  <Text style={styles.saveBtnText}>{savingStep ? 'Saving...' : 'Add Step'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {steps.length === 0 ? (
              <Text style={styles.emptyText}>No steps yet. Tap + to add one.</Text>
            ) : (
              steps.map(step => (
                <View key={step.id} style={styles.stepCard}>
                  <View style={styles.stepTopRow}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[step.status] + '22' }]}>
                      <Text style={[styles.statusText, { color: statusColors[step.status] }]}>
                        {step.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.stepMeta}>
                    {step.profiles?.full_name && (
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{step.profiles.full_name}</Text>
                      </View>
                    )}
                    {step.due_date && (
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{formatDate(step.due_date)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.chipRow}>
                    {STEP_STATUSES.map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.chip, step.status === s && styles.chipActive]}
                        onPress={() => handleStepStatusChange(step.id, s)}
                      >
                        <Text style={[styles.chipText, step.status === s && styles.chipTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Comments Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            {comments.length === 0 ? (
              <Text style={styles.emptyText}>No comments yet.</Text>
            ) : (
              comments.map(comment => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.profiles?.full_name || 'Unknown'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short'
                      })}
                    </Text>
                  </View>
                  <Text style={styles.commentBody}>{comment.body}</Text>
                </View>
              ))
            )}
          </View>

          {/* Comment Input — inside scroll, at the bottom */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textSecondary}
              value={commentBody}
              onChangeText={setCommentBody}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!commentBody.trim() || savingComment) && styles.sendBtnDisabled]}
              onPress={handleAddComment}
              disabled={!commentBody.trim() || savingComment}
            >
              <Ionicons name="send" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, fontSize: fonts.medium, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  goalCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  goalTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  statusBadge: { borderRadius: radius.sm, paddingVertical: 3, paddingHorizontal: spacing.sm },
  statusText: { fontSize: fonts.small, fontWeight: '700', textTransform: 'capitalize' },
  goalDesc: { fontSize: fonts.regular, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  goalMeta: { fontSize: fonts.small, color: colors.textSecondary },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: fonts.small, color: colors.textSecondary },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text },
  sectionAddBtn: { padding: 4 },
  stepForm: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.sm,
    padding: spacing.md, marginBottom: spacing.md,
  },
  formLabel: { fontSize: fonts.small, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surface,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  chip: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fonts.small, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: colors.text, fontWeight: '600' },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  dateBtnText: { flex: 1, fontSize: fonts.small, color: colors.textSecondary },
  dateBtnTextActive: { color: colors.text },
  saveBtn: {
    backgroundColor: colors.primary, padding: spacing.sm,
    borderRadius: radius.sm, alignItems: 'center', marginTop: spacing.sm,
  },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveBtnText: { color: colors.text, fontSize: fonts.regular, fontWeight: 'bold' },
  stepCard: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.sm,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  stepTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  stepTitle: { flex: 1, fontSize: fonts.regular, fontWeight: '600', color: colors.text, marginRight: spacing.sm },
  stepMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  emptyText: { fontSize: fonts.small, color: colors.textSecondary, fontStyle: 'italic' },
  commentCard: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.sm,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  commentAuthor: { fontSize: fonts.small, fontWeight: '700', color: colors.primary },
  commentDate: { fontSize: fonts.small, color: colors.textSecondary },
  commentBody: { fontSize: fonts.regular, color: colors.text, lineHeight: 20 },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    marginTop: spacing.sm,
  },
  commentInput: {
    flex: 1, minHeight: 42, maxHeight: 100,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surfaceLight,
  },
  sendBtn: {
    backgroundColor: colors.primary, width: 42, height: 42,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});