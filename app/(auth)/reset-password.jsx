import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fonts, radius } from '../../constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password.trim()) return Alert.alert('Required', 'Please enter a new password.');
    if (password.length < 6) return Alert.alert('Too Short', 'Password must be at least 6 characters.');
    if (password !== confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Password Updated! 🎉', 'Your password has been reset successfully.', [
        { text: 'Continue', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={{ width: 60 }} />
          <Text style={styles.headerTitle}>New Password</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Create new password</Text>
          <Text style={styles.subtitle}>Choose a strong password you haven't used before.</Text>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex} value={password} onChangeText={setPassword}
              placeholder="Minimum 6 characters" placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword} autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
            placeholder="Re-enter your password" placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showPassword} autoCapitalize="none"
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Updating...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text },
  body: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: spacing.lg },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: fonts.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  label: { fontSize: fonts.regular, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, alignSelf: 'flex-start', width: '100%' },
  inputRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    backgroundColor: colors.surface, marginBottom: spacing.md, width: '100%', alignItems: 'center',
  },
  inputFlex: { flex: 1, padding: spacing.md, fontSize: fonts.regular, color: colors.text },
  eyeBtn: { padding: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.md, width: '100%',
  },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.sm, alignItems: 'center', width: '100%' },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
});