import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store';
import { authApi } from '../../api';
import { UserRole } from '../../types';
import { COLORS, SPACING } from '../../constants/config';
import { LocationPickerScreen } from './LocationPickerScreen';
import { AddressAutocomplete } from '../../components';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Customer', value: 'CUSTOMER' },
  { label: 'Store Owner', value: 'STORE' },
  { label: 'Rider', value: 'RIDER' },
];

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [address, setAddress] = useState('');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const { register } = useAuthStore();

  const totalSteps = role === 'CUSTOMER' ? 3 : 2;

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setIsLoading(true);
      try {
        await authApi.sendOtp(phone.trim());
        setStep(2);
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      const otpCode = otp.join('');
      if (otpCode.length !== 4) {
        Alert.alert('Error', 'Please enter the complete OTP');
        return;
      }
      
      setIsLoading(true);
      try {
        await authApi.verifyOtp(phone.trim(), otpCode);
        if (role !== 'CUSTOMER') {
          await completeRegistration();
        } else {
          setStep(3);
          setIsLoading(false);
        }
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Invalid OTP');
        setIsLoading(false);
      }
    } else if (step === 3) {
      await completeRegistration();
    }
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
        address: address || undefined,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      await authApi.sendOtp(phone.trim());
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone number');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const handleUseCurrentLocation = () => {
    setShowMapPicker(true);
  };

  const handleLocationSelected = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setUserLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setAddress(location.address);
    setShowMapPicker(false);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressBar,
            index < step ? styles.progressBarActive : styles.progressBarInactive,
            { width: (width - SPACING.lg * 2 - (totalSteps - 1) * 8) / totalSteps },
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <>
      <Text style={styles.subtitle}>Just a few details to personalize your experience</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Name"
          placeholderTextColor={COLORS.textSecondary}
          value={name}
          onChangeText={setName}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone number</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          placeholder="Phone number"
          placeholderTextColor={COLORS.textSecondary}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Create password</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Create password"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm password</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Confirm password"
          placeholderTextColor={COLORS.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <View style={styles.roleSection}>
        <Text style={styles.inputLabel}>I am a:</Text>
        <View style={styles.roleContainer}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleButton, role === r.value && styles.roleButtonActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={[styles.roleButtonText, role === r.value && styles.roleButtonTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.subtitle}>
        Please input the pin that was sent to your number{'\n'}
        <Text style={styles.phoneHighlight}>{phone}</Text>
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { otpRefs.current[index] = ref; }}
            style={styles.otpInput}
            value={digit}
            onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't get the code? </Text>
        <TouchableOpacity onPress={handleResendOtp}>
          <Text style={styles.resendLink}>Resend it</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const handleAddressSelect = (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setAddress(data.address);
    setUserLocation({
      latitude: data.latitude,
      longitude: data.longitude,
    });
  };

  const renderStep3 = () => (
    <>
      <Text style={styles.subtitle}>Where do we bring your groceries?</Text>

      <AddressAutocomplete
        label="Address"
        value={address}
        onSelect={handleAddressSelect}
        placeholder="Search for your address"
      />

      <Text style={styles.orText}>OR</Text>

      <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
        <Ionicons name="location" size={18} color="#4CAF50" />
        <Text style={styles.locationButtonText}>Use current location</Text>
      </TouchableOpacity>
    </>
  );

  if (showMapPicker) {
    return (
      <LocationPickerScreen
        onLocationSelected={handleLocationSelected}
        onBack={() => setShowMapPicker(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create your account</Text>
          {renderProgressBar()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'Please wait...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    width: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#4CAF50',
  },
  progressBarInactive: {
    backgroundColor: COLORS.border,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  phoneHighlight: {
    color: COLORS.text,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  roleSection: {
    marginTop: SPACING.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.xs,
  },
  roleButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  roleButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: SPACING.xl,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.text,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  resendLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  orText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    marginVertical: SPACING.md,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  locationButtonText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: SPACING.lg,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: SPACING.md + 2,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4CAF50',
  },
});
