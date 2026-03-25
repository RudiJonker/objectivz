import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, fonts, radius } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.appName}>objectivz</Text>
        <Text style={styles.tagline}>Shared goals. Clear steps. Together.</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.chooseLabel}>Get started</Text>

        <View style={styles.cardRow}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/(auth)/signup?mode=create')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardEmoji}>🏢</Text>
            <Text style={styles.cardTitle}>New Org</Text>
            <Text style={styles.cardDesc}>Start a new{'\n'}organisation</Text>
            <View style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Create</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/(auth)/signup?mode=join')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardEmoji}>🤝</Text>
            <Text style={styles.cardTitle}>Join Org</Text>
            <Text style={styles.cardDesc}>Join with an{'\n'}invite code</Text>
            <View style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Join</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: fonts.small,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingTop: spacing.lg,
  },
  chooseLabel: {
    fontSize: fonts.medium,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEmoji: { fontSize: 32, marginBottom: spacing.sm },
  cardTitle: {
    fontSize: fonts.medium,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: fonts.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  cardButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cardButtonText: { color: colors.text, fontSize: fonts.small, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: fonts.regular, color: colors.textSecondary },
  loginLink: { fontSize: fonts.regular, fontWeight: '700', color: colors.primary },
});