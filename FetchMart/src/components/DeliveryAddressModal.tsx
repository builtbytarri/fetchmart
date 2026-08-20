import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AddressAutocomplete } from './AddressAutocomplete';
import { Button } from './Button';
import { LocationPickerScreen } from '../screens/auth/LocationPickerScreen';
import { COLORS, SPACING } from '../constants/config';

type AddressData = {
  address: string;
  latitude: number;
  longitude: number;
  label?: string;
};

const PRESET_LABELS = ['Home', 'Work', 'Other'] as const;
type PresetLabel = (typeof PRESET_LABELS)[number];

function resolveInitialLabelState(label?: string): { preset: PresetLabel; custom: string } {
  if (!label) return { preset: 'Home' as PresetLabel, custom: '' };
  if (label === 'Home' || label === 'Work') return { preset: label, custom: '' };
  if (label === 'Other') return { preset: 'Other' as PresetLabel, custom: '' };
  return { preset: 'Other' as PresetLabel, custom: label };
}

interface DeliveryAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: AddressData) => void | Promise<void>;
  initialAddress?: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialLabel?: string;
  showLabelPicker?: boolean;
  confirmLoading?: boolean;
  title?: string;
  confirmButtonText?: string;
}

type MapMode = 'gps' | 'manual';

export const DeliveryAddressModal: React.FC<DeliveryAddressModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialAddress = '',
  initialLatitude,
  initialLongitude,
  initialLabel,
  showLabelPicker = false,
  confirmLoading = false,
  title = 'Change Delivery Address',
  confirmButtonText = 'Use this address',
}) => {
  const [pendingAddress, setPendingAddress] = useState<AddressData | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('gps');
  const [labelPreset, setLabelPreset] = useState<PresetLabel>('Home');
  const [customLabel, setCustomLabel] = useState('');

  const hasInitialCoords =
    typeof initialLatitude === 'number' && typeof initialLongitude === 'number';

  const proximity = useMemo(() => {
    if (pendingAddress) {
      return { latitude: pendingAddress.latitude, longitude: pendingAddress.longitude };
    }
    if (hasInitialCoords) {
      return { latitude: initialLatitude!, longitude: initialLongitude! };
    }
    return undefined;
  }, [pendingAddress, hasInitialCoords, initialLatitude, initialLongitude]);

  const mapInitialLocation = useMemo(() => {
    if (pendingAddress) {
      return { latitude: pendingAddress.latitude, longitude: pendingAddress.longitude };
    }
    if (hasInitialCoords) {
      return { latitude: initialLatitude!, longitude: initialLongitude! };
    }
    return undefined;
  }, [pendingAddress, hasInitialCoords, initialLatitude, initialLongitude]);

  useEffect(() => {
    if (!visible) {
      setShowMapPicker(false);
      setMapMode('gps');
      return;
    }
    const labelState = resolveInitialLabelState(initialLabel);
    setLabelPreset(labelState.preset);
    setCustomLabel(labelState.custom);

    if (initialAddress && hasInitialCoords) {
      setPendingAddress({
        address: initialAddress,
        latitude: initialLatitude!,
        longitude: initialLongitude!,
      });
    } else {
      setPendingAddress(null);
    }
  }, [visible, initialAddress, initialLatitude, initialLongitude, initialLabel, hasInitialCoords]);

  const resolvedLabel = useMemo(() => {
    if (!showLabelPicker) return undefined;
    if (labelPreset === 'Other') return customLabel.trim() || 'Other';
    return labelPreset;
  }, [showLabelPicker, labelPreset, customLabel]);

  const canConfirm = Boolean(
    pendingAddress && (!showLabelPicker || resolvedLabel),
  );

  const handleClose = () => {
    setShowMapPicker(false);
    onClose();
  };

  const openMapPicker = (mode: MapMode) => {
    setMapMode(mode);
    setShowMapPicker(true);
  };

  const handleMapLocationSelected = (location: AddressData) => {
    setPendingAddress(location);
    setShowMapPicker(false);
  };

  const displayAddress = pendingAddress?.address ?? initialAddress;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      {showMapPicker ? (
        <LocationPickerScreen
          autoLocate={mapMode === 'gps'}
          initialLocation={mapInitialLocation}
          confirmLabel="Use this address"
          onLocationSelected={handleMapLocationSelected}
          onBack={() => setShowMapPicker(false)}
        />
      ) : (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionHint}>
                Search for your address or use the map to pin your exact delivery spot.
              </Text>

              {showLabelPicker && (
                <View style={styles.labelSection}>
                  <Text style={styles.fieldLabel}>Address label</Text>
                  <View style={styles.labelRow}>
                    {PRESET_LABELS.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={[
                          styles.labelChip,
                          labelPreset === preset && styles.labelChipActive,
                        ]}
                        onPress={() => setLabelPreset(preset)}
                      >
                        <Text
                          style={[
                            styles.labelChipText,
                            labelPreset === preset && styles.labelChipTextActive,
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {labelPreset === 'Other' && (
                    <TextInput
                      style={styles.customLabelInput}
                      value={customLabel}
                      onChangeText={setCustomLabel}
                      placeholder="e.g. Parents' house, Gym…"
                      placeholderTextColor={COLORS.textSecondary}
                      autoCapitalize="words"
                    />
                  )}
                </View>
              )}

              <AddressAutocomplete
                value={displayAddress}
                onSelect={setPendingAddress}
                placeholder="Search your delivery address"
                label="Delivery address"
                proximity={proximity}
                dropdownMaxHeight={320}
              />

              <Text style={styles.orText}>OR</Text>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => openMapPicker('gps')}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIcon, styles.actionIconPrimary]}>
                  <Ionicons name="locate" size={22} color={COLORS.white} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Use current location</Text>
                  <Text style={styles.actionSubtitle}>Open map with live GPS and drag to refine</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => openMapPicker('manual')}
                activeOpacity={0.75}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="map-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Pick on map</Text>
                  <Text style={styles.actionSubtitle}>Drop a pin anywhere on the map</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {pendingAddress && (
                <View style={styles.selectedPreview}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  <View style={styles.selectedTextWrap}>
                    <Text style={styles.selectedLabel}>Selected address</Text>
                    <Text style={styles.selectedAddress}>{pendingAddress.address}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title={confirmLoading ? 'Saving…' : confirmButtonText}
                onPress={() =>
                  pendingAddress &&
                  onConfirm({
                    ...pendingAddress,
                    ...(showLabelPicker && resolvedLabel ? { label: resolvedLabel } : {}),
                  })
                }
                disabled={!canConfirm || confirmLoading}
                loading={confirmLoading}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sectionHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  labelSection: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  labelRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  labelChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  labelChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E9',
  },
  labelChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  labelChipTextActive: {
    color: COLORS.primary,
  },
  customLabelInput: {
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  orText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginVertical: SPACING.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  actionIconPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionTextWrap: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FAF0',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  selectedTextWrap: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  selectedAddress: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
});
