import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { storesApi } from '../../api';
import { Store, Product } from '../../types';
import { useCartStore } from '../../store';
import {
  useStoreCacheStore,
  getCachedProducts,
} from '../../store/storeCacheStore';
import { COLORS, SPACING } from '../../constants/config';
import { CustomerStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.md * 2 - 10) / 2.3;

type Props = NativeStackScreenProps<CustomerStackParamList, 'StoreDetails'>;

// ─── Small product card ───────────────────────────────────────────────────────
const ProductCard: React.FC<{
  product: Product;
  storeId: string;
  onPress: () => void;
}> = ({ product, storeId, onPress }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.productImageWrap}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="cube-outline" size={34} color={COLORS.textSecondary} />
        </View>
      )}
    </View>
    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
    {product.category && (
      <Text style={styles.productCat} numberOfLines={1}>{product.category.name}</Text>
    )}
    <Text style={styles.productPrice}>₦{Number(product.price).toLocaleString()}</Text>
  </TouchableOpacity>
);

// ─── Section ─────────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export const StoreDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { storeId } = route.params;
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { addItem, getItemCount } = useCartStore();
  const primeStore = useStoreCacheStore(state => state.primeStore);

  // Reactive cache read — re-renders automatically when primeStore() writes
  const cacheEntry = useStoreCacheStore(state => state.data[storeId]);

  const products = useMemo(() => getCachedProducts(cacheEntry) ?? [], [cacheEntry]);

  // "Suggested for you" — products the store owner starred
  const suggested = useMemo(
    () => products.filter(p => p.isSuggested && p.isAvailable),
    [products],
  );

  // Products grouped by category (preserving category order from the API)
  const categories = useMemo(() => cacheEntry?.categories ?? [], [cacheEntry]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (!p.isAvailable || !p.categoryId) continue;
      const bucket = map.get(p.categoryId) ?? [];
      bucket.push(p);
      map.set(p.categoryId, bucket);
    }
    return map;
  }, [products]);

  // Uncategorised available products
  const uncategorised = useMemo(
    () => products.filter(p => p.isAvailable && !p.categoryId),
    [products],
  );

  const cartCount = getItemCount();

  const navigateToProduct = useCallback(
    (productId: string) =>
      navigation.navigate('ProductDetails', { productId, storeId }),
    [navigation, storeId],
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Fetch store info and prime product cache in parallel.
        // primeStore() is idempotent — safe to call if already cached.
        const [storeData] = await Promise.all([
          storesApi.getById(storeId),
          primeStore(storeId),
        ]);
        if (!cancelled) setStore(storeData);
      } catch (err) {
        console.error('StoreDetailsScreen init failed:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [storeId, primeStore]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Store not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {store.imageUrl ? (
            <Image source={{ uri: store.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="storefront" size={64} color={COLORS.textSecondary} />
            </View>
          )}

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroCartBtn}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="bag-handle-outline" size={22} color={COLORS.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.statusPill, store.isOpen ? styles.pillOpen : styles.pillClosed]}>
            <View style={[styles.statusDot, { backgroundColor: store.isOpen ? '#34D058' : '#aaa' }]} />
            <Text style={[styles.statusText, { color: store.isOpen ? '#166534' : '#555' }]}>
              {store.isOpen ? 'Open now' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* ── Store info ────────────────────────────────────────────── */}
        <View style={styles.infoBlock}>
          <Text style={styles.storeName}>{store.name}</Text>
          {store.description ? (
            <Text style={styles.storeDesc}>{store.description}</Text>
          ) : null}
          {!store.isOpen && (
            <View style={styles.closedNotice}>
              <Ionicons name="time-outline" size={16} color="#92400E" />
              <Text style={styles.closedNoticeText}>
                This store is currently closed. You can browse products, but ordering is unavailable.
              </Text>
            </View>
          )}
        </View>

        {/* ── Browse all products — top entry point ─────────────────── */}
        <View style={[styles.section, { marginTop: SPACING.md }]}>
          <TouchableOpacity
            style={styles.browseCard}
            onPress={() =>
              navigation.navigate('AllProducts', { storeId, storeName: store.name })
            }
            activeOpacity={0.75}
          >
            <View style={styles.browseIcon}>
              <Ionicons name="list-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.browseText}>
              <Text style={styles.browseTitle}>Browse all products</Text>
              <Text style={styles.browseSub}>Search and filter the full catalogue</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Products loading state — shown while primeStore is in flight */}
        {products.length === 0 && (
          <View style={styles.productsLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.productsLoadingText}>Loading products…</Text>
          </View>
        )}

        {/* ── Suggested for you ─────────────────────────────────────── */}
        {suggested.length > 0 && (
          <Section title="Suggested for you">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productRow}
            >
              {suggested.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  storeId={storeId}
                  onPress={() => navigateToProduct(p.id)}
                />
              ))}
            </ScrollView>
          </Section>
        )}

        {/* ── Category sections ─────────────────────────────────────── */}
        {categories.map(cat => {
          const catProducts = productsByCategory.get(cat.id);
          if (!catProducts || catProducts.length === 0) return null;
          return (
            <Section key={cat.id} title={cat.name}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productRow}
              >
                {catProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    storeId={storeId}
                    onPress={() => navigateToProduct(p.id)}
                  />
                ))}
              </ScrollView>
            </Section>
          );
        })}

        {/* ── Uncategorised products ────────────────────────────────── */}
        {uncategorised.length > 0 && (
          <Section title="More items">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productRow}
            >
              {uncategorised.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  storeId={storeId}
                  onPress={() => navigateToProduct(p.id)}
                />
              ))}
            </ScrollView>
          </Section>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Cart bar ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.cartBarBtn, !store.isOpen && styles.cartBarBtnDisabled]}
          onPress={() => store.isOpen && navigation.navigate('Cart')}
          disabled={!store.isOpen}
          activeOpacity={store.isOpen ? 0.75 : 1}
        >
          <Ionicons
            name={store.isOpen ? 'bag-handle-outline' : 'time-outline'}
            size={18}
            color={COLORS.white}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.cartBarText}>
            {!store.isOpen
              ? 'Store is closed'
              : cartCount > 0
              ? `View cart (${cartCount})`
              : 'Your cart is empty'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.error, fontSize: 16 },

  // Hero
  hero: { width: '100%', height: 230, backgroundColor: '#E4E4E4', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#EBEBEB',
  },
  backBtn: {
    position: 'absolute', top: 52, left: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: 20, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 4, elevation: 3,
  },
  heroCartBtn: {
    position: 'absolute', top: 52, right: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: 20, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 4, elevation: 3,
  },
  cartBadge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: COLORS.primary, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  statusPill: {
    position: 'absolute', bottom: 12, right: SPACING.md,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5,
  },
  pillOpen: { backgroundColor: '#DCFCE7' },
  pillClosed: { backgroundColor: '#F0F0F0' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Info
  infoBlock: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  storeName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  storeDesc: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },
  closedNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: SPACING.sm, padding: SPACING.sm,
    backgroundColor: '#FEF3C7', borderRadius: 10,
  },
  closedNoticeText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },

  // Products loading placeholder
  productsLoading: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xl, gap: 10,
  },
  productsLoadingText: { fontSize: 14, color: COLORS.textSecondary },

  // Section
  section: { marginTop: SPACING.lg },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: COLORS.text,
    paddingHorizontal: SPACING.md, marginBottom: SPACING.sm,
  },

  // Product cards
  productRow: { paddingHorizontal: SPACING.md, gap: 10, paddingBottom: 4 },
  productCard: {
    width: CARD_W, backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  productImageWrap: {
    width: '100%', height: CARD_W, backgroundColor: '#EBEBEB',
  },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
  },
  productName: {
    fontSize: 13, fontWeight: '600', color: COLORS.text,
    paddingHorizontal: SPACING.sm, paddingTop: SPACING.sm,
  },
  productCat: {
    fontSize: 11, color: COLORS.primary, fontWeight: '500',
    paddingHorizontal: SPACING.sm, marginTop: 1,
  },
  productPrice: {
    fontSize: 13, fontWeight: '700', color: COLORS.text,
    paddingHorizontal: SPACING.sm, paddingBottom: SPACING.sm, marginTop: 2,
  },

  // Browse all card
  browseCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.md, backgroundColor: COLORS.white,
    borderRadius: 14, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primaryLight, gap: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  browseIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  browseText: { flex: 1 },
  browseTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  browseSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  cartBarBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
    borderRadius: 30, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
  },
  cartBarBtnDisabled: { backgroundColor: '#9CA3AF' },
  cartBarText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});
