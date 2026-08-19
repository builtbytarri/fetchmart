import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store';
import { COLORS, SPACING } from '../constants/config';
import { appleAuth } from '../api';
import { UserRole } from '../types';

interface Props {
  /** Role to apply when this is a NEW account. Existing users keep their stored role. */
  role?: UserRole;
  disabled?: boolean;
}

export const SocialAuthButtons: React.FC<Props> = ({ role, disabled }) => {
  const { signInWithGoogle, signInWithApple, isLoading } = useAuthStore();
  // We resolve the Apple module lazily so the screen renders even when the
  // native module hasn't been compiled into the current dev build yet.
  const [appleNative, setAppleNative] = useState<any>(null);

  useEffect(() => {
    appleAuth.isAvailable().then((available) => {
      if (available) setAppleNative(appleAuth.getNativeModule());
    });
  }, []);

  const handleGoogle = async () => {
    try {
      await signInWithGoogle(role);
    } catch (e: any) {
      Alert.alert('Sign in failed', e.response?.data?.message || e.message || 'Could not sign in with Google');
    }
  };

  const handleApple = async () => {
    try {
      await signInWithApple(role);
    } catch (e: any) {
      Alert.alert('Sign in failed', e.response?.data?.message || e.message || 'Could not sign in with Apple');
    }
  };

  const AppleButton = appleNative?.AppleAuthenticationButton;

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.googleButton, (disabled || isLoading) && styles.disabled]}
        onPress={handleGoogle}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Apple's Human Interface Guidelines require their official button on iOS.
          We render it only when the native module is actually available. */}
      {AppleButton && Platform.OS === 'ios' && (
        <AppleButton
          buttonType={appleNative.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={appleNative.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={30}
          style={styles.appleButton}
          onPress={handleApple}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: SPACING.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    borderRadius: 30,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  appleButton: {
    height: 52,
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
});
