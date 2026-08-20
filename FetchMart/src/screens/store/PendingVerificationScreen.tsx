import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { COLORS, SPACING } from '../../constants/config';

const STEPS = [
  { icon: 'document-text-outline' as const, title: 'Application Received', done: true },
  { icon: 'search-outline' as const, title: 'Under Review', done: true, active: true },
  { icon: 'checkmark-circle-outline' as const, title: 'Approved & Live', done: false },
];

interface Props {
  onRefresh: () => Promise<void>;
}

export const PendingVerificationScreen: React.FC<Props> = ({ onRefresh }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [checking, setChecking] = useState(false);

  const handleCheckAgain = async () => {
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FetchMart</Text>
        <TouchableOpacity onPress={() => logout()} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="time-outline" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Store Under Review</Text>
        <Text style={styles.subtitle}>
          Hi {user?.name?.split(' ')[0] ?? 'there'}, your store registration is being reviewed by our team.
          This usually takes 1–2 business days.
        </Text>

        {/* Progress Steps */}
        <View style={styles.stepsCard}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[
                styles.stepIcon,
                step.done ? styles.stepIconDone : styles.stepIconPending,
                step.active && !step.done && styles.stepIconActive,
              ]}>
                {step.active && !step.done ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name={step.done ? 'checkmark' : step.icon}
                    size={16}
                    color={step.done ? '#fff' : COLORS.textSecondary}
                  />
                )}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
              )}
              <Text style={[
                styles.stepLabel,
                step.active && styles.stepLabelActive,
                !step.done && !step.active && styles.stepLabelDim,
              ]}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#1976D2" />
          <Text style={styles.infoText}>
            You'll receive a push notification as soon as your store is approved. 
            You can also tap "Check again" below.
          </Text>
        </View>

        {/* Check Again */}
        <TouchableOpacity
          style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
          onPress={handleCheckAgain}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
              <Text style={styles.checkBtnText}>Check approval status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => logout()} style={styles.switchAccount}>
          <Text style={styles.switchText}>Switch account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoutBtn: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  stepIconDone: {
    backgroundColor: COLORS.primary,
  },
  stepIconPending: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stepIconActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  stepLine: {
    position: 'absolute',
    left: 15,
    top: 34,
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  stepLineDone: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  stepLabelDim: {
    color: COLORS.textSecondary,
  },
  infoBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkBtnDisabled: {
    opacity: 0.6,
  },
  checkBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  switchAccount: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  switchText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
