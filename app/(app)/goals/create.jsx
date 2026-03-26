import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../lib/supabase';
import { colors, fonts, spacing, radius } from '../../../constants/theme';

const STATUSES = ['backlog', 'active', 'completed'];

export default function CreateGoalScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog',
    due_date: null,
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) updateField('due_date', selectedDate);
  };

  const formatDate = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return Alert.alert('Required', 'Please enter a goal title.');

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) throw new Error('No organisation found.');

      const { error } = await supabase.from('goals').insert({
        org_id: membership.org_id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        due_date: formatDate(formData.due_date),
        created_by: user.id,
      });

      if (error) throw error;
      router.back();

    } catch (error) {
      console.error('Create goal error:', error);
      Alert.alert('Error', 'Could not create goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Goal</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>

          <Text style={styles.label}>Goal Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Launch MVP by June"
            placeholderTextColor={colors.textSecondary}
            value={formData.title}
            onChangeText={v => updateField('title', v)}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What does success look like?"
            placeholderTextColor={colors.textSecondary}
            value={formData.description}
            onChangeText={v => updateField('description', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, formData.status === s && styles.statusChipActive]}
                onPress={() => updateField('status', s)}
              >
                <Text style={[styles.statusChipText, formData.status === s && styles.statusChipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.dateBtnText, formData.due_date && styles.dateBtnTextActive]}>
              {formData.due_date
                ? formData.due_date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Select a date (optional)'}
            </Text>
            {formData.due_date && (
              <TouchableOpacity onPress={() => updateField('due_date', null)}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.due_date || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Goal'}</Text>
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
    backgroundColor: colors.surface, paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text },
  scroll: { padding: spacing.lg },
  label: { fontSize: fonts.regular, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  textArea: { height: 100 },
  statusRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statusChip: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { fontSize: fonts.small, color: colors.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  statusChipTextActive: { color: colors.text },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  dateBtnText: { flex: 1, fontSize: fonts.regular, color: colors.textSecondary },
  dateBtnTextActive: { color: colors.text },
  btn: {
    backgroundColor: colors.primary, padding: spacing.md,
    borderRadius: radius.sm, alignItems: 'center', marginTop: spacing.lg,
  },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
});