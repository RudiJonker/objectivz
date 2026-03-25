import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../../constants/theme';

export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Goals</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: colors.text, fontSize: fonts.large, fontWeight: 'bold' },
});