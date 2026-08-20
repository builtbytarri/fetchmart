import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, GOOGLE_OAUTH_WEB_CLIENT_ID } from '../../constants/config';
import { useAuthStore } from '../../store';
import { appleAuth, googleAuth } from '../../api';

// Both must hold: the native module has to be wired up (googleAuth is stubbed
// until then) and the OAuth client IDs have to be filled in.
const GOOGLE_ENABLED =
  googleAuth.isAvailable() &&
  Boolean(GOOGLE_OAUTH_WEB_CLIENT_ID && !GOOGLE_OAUTH_WEB_CLIENT_ID.startsWith('REPLACE'));

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const AuthLandingScreen: React.FC<Props> = ({ navigation }) => {
  const { signInWithGoogle, signInWithApple, isLoading } = useAuthStore();
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    appleAuth.isAvailable().then(setAppleAvailable);
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Register');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Sign in failed', e.response?.data?.message || e.message || 'Could not sign in with Google');
    }
  };

  const handleApple = async () => {
    try {
      await signInWithApple();
    } catch (e: any) {
      Alert.alert('Sign in failed', e.response?.data?.message || e.message || 'Could not sign in with Apple');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/auth.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
        style={styles.gradient}
        locations={[0, 0.3, 1]}
      />

      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/iconw.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentContainer}>
        <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
          <Text style={styles.getStartedText}>Get started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          {/* Apple button — iOS only, per Apple's Human Interface Guidelines */}
          {appleAvailable && Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
              onPress={handleApple}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={20} color={COLORS.text} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          )}

          {GOOGLE_ENABLED && (
            <TouchableOpacity
              style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
              onPress={handleGoogle}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.socialButtonText}>Google</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  backgroundImage: {
    width,
    height,
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.6,
  },
  logoContainer: {
    position: 'absolute',
    top: height * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    tintColor: '#FFFFFF',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  getStartedButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  getStartedText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: SPACING.md + 2,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  signInText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginHorizontal: SPACING.md,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginHorizontal: SPACING.xs,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
});
