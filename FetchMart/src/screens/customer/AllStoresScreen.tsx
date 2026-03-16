import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { storesApi } from '../../api';
import { Store } from '../../types';
import { COLORS, SPACING } from '../../constants/config';
import { CustomerStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const STORE_CARD_WIDTH = (width - SPACING.md * 3) / 2;

type Props = NativeStackScreenProps<CustomerStackParamList, 'AllStores'>;

export const AllStoresScreen: React.FC<Props> = ({ navigation, route }) => {
  const { title } = route.params;
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const nearbyStores = await storesApi.getNearby({
          latitude: 6.5244,
          longitude: 3.3792,
          radius: 20,
        });
        setStores(nearbyStores);
      } catch (err) {
        console.error('Failed to load stores:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleStorePress = (store: Store) => {
    navigation.navigate('StoreDetails', { storeId: store.id });
  };

  const renderStoreCard = ({ item }: { item: Store }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => handleStorePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.storeImageContainer}>
        <View style={styles.storeImagePlaceholder}>
          <Ionicons name="storefront" size={40} color={COLORS.textSecondary} />
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
        {item.description && (
          <Text style={styles.storeDescription} numberOfLines={2}>{item.description}</Text>
        )}
        {item.distance !== undefined && (
          <Text style={styles.storeDistance}>{item.distance.toFixed(1)} km away</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stores Grid */}
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={renderStoreCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No stores found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 32,
  },
  listContent: {
    padding: SPACING.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  storeCard: {
    width: STORE_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  storeImageContainer: {
    width: '100%',
    height: STORE_CARD_WIDTH * 0.8,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  storeImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  storeInfo: {
    padding: SPACING.sm,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  storeDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  storeDistance: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
