import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fonts, radius } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) return Alert.alert('Required', 'Please enter your email address.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return Alert.alert('Invalid Email', 'Please enter a valid email address.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      router.push({ pathname: '/(auth)/verify-reset-code', params: { email: email.trim().toLowerCase() } });
    } catch (error) {
      Alert.alert('Error', 'Could not send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a 6-digit reset code.</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="your@email.com" placeholderTextColor={colors.textSecondary}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSendCode} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
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
  backBtn: { width: 60 },
  backText: { color: colors.primary, fontSize: fonts.regular },
  headerTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text },
  body: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: spacing.lg },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: fonts.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  label: { fontSize: fonts.regular, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, alignSelf: 'flex-start', width: '100%' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.md, width: '100%',
  },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.sm, alignItems: 'center', width: '100%' },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
});