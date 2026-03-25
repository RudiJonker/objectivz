import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { colors, spacing, fonts, radius } from '../../constants/theme';

export default function VerifyResetCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text.replace(/[^0-9]/g, '');
    setCode(newCode);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return Alert.alert('Required', 'Please enter the full 6-digit code.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: fullCode, type: 'recovery' });
      if (error) throw error;
      router.push('/(auth)/reset-password');
    } catch (error) {
      Alert.alert('Invalid Code', 'The code is incorrect or has expired. Please try again.');
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
          <Text style={styles.headerTitle}>Enter Code</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.emoji}>📬</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to:</Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.subtitleSmall}>Enter the code below. It expires in 10 minutes.</Text>

          <View style={styles.codeRow}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputs.current[index] = ref)}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={text => handleCodeChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleVerify} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify Code'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={() => router.back()}>
            <Text style={styles.resendBtnText}>Resend code</Text>
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
  subtitle: { fontSize: fonts.regular, color: colors.textSecondary, textAlign: 'center' },
  emailText: { fontSize: fonts.medium, fontWeight: '700', color: colors.primary, marginVertical: spacing.sm },
  subtitleSmall: { fontSize: fonts.small, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  codeInput: {
    width: 48, height: 56, borderWidth: 2, borderColor: colors.border,
    borderRadius: radius.sm, fontSize: fonts.xlarge, fontWeight: 'bold',
    color: colors.text, textAlign: 'center', backgroundColor: colors.surface,
  },
  codeInputFilled: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.sm, alignItems: 'center', width: '100%', marginBottom: spacing.md },
  btnDisabled: { backgroundColor: colors.border },
  btnText: { color: colors.text, fontSize: fonts.medium, fontWeight: 'bold' },
  resendBtn: { padding: spacing.sm },
  resendBtnText: { color: colors.primary, fontSize: fonts.regular, fontWeight: '600' },
});