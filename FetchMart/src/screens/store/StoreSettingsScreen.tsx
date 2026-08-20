import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storesApi } from '../../api';
import { Store } from '../../types';
import { COLORS, SPACING } from '../../constants/config';
import { LocationPickerScreen } from '../auth/LocationPickerScreen';
import { AddressAutocomplete, ImageUploadField } from '../../components';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const StoreSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const stores = await storesApi.getMyStores();
        if (stores.length > 0) {
          const s = stores[0];
          setStore(s);
          setName(s.name);
          setDescription(s.description || '');
          setIsOpen(s.isOpen);
          setImageUrl((s as any).imageUrl ?? null);
          setAddress((s as any).address || '');
          setLatitude(s.latitude ?? null);
          setLongitude(s.longitude ?? null);
        }
      } catch (err) {
        console.error('Failed to load store:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStore();
  }, []);

  const handleSave = async () => {
    if (!store) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Store name is required');
      return;
    }

    setIsSaving(true);
    try {
      await storesApi.update(store.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        isOpen,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        address: address.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
      });
      Alert.alert('Success', 'Store settings updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update store');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Store Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={60} color={COLORS.textSecondary} />
          <Text style={styles.noStoreText}>No store found</Text>
          <Text style={styles.noStoreSubtext}>Create a store first to manage settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Full-screen map picker
  if (showMapPicker) {
    return (
      <LocationPickerScreen
        onLocationSelected={({ latitude: lat, longitude: lng, address: addr }) => {
          setLatitude(lat);
          setLongitude(lng);
          setAddress(addr);
          setShowMapPicker(false);
        }}
        onBack={() => setShowMapPicker(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Store Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Store is {isOpen ? 'Open' : 'Closed'}</Text>
              <Text style={styles.statusDescription}>
                {isOpen ? 'Customers can place orders' : 'Customers cannot place orders'}
              </Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={isOpen ? COLORS.primary : '#BDBDBD'}
            />
          </View>
        </View>

        {/* Store Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>
          <View style={styles.formCard}>
            <ImageUploadField
              label="Storefront Photo"
              value={imageUrl}
              onChange={setImageUrl}
              folder="stores"
              shape="wide"
            />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter store name"
                placeholderTextColor={COLORS.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your store"
                placeholderTextColor={COLORS.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Location</Text>
          <View style={styles.formCard}>
            <AddressAutocomplete
              value={address}
              placeholder="Search for store address"
              onSelect={({ address: addr, latitude: lat, longitude: lng }) => {
                setAddress(addr);
                setLatitude(lat);
                setLongitude(lng);
              }}
            />

            <TouchableOpacity
              style={styles.mapPickerBtn}
              onPress={() => setShowMapPicker(true)}
            >
              <Ionicons name="map-outline" size={16} color={COLORS.primary} />
              <Text style={styles.mapPickerText}>Pick exact location on map</Text>
            </TouchableOpacity>

            {latitude !== null && longitude !== null && (
              <View style={styles.locationConfirmed}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.locationConfirmedText} numberOfLines={2}>
                  {address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
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
  scrollView: { flex: 1 },
  section: { marginTop: SPACING.md, marginHorizontal: SPACING.md },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
  },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  statusDescription: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  formCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: SPACING.xs },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: { height: 80, paddingTop: SPACING.sm },
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  mapPickerText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
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
  noStoreText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  noStoreSubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  bottomBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});
