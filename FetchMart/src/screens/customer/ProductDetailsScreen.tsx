import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { productsApi, storesApi } from '../../api';
import { Product } from '../../types';
import { useCartStore } from '../../store';
import {
  useStoreCacheStore,
  getCachedProduct,
  getSimilarFromCache,
} from '../../store/storeCacheStore';
import { COLORS, SPACING } from '../../constants/config';
import { UNIT_LABEL } from '../../types';
import { formatQty, quickPicks, roundQty, stepFor } from '../../utils/quantity';
import { CustomerStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const CARD_W = (width - SPACING.md * 2 - 12) / 2.3;

type Props = NativeStackScreenProps<CustomerStackParamList, 'ProductDetails'>;

// ─── Similar item card ───────────────────────────────────────────────────────
const SimilarCard: React.FC<{
  item: Product;
  onPress: () => void;
}> = ({ item, onPress }) => (
  <TouchableOpacity style={styles.similarCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.similarImageWrap}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.similarImage} />
      ) : (
        <View style={styles.similarImagePlaceholder}>
          <Ionicons name="cube-outline" size={28} color={COLORS.textSecondary} />
        </View>
      )}
    </View>
    <Text style={styles.similarName} numberOfLines={1}>{item.name}</Text>
    {item.category && (
      <Text style={styles.similarCat} numberOfLines={1}>{item.category.name}</Text>
    )}
    <Text style={styles.similarPrice}>₦{Number(item.price).toLocaleString()}</Text>
  </TouchableOpacity>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export const ProductDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId, storeId } = route.params;
  const { addItem } = useCartStore();

  // ── Cache reads (reactive — re-renders when cache updates) ───────────────
  const cacheEntry = useStoreCacheStore(
    state => storeId ? state.data[storeId] : undefined,
  );

  const cachedProduct = useMemo(
    () => storeId ? getCachedProduct(cacheEntry, productId) : undefined,
    [cacheEntry, productId, storeId],
  );

  const similarFromCache = useMemo(
    () => storeId ? getSimilarFromCache(cacheEntry, productId) : [],
    [cacheEntry, productId, storeId],
  );

  // ── API fallback state — only used on cache miss ─────────────────────────
  const [apiProduct, setApiProduct] = useState<Product | null>(null);
  const [apiSimilar, setApiSimilar] = useState<Product[]>([]);
  // Don't show loader if we already have the product from cache
  const [isLoading, setIsLoading] = useState(!cachedProduct);

  const [quantity, setQuantity] = useState<number | null>(null);
  const [storeOpen, setStoreOpen] = useState(true);

  // Resolved values — cache wins over API
  const product = cachedProduct ?? apiProduct;
  const similarProducts = storeId ? similarFromCache : apiSimilar;

  useEffect(() => {
    if (!storeId) return;
    storesApi.getById(storeId)
      .then(s => setStoreOpen(s.isOpen))
      .catch(() => setStoreOpen(true));
  }, [storeId]);

  useEffect(() => {
    // Cache hit — nothing to fetch
    if (cachedProduct) {
      setIsLoading(false);
      return;
    }

    // Cache miss — fetch from API (typically only happens on deep-link / direct nav)
    let cancelled = false;
    setIsLoading(true);

    const fetchProduct = async () => {
      try {
        const [productData, similar] = await Promise.all([
          productsApi.getById(productId),
          productsApi.getSimilar(productId),
        ]);
        if (!cancelled) {
          setApiProduct(productData);
          setApiSimilar(similar);
        }
      } catch (err) {
        console.error('ProductDetailsScreen fetch failed:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProduct();
    return () => { cancelled = true; };
    // Only re-fetch if productId changes. cachedProduct becoming defined after
    // cache loads will naturally update `product` via the memo above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleAddToCart = () => {
    if (!storeOpen) return;
    if (product) {
      addItem(product, qty);
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const step = stepFor(product);
  // Default the picker to one step: a whole tin, or half a mudu.
  const qty = quantity ?? step;
  const picks = quickPicks(step);
  // IN_STOCK products are not counted, so only isAvailable governs them.
  const isOutOfStock =
    !product.isAvailable ||
    (product.stockMode === 'COUNTED' && Number(product.stockQuantity) <= 0);
  const cannotPurchase = isOutOfStock || !storeOpen;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Product image ──────────────────────────────────────────── */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="cube-outline" size={80} color={COLORS.textSecondary} />
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* ── Info card ─────────────────────────────────────────────── */}
        <View style={styles.infoCard}>

          {product.category && (
            <Text style={styles.categoryLabel}>{product.category.name}</Text>
          )}

          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                ₦{Number(product.price).toLocaleString()}
                <Text style={styles.perUnit}>
                  {UNIT_LABEL[product.unit] ? ` / ${UNIT_LABEL[product.unit]}` : ' / unit'}
                </Text>
              </Text>
            </View>

            <View style={styles.quantityBox}>
              <Text style={styles.quantityLabel}>Qty</Text>
              <View style={[styles.stepper, !storeOpen && styles.stepperDisabled]}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setQuantity(roundQty(Math.max(step, qty - step)))}
                  disabled={!storeOpen}
                >
                  <Ionicons name="remove" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.stepValue}>{formatQty(qty)}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setQuantity(roundQty(qty + step))}
                  disabled={!storeOpen}
                >
                  <Ionicons name="add" size={16} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick amounts — only meaningful for goods sold in fractions,
              so a plain countable item never sees them. */}
          {picks.length > 0 && storeOpen && !isOutOfStock && (
            <View style={styles.picksRow}>
              {picks.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pickChip, qty === p && styles.pickChipActive]}
                  onPress={() => setQuantity(p)}
                >
                  <Text style={[styles.pickText, qty === p && styles.pickTextActive]}>
                    {formatQty(p, product.unit)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockBanner}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.error} />
              <Text style={styles.outOfStockText}>Out of stock</Text>
            </View>
          )}

          {!storeOpen && !isOutOfStock && (
            <View style={styles.closedBanner}>
              <Ionicons name="time-outline" size={14} color="#92400E" />
              <Text style={styles.closedText}>Store is closed — you can browse but cannot order</Text>
            </View>
          )}

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {/* ── Similar items (same category, zero network calls) ───── */}
          {similarProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Similar items</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarRow}
              >
                {similarProducts.map(item => (
                  <SimilarCard
                    key={item.id}
                    item={item}
                    onPress={() =>
                      navigation.push('ProductDetails', { productId: item.id, storeId })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Add to cart bar ───────────────────────────────────────────── */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addToCartBtn, cannotPurchase && styles.addToCartDisabled]}
          onPress={handleAddToCart}
          disabled={cannotPurchase}
        >
          <Text style={styles.addToCartText}>
            {!storeOpen
              ? 'Store is closed'
              : isOutOfStock
              ? 'Out of stock'
              : `Add ${formatQty(qty, product.unit)} to cart — ₦${roundQty(
                  Number(product.price) * qty,
                ).toLocaleString()}`}
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

  imageContainer: { width: '100%', height: 280, backgroundColor: '#EBEBEB', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
  },
  backButton: {
    position: 'absolute', top: 52, left: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: 20, padding: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 4, elevation: 3,
  },

  infoCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    marginTop: -20,
    padding: SPACING.md,
  },
  categoryLabel: {
    fontSize: 12, fontWeight: '600', color: COLORS.primary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: SPACING.sm,
  },
  titleBlock: { flex: 1, marginRight: SPACING.sm },
  productName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  productPrice: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  perUnit: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },

  picksRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, flexWrap: 'wrap' },
  pickChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pickChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  pickText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  pickTextActive: { color: COLORS.primaryDark },
  quantityBox: { alignItems: 'flex-end' },
  quantityLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 22, paddingHorizontal: 4,
  },
  stepperDisabled: { opacity: 0.45 },
  stepBtn: { padding: 8 },
  stepValue: {
    fontSize: 16, fontWeight: '700', color: COLORS.text,
    minWidth: 26, textAlign: 'center',
  },

  outOfStockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, marginBottom: SPACING.sm,
  },
  outOfStockText: { fontSize: 13, color: COLORS.error, fontWeight: '500' },

  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, marginBottom: SPACING.sm,
  },
  closedText: { fontSize: 13, color: '#92400E', fontWeight: '500', flex: 1 },

  description: {
    fontSize: 14, color: COLORS.textSecondary, lineHeight: 21,
    marginTop: 4, marginBottom: SPACING.md,
  },

  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  similarRow: { gap: 10, paddingBottom: 4 },

  similarCard: {
    width: CARD_W, backgroundColor: '#F7F7F7', borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: '#ECECEC',
  },
  similarImageWrap: { width: '100%', height: CARD_W, backgroundColor: '#E8E8E8' },
  similarImage: { width: '100%', height: '100%' },
  similarImagePlaceholder: {
    width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center',
  },
  similarName: {
    fontSize: 13, fontWeight: '600', color: COLORS.text,
    paddingHorizontal: SPACING.sm, paddingTop: SPACING.sm,
  },
  similarCat: { fontSize: 11, color: COLORS.primary, paddingHorizontal: SPACING.sm, marginTop: 1 },
  similarPrice: {
    fontSize: 13, fontWeight: '700', color: COLORS.text,
    paddingHorizontal: SPACING.sm, paddingBottom: SPACING.sm, marginTop: 2,
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  addToCartBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
    borderRadius: 30, alignItems: 'center',
  },
  addToCartDisabled: { backgroundColor: '#BBBBBB' },
  addToCartText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
