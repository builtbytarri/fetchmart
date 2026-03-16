import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { storesApi } from '../../api';
import { Store } from '../../types';
import { useAuthStore } from '../../store';
import { COLORS, SPACING } from '../../constants/config';
import { SearchScreen } from './SearchScreen';

const { width } = Dimensions.get('window');
const STORE_CARD_WIDTH = (width - SPACING.md * 3) / 2.3;

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const CATEGORIES = [
  { id: '1', name: 'Fresh food', icon: '🍅' },
  { id: '2', name: 'Groceries', icon: '🛒' },
  { id: '3', name: 'Snacks', icon: '🍪' },
  { id: '4', name: 'Beverages', icon: '🥤' },
  { id: '5', name: 'Cleaning', icon: '🧹' },
];

const PROMO_BANNERS = [
  {
    id: '1',
    tag: 'Limited time offer!',
    text: '20% discounts available when you\nplace orders with coupons!',
    bgColor: '#2E7D32',
  },
  {
    id: '2',
    tag: 'Free delivery!',
    text: 'Get free delivery on your first\norder above ₦5,000!',
    bgColor: '#1565C0',
  },
  {
    id: '3',
    tag: 'New stores!',
    text: 'Check out the latest stores\nnear your location!',
    bgColor: '#7B1FA2',
  },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const promoFlatListRef = useRef<FlatList>(null);
  const { user } = useAuthStore();

  // Auto-scroll promo banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => {
        const nextIndex = (prev + 1) % PROMO_BANNERS.length;
        promoFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const nearbyStores = await storesApi.getNearby({
        latitude: 6.5244,
        longitude: 3.3792,
        radius: 20,
      });
      setStores(nearbyStores);
    } catch (err: any) {
      console.error('Failed to load stores:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStorePress = (store: Store) => {
    navigation.navigate('StoreDetails', { storeId: store.id });
  };

  const renderStoreCard = (store: Store, index: number) => (
    <TouchableOpacity
      key={store.id || index}
      style={styles.storeCard}
      onPress={() => handleStorePress(store)}
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
      <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
      {store.distance !== undefined && (
        <Text style={styles.storeDistance}>{store.distance.toFixed(1)} km away</Text>
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, storeList: Store[]) => {
    if (storeList.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('AllStores', { title })}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storeRow}
        >
          {storeList.map((store, index) => renderStoreCard(store, index))}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (showSearch) {
    return <SearchScreen navigation={navigation} onClose={() => setShowSearch(false)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.addressRow}>
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Delivery address</Text>
              <View style={styles.addressValueRow}>
                <Ionicons name="location" size={14} color={COLORS.text} />
                <Text style={styles.addressValue} numberOfLines={1}>
                  {user?.address || 'Set your delivery address'}
                </Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() => setShowSearch(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <Text style={styles.searchPlaceholder}>Search Fetchmart</Text>
          </TouchableOpacity>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryChip}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Promo Banner Carousel */}
        <View style={styles.promoCarouselContainer}>
          <FlatList
            ref={promoFlatListRef}
            data={PROMO_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - SPACING.md * 2));
              setCurrentPromoIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={[styles.promoBanner, { backgroundColor: item.bgColor }]}>
                <View style={styles.promoTag}>
                  <Ionicons name="pricetag" size={12} color={COLORS.white} />
                  <Text style={styles.promoTagText}>{item.tag}</Text>
                </View>
                <Text style={styles.promoText}>{item.text}</Text>
              </View>
            )}
          />
          <View style={styles.promoDotsContainer}>
            {PROMO_BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.promoDot,
                  currentPromoIndex === index && styles.promoDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Store Sections */}
        {stores.length > 0 && (
          <>
            {renderSection('Your favourites', stores)}
            {renderSection('Handpicked for you', stores)}
            {renderSection('Nearby stores', stores)}
          </>
        )}

        {stores.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stores available</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  addressContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  addressValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
    maxWidth: 200,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  categoriesContainer: {
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  promoCarouselContainer: {
    marginTop: SPACING.md,
  },
  promoBanner: {
    width: width - SPACING.md * 2,
    marginHorizontal: SPACING.md,
    borderRadius: 16,
    padding: SPACING.md,
  },
  promoDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    gap: 6,
  },
  promoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  promoDotActive: {
    backgroundColor: '#2E7D32',
    width: 20,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: SPACING.sm,
  },
  promoTagText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  promoText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 4,
  },
  storeRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  storeCard: {
    width: STORE_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  storeImageContainer: {
    width: '100%',
    height: STORE_CARD_WIDTH,
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
  storeName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  storeDistance: {
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
