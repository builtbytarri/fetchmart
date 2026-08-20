import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { storesApi } from '../../api';
import { COLORS, SPACING } from '../../constants/config';
import { LocationPickerScreen } from '../auth/LocationPickerScreen';
import { AddressAutocomplete, ImageUploadField } from '../../components';
import { useStoreStatus } from '../../navigation/storeStatusContext';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const CreateStoreScreen: React.FC<Props> = ({ navigation }) => {
  const { refresh: refreshStoreStatus } = useStoreStatus();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setLocation = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [rev] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const formatted = rev
        ? [rev.street, rev.city, rev.region].filter(Boolean).join(', ')
        : '';

      setLocation(loc.coords.latitude, loc.coords.longitude, formatted);
    } catch {
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Store name is required';
    if (latitude === null || longitude === null) newErrors.location = 'Store location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateStore = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await storesApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: latitude!,
        longitude: longitude!,
        address: address || undefined,
        imageUrl: imageUrl || undefined,
      });

      Alert.alert(
        'Store submitted',
        'Your store has been created and is now pending review. You\'ll be able to start selling once an admin approves it.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Re-evaluate store status so the navigator shows the
              // pending-verification screen instead of going back.
              refreshStoreStatus();
              navigation.goBack();
            },
          },
        ],
      );
    } catch (err: any) {
      // NestJS validation errors return `message` as an array — join it so the
      // alert never shows a blank body.
      const raw = err?.response?.data?.message;
      const message = Array.isArray(raw) ? raw.join('\n') : raw;
      Alert.alert('Error', message || 'Failed to create store');
    } finally {
      setIsLoading(false);
    }
  };

  // Full-screen map picker — same pattern as customer registration
  if (showMapPicker) {
    return (
      <LocationPickerScreen
        onLocationSelected={({ latitude: lat, longitude: lng, address: addr }) => {
          setLocation(lat, lng, addr);
          setShowMapPicker(false);
        }}
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Store</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ImageUploadField
            label="Storefront Photo"
            value={imageUrl}
            onChange={setImageUrl}
            folder="stores"
            shape="wide"
          />

          {/* Store Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your store name"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your store (optional)"
              placeholderTextColor={COLORS.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Location *</Text>

            <AddressAutocomplete
              value={address}
              placeholder="Search for your store address"
              onSelect={({ address: addr, latitude: lat, longitude: lng }) =>
                setLocation(lat, lng, addr)
              }
            />

            <View style={styles.locationActions}>
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={handleUseCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name="locate" size={16} color={COLORS.primary} />
                )}
                <Text style={styles.locationBtnText}>
                  {isGettingLocation ? 'Locating…' : 'Use GPS'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.locationBtn}
                onPress={() => setShowMapPicker(true)}
              >
                <Ionicons name="map" size={16} color={COLORS.primary} />
                <Text style={styles.locationBtnText}>Pick on Map</Text>
              </TouchableOpacity>
            </View>

            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

            {latitude !== null && longitude !== null && (
              <View style={styles.locationConfirmed}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                <Text style={styles.locationConfirmedText} numberOfLines={2}>
                  {address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
                </Text>
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>
              After creating your store, you can add products and manage your opening hours from the dashboard.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Create Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleCreateStore}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Store</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  scrollView: { flex: 1, padding: SPACING.md },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.error },
  textArea: { height: 100, paddingTop: SPACING.sm },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4 },
  locationActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  locationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  locationBtnText: { fontSize: 13, fontWeight: '500', color: COLORS.primary },
  locationConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  locationConfirmedText: { flex: 1, fontSize: 13, color: COLORS.text },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#1565C0', lineHeight: 18 },
  bottomBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
