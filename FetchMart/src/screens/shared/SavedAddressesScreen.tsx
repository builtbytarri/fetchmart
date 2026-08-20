import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DeliveryAddressModal } from '../../components';
import { usersApi, type SavedAddress } from '../../api/users';
import { useAuthStore } from '../../store';
import { COLORS, SPACING } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

function labelIcon(label: string): keyof typeof Ionicons.glyphMap {
  const normalized = label.toLowerCase();
  if (normalized === 'home') return 'home';
  if (normalized === 'work') return 'briefcase';
  return 'location';
}

export const SavedAddressesScreen: React.FC<Props> = ({ navigation }) => {
  const patchUser = useAuthStore((s) => s.patchUser);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.listSavedAddresses();
      setAddresses(data);
    } catch {
      Alert.alert('Error', 'Could not load saved addresses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses]),
  );

  const handleSetDefault = async (address: SavedAddress) => {
    if (address.isDefault) return;

    try {
      await usersApi.updateSavedAddress(address.id, { isDefault: true });
      await loadAddresses();
      patchUser({
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
      });
    } catch {
      Alert.alert('Error', 'Could not set default address.');
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setModalVisible(true);
  };

  const openEditModal = (address: SavedAddress) => {
    setEditingAddress(address);
    setModalVisible(true);
  };

  const handleSaveAddress = async (data: {
    address: string;
    latitude: number;
    longitude: number;
    label?: string;
  }) => {
    if (!data.label) return;

    setIsSaving(true);
    try {
      if (editingAddress) {
        const updated = await usersApi.updateSavedAddress(editingAddress.id, {
          label: data.label,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
        });
        await loadAddresses();
        if (updated.isDefault) {
          patchUser({
            address: updated.address,
            latitude: updated.latitude,
            longitude: updated.longitude,
          });
        }
      } else {
        const created = await usersApi.createSavedAddress({
          label: data.label,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: addresses.length === 0,
        });
        await loadAddresses();
        if (created.isDefault) {
          patchUser({
            address: created.address,
            latitude: created.latitude,
            longitude: created.longitude,
          });
        }
      }
      setModalVisible(false);
      setEditingAddress(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Could not save address.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = (address: SavedAddress) => {
    Alert.alert(
      'Delete Address',
      `Remove "${address.label}" from your saved addresses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersApi.deleteSavedAddress(address.id);
              const remaining = await usersApi.listSavedAddresses();
              setAddresses(remaining);

              if (address.isDefault) {
                const nextDefault = remaining.find((a) => a.isDefault);
                if (nextDefault) {
                  patchUser({
                    address: nextDefault.address,
                    latitude: nextDefault.latitude,
                    longitude: nextDefault.longitude,
                  });
                } else {
                  patchUser({ address: null, latitude: null, longitude: null });
                }
              }
            } catch {
              Alert.alert('Error', 'Could not delete address.');
            }
          },
        },
      ],
    );
  };

  const renderAddress = ({ item }: { item: SavedAddress }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressIcon}>
        <Ionicons name={labelIcon(item.label)} size={20} color={COLORS.primary} />
      </View>
      <TouchableOpacity
        style={styles.addressInfo}
        onPress={() => handleSetDefault(item)}
        activeOpacity={0.75}
      >
        <View style={styles.addressHeader}>
          <Text style={styles.addressLabel}>{item.label}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressText} numberOfLines={2}>
          {item.address}
        </Text>
        {!item.isDefault && (
          <Text style={styles.setDefaultHint}>Tap to set as default</Text>
        )}
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDeleteAddress(item)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddress}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={60} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No saved addresses</Text>
              <Text style={styles.emptySubtext}>
                Add Home, Work, or other delivery spots for faster checkout
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

      <DeliveryAddressModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingAddress(null);
        }}
        onConfirm={handleSaveAddress}
        initialAddress={editingAddress?.address ?? ''}
        initialLatitude={editingAddress?.latitude}
        initialLongitude={editingAddress?.longitude}
        initialLabel={editingAddress?.label ?? 'Home'}
        showLabelPicker
        confirmLoading={isSaving}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
        confirmButtonText={editingAddress ? 'Save address' : 'Add address'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.xs,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.primary,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  setDefaultHint: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: SPACING.xs,
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
