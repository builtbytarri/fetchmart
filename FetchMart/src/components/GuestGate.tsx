import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/config';
import { useAuthStore } from '../store';

interface Props {
  /** e.g. "orders" — completes the sentence "Sign in to view your …". */
  feature: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Full-screen prompt shown in place of an account-based screen while browsing
 * as a guest. Guests can explore the catalogue freely (App Store Guideline
 * 5.1.1(v)); anything tied to an account routes through here.
 */
export const GuestGate: React.FC<Props> = ({ feature, icon = 'person-circle-outline' }) => {
  const { exitGuest } = useAuthStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Sign in to view your {feature}</Text>
        <Text style={styles.subtitle}>
          Create a free account or sign in to place orders, track deliveries and
          save your favourites.
        </Text>
        <TouchableOpacity style={styles.button} onPress={exitGuest} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Sign in or create account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: SPACING.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
