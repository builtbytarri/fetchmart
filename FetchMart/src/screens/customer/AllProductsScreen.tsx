import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Product } from '../../types';
import { useCartStore } from '../../store';
import {
  useStoreCacheStore,
  getCachedProducts,
  CACHE_TTL_MS,
} from '../../store/storeCacheStore';
import { COLORS, SPACING } from '../../constants/config';
import { CustomerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'AllProducts'>;

export const AllProductsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { storeId, storeName } = route.params;

  const primeStore = useStoreCacheStore(state => state.primeStore);
  const cacheEntry = useStoreCacheStore(state => state.data[storeId]);

  const allProducts = useMemo(() => getCachedProducts(cacheEntry) ?? [], [cacheEntry]);
  const categories = useMemo(() => cacheEntry?.categories ?? [], [cacheEntry]);

  const [isLoading, setIsLoading] = useState(allProducts.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<TextInput>(null);

  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  // Prime cache (instant no-op if StoreDetails already primed it)
  useEffect(() => {
    let cancelled = false;
    primeStore(storeId).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [storeId, primeStore]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const invalidate = useStoreCacheStore.getState().invalidate;
    invalidate(storeId);
    await primeStore(storeId);
    setIsRefreshing(false);
  }, [storeId, primeStore]);

  // Multi-level filter: category pill + search query
  const filtered = useMemo(() => {
    let result = allProducts.filter(p => p.isAvailable);

    if (selectedCategory) {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
      );
    }

    return result;
  }, [allProducts, selectedCategory, query]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id, storeId })}
      activeOpacity={0.75}
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="cube-outline" size={26} color={COLORS.textSecondary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        {item.category && (
          <Text style={styles.categoryLabel}>{item.category.name}</Text>
        )}
        <Text style={styles.price}>₦{Number(item.price).toLocaleString()}</Text>
        {item.stockQuantity <= 0 ? (
          <Text style={styles.outOfStock}>Out of stock</Text>
        ) : item.stockQuantity <= 5 ? (
          <Text style={styles.lowStock}>Only {item.stockQuantity} left</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </TouchableOpacity>
  ), [navigation, storeId]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>All Products</Text>
          <Text style={styles.headerSub}>{storeName}</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="bag-handle-outline" size={22} color={COLORS.text} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category filter pills ────────────────────────────────────── */}
      {categories.length > 0 && (
        <View style={styles.pillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            <TouchableOpacity
              style={[styles.pill, selectedCategory === null && styles.pillActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.pillText, selectedCategory === null && styles.pillTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, selectedCategory === cat.id && styles.pillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.pillText, selectedCategory === cat.id && styles.pillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={query ? 'search-outline' : 'cube-outline'}
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>
                {query
                  ? `No results for "${query}"`
                  : selectedCategory
                    ? 'No products in this category'
                    : 'No products available'}
              </Text>
              {(query || selectedCategory) && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => { setQuery(''); setSelectedCategory(null); }}
                >
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={<View style={{ height: 32 }} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginHorizontal: SPACING.sm },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  cartBtn: { padding: 4, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: COLORS.primary, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  // Search
  searchWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  clearBtn: { padding: 2 },

  // Category pills
  pillsWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 10,
  },
  pillsScroll: { paddingHorizontal: SPACING.md, gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F0F0F0',
    borderWidth: 1, borderColor: 'transparent',
  },
  pillActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  pillText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  pillTextActive: { color: COLORS.primary, fontWeight: '600' },

  // Product list
  listContent: { padding: SPACING.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  thumb: {
    width: 66, height: 66, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0F0F0',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#EBEBEB',
  },
  info: { flex: 1, marginLeft: SPACING.sm, gap: 2 },
  productName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  categoryLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  outOfStock: { fontSize: 12, color: COLORS.error, marginTop: 2 },
  lowStock: { fontSize: 12, color: '#E8572C', marginTop: 2 },

  // Empty state
  emptyContainer: {
    alignItems: 'center', paddingVertical: SPACING.xl * 3, gap: SPACING.sm,
  },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  clearFiltersBtn: {
    marginTop: 4, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 20,
  },
  clearFiltersText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
