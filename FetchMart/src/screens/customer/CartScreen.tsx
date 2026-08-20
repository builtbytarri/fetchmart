import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, DeliveryAddressModal } from '../../components';
import { useCartStore, useAuthStore } from '../../store';
import { paymentsApi, deliveryApi, usersApi, couponsApi } from '../../api';
import type { CouponValidation } from '../../api/coupons';
// App deep-link scheme (from app.json "scheme": "fetchmart")
const APP_SCHEME = 'fetchmart';
import { COLORS, SPACING } from '../../constants/config';
import { formatQty, roundQty, stepFor } from '../../utils/quantity';
import { CartItem, OrderQuote } from '../../types';

// FloatingTabBar geometry (must match FloatingTabBar.tsx)
const FLOATING_BAR_HEIGHT = 62;
const FLOATING_BAR_BOTTOM_MARGIN = 8; // sits 8px above the safe-area edge

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const CartScreen: React.FC<Props> = ({ navigation }) => {
  const { items, storeId, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = React.useState(false);
  const [quote, setQuote] = React.useState<OrderQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = React.useState(false);
  const [showAddressPicker, setShowAddressPicker] = React.useState(false);
  const [addressSaving, setAddressSaving] = React.useState(false);
  const [couponInput, setCouponInput] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponValidation | null>(null);
  const [couponLoading, setCouponLoading] = React.useState(false);

  // True when the cart was opened via stack navigation (from store/product pages).
  // When accessed through the tab bar, canGoBack() is false and we show no header
  // (the tab bar itself already provides navigation context).
  const canGoBack = navigation.canGoBack();

  // Always add clearance for the FloatingTabBar, which is position:absolute
  // and overlays content regardless of whether we came from a tab or a stack.
  // SafeAreaView handles insets.bottom; we only need to clear the bar itself
  // (62px) plus its margin above the safe-area edge (8px).
  const footerPaddingBottom = FLOATING_BAR_HEIGHT + FLOATING_BAR_BOTTOM_MARGIN + SPACING.md;

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  const orderTotal = quote
    ? Math.max(0, quote.total - (appliedCoupon?.discountAmount ?? 0))
    : getTotal();

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    const subtotal = quote?.subtotal ?? getTotal();
    setCouponLoading(true);
    try {
      const result = await couponsApi.validate(code, subtotal);
      setAppliedCoupon(result);
      setCouponInput(result.code);
    } catch (err: any) {
      setAppliedCoupon(null);
      Alert.alert('Invalid coupon', err.response?.data?.message ?? 'This coupon cannot be applied.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const handleConfirmAddress = async (address: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setAddressSaving(true);
    try {
      await usersApi.updateProfile({
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
      });
      patchUser({
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
      });
      setShowAddressPicker(false);
    } catch {
      Alert.alert('Error', 'Could not save address. Please try again.');
    } finally {
      setAddressSaving(false);
    }
  };

  // Fetch a delivery + fee quote whenever cart contents or the delivery address change.
  React.useEffect(() => {
    let cancelled = false;

    if (!storeId || items.length === 0) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    deliveryApi
      .getQuote({
        storeId,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        destLat: user?.latitude ?? undefined,
        destLng: user?.longitude ?? undefined,
      })
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, user?.latitude, user?.longitude, JSON.stringify(items.map((i) => [i.product.id, i.quantity]))]);

  const handleCheckout = async () => {
    if (!storeId || items.length === 0) return;

    setIsLoading(true);
    try {
      // Single atomic call: creates order + initiates Flutterwave.
      // If Flutterwave fails, the server deletes the order and restores stock
      // before returning the error — no orphan orders are ever created.
      const redirectUrl = `${APP_SCHEME}://payment/callback`;

      const result = await paymentsApi.checkout({
        storeId,
        items: items.map(item => ({
          productId: item.product.id,
          quantity:  item.quantity,
        })),
        destLat: user?.latitude ?? undefined,
        destLng: user?.longitude ?? undefined,
        redirectUrl,
        couponCode: appliedCoupon?.code,
      });

      // Cart is NOT cleared here — PaymentScreen clears it only on verified success.
      navigation.navigate('Payment', {
        orderId:    result.orderId,
        paymentUrl: result.authorizationUrl,
        reference:  result.reference,
      });
    } catch (err: any) {
      Alert.alert(
        'Checkout failed',
        err.response?.data?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.product.imageUrl ? (
        <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.placeholderImage]}>
          <Ionicons name="cube-outline" size={24} color={COLORS.textSecondary} />
        </View>
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.itemPrice}>{formatPrice(item.product.price)}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            updateQuantity(item.product.id, roundQty(item.quantity - stepFor(item.product)))
          }
        >
          <Ionicons name="remove" size={18} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.quantity}>{formatQty(item.quantity, item.product.unit)}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() =>
            updateQuantity(item.product.id, roundQty(item.quantity + stepFor(item.product)))
          }
        >
          <Ionicons name="add" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.product.id)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {canGoBack && (
          <View style={styles.stackHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.stackHeaderTitle}>Cart</Text>
            <View style={{ width: 38 }} />
          </View>
        )}
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-handle-outline" size={72} color="#D0D0D0" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items from a store to get started
          </Text>
          <Button
            title="Browse Stores"
            onPress={() => navigation.navigate('CustomerTabs', { screen: 'Home' })}
            style={styles.browseButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Stack header: only shown when opened from store/product pages ── */}
      {canGoBack ? (
        <View style={styles.stackHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.stackHeaderTitle}>Cart</Text>
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Tab header: title + clear, no back (tab bar provides navigation) ── */
        <View style={styles.tabHeader}>
          <Text style={styles.title}>Your Cart</Text>
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Footer: delivery address + breakdown + checkout ─────────── */}
      <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>

        {/* Delivery Address row */}
        <TouchableOpacity
          style={styles.addressRow}
          onPress={() => setShowAddressPicker(true)}
          activeOpacity={0.75}
        >
          <View style={styles.addressIcon}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.addressTextWrap}>
            <Text style={styles.addressLabel}>Deliver to</Text>
            <Text style={styles.addressValue} numberOfLines={1}>
              {user?.address ?? 'Tap to set delivery address'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Promo code */}
        <View style={styles.couponRow}>
          <Ionicons name="pricetag-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.couponInput}
            placeholder="Promo code"
            placeholderTextColor={COLORS.textSecondary}
            value={couponInput}
            onChangeText={(t) => { setCouponInput(t.toUpperCase()); setAppliedCoupon(null); }}
            autoCapitalize="characters"
            editable={!appliedCoupon}
          />
          {appliedCoupon ? (
            <TouchableOpacity onPress={handleRemoveCoupon}>
              <Text style={styles.couponRemoveText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
              <Text style={[styles.couponApplyText, (!couponInput.trim() || couponLoading) && { opacity: 0.4 }]}>
                {couponLoading ? '…' : 'Apply'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(quote?.subtotal ?? getTotal())}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service fee</Text>
          <Text style={styles.summaryValue}>
            {quote ? formatPrice(quote.serviceFee) : '—'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            Delivery{quote ? ` (${quote.distanceKm.toFixed(1)} km)` : ''}
          </Text>
          <Text style={styles.summaryValue}>
            {quoteLoading ? 'Calculating…' : quote ? formatPrice(quote.deliveryFee) : '—'}
          </Text>
        </View>
        {appliedCoupon && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: COLORS.primary }]}>
              Discount ({appliedCoupon.code})
            </Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
              −{formatPrice(appliedCoupon.discountAmount)}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            {quote ? formatPrice(orderTotal) : formatPrice(getTotal())}
          </Text>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          loading={isLoading}
          disabled={quoteLoading || !user?.address}
        />
        {!user?.address && (
          <Text style={styles.addressWarning}>Please set a delivery address to continue</Text>
        )}
        {/* When in stack mode, offer a shortcut back to shopping */}
        {canGoBack && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.continueBtnText}>Continue shopping</Text>
          </TouchableOpacity>
        )}
      </View>

      <DeliveryAddressModal
        visible={showAddressPicker}
        onClose={() => setShowAddressPicker(false)}
        onConfirm={handleConfirmAddress}
        initialAddress={user?.address ?? ''}
        initialLatitude={user?.latitude}
        initialLongitude={user?.longitude}
        confirmLoading={addressSaving}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // ── Stack header (back button visible)
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearBtn: { padding: 4 },

  // ── Tab header (no back button — tab bar handles navigation)
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  browseButton: {
    paddingHorizontal: SPACING.xl,
  },

  // ── List
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: { padding: 4 },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: SPACING.sm,
  },
  removeButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },

  // ── Footer
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  couponInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 4,
  },
  couponApplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  couponRemoveText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: 8,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ── Delivery address row ──────────────────────────────────────────────────
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  addressIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  addressTextWrap: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  addressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  addressWarning: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
});
