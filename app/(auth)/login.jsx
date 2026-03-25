import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fonts, radius } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Required', 'Please enter your email address.');
    if (!password.trim()) return Alert.alert('Required', 'Please enter your password.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      // Root layout handles navigation automatically
    } catch (error) {
      Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
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
          <Text style={styles.headerTitle}>Sign In</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>Sign in to your Objectivz account.</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotBtnText}>Forgot your password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
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
  scroll: { padding: spacing.xl, alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: spacing.lg },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: fonts.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  label: { fontSize: fonts.regular, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, alignSelf: 'flex-start', width: '100%' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, fontSize: fonts.regular, color: colors.text,
    backgroundColor: colors.surface, marginBottom: spacing.md, width: '100%',
  },
  inputRow: {
    flexDirection: 'row', borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, backgroundColor: colors.surface,
    marginBottom: spacing.sm, width: '100%', alignItems: 'center',
  },
  inputFlex: { flex: 1, padding: spacing.md, fontSize: fonts.regular, color: colors.text },
  eyeBtn: { padding: spacing.md },
  forgotBtn: { alignSelf: 'flex-end', padding: spacing.sm, marginBottom: spacing.lg },
  forgotBtnText: { color: colors.primary, fontSize: fonts.regular, fontWeight: '600' },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.sm, alignItems: 'center', width: '100%' },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
});