import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store';
import { deliveryApi, ridersApi, socketClient } from '../../api';
import { Order } from '../../types';
import { COLORS, SPACING } from '../../constants/config';

type Props = { navigation: NativeStackNavigationProp<any> };

interface OrderOffer {
  orderId: string;
  store: { id: string; name: string };
  riderPayout?: number;
  timeoutSeconds: number;
}

export const RiderDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();

  const [isOnline, setIsOnline] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);

  // ── Order offer accept/decline modal ─────────────────────────────────────
  const [currentOffer, setCurrentOffer] = useState<OrderOffer | null>(null);
  const [offerCountdown, setOfferCountdown] = useState(0);
  const [isRespondingToOffer, setIsRespondingToOffer] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load rider status + orders ────────────────────────────────────────────
  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [profile, available, active] = await Promise.all([
        ridersApi.getMe(),
        deliveryApi.getAvailableOrders(),
        deliveryApi.getMyDeliveries(),
      ]);
      setIsOnline(profile.isAvailable);
      setAvailableOrders(available);
      setActiveDeliveries(active);
    } catch (err) {
      console.error('RiderDashboard fetchData error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ── Order offer WebSocket listener ────────────────────────────────────────
  useEffect(() => {
    const handleOrderOffered = (data: unknown) => {
      const offer = data as OrderOffer;
      setCurrentOffer(offer);
      setOfferCountdown(offer.timeoutSeconds ?? 60);

      // Start countdown
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setOfferCountdown(prev => {
          if (prev <= 1) {
            // Timeout — auto-decline
            clearInterval(countdownRef.current!);
            handleRespondToOffer('DECLINE', offer.orderId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    socketClient.on('order_offered', handleOrderOffered);
    return () => {
      socketClient.off('order_offered', handleOrderOffered);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleRespondToOffer = async (action: 'ACCEPT' | 'DECLINE', orderId?: string) => {
    const id = orderId ?? currentOffer?.orderId;
    if (!id) return;

    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsRespondingToOffer(true);
    try {
      await deliveryApi.respondToOffer(id, action);
      if (action === 'ACCEPT') {
        setCurrentOffer(null);
        fetchData();
        navigation.navigate('DeliveryDetails', { orderId: id });
      } else {
        setCurrentOffer(null);
      }
    } catch (err: any) {
      setCurrentOffer(null);
      if (action === 'ACCEPT') {
        Alert.alert('Already taken', 'This order was assigned to another rider.');
      }
    } finally {
      setIsRespondingToOffer(false);
    }
  };

  // ── Online / offline toggle ───────────────────────────────────────────────
  const handleToggleOnline = async (value: boolean) => {
    setIsTogglingOnline(true);
    try {
      await ridersApi.updateAvailability({ isAvailable: value });
      setIsOnline(value);
    } catch (err: any) {
      Alert.alert(
        'Could not update status',
        err?.response?.data?.message ?? 'Please try again.',
      );
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const activeCount = activeDeliveries.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? 'R')[0].toUpperCase()}
            </Text>
          </View>
          {/* Greeting */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user?.name ?? 'Rider'}</Text>
          </View>
          {/* Notification bell */}
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Online status card */}
        <View style={[styles.statusCard, isOnline && styles.statusCardOnline]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <View>
              <Text style={styles.statusLabel}>
                {isOnline ? 'You are online' : 'You are offline'}
              </Text>
              <Text style={styles.statusSub}>
                {isOnline
                  ? 'You can receive new delivery requests'
                  : 'Go online to start receiving orders'}
              </Text>
            </View>
          </View>
          {isTogglingOnline ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={isOnline ? COLORS.primary : '#BDBDBD'}
            />
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="bicycle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{availableOrders.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>₦0</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* Active deliveries — if any */}
        {activeCount > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My active deliveries ({activeCount})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Deliveries')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {activeDeliveries.slice(0, 2).map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('DeliveryDetails', { orderId: order.id })}
                activeOpacity={0.75}
              >
                <View style={styles.orderCardLeft}>
                  <View style={[styles.orderIcon, { backgroundColor: COLORS.primaryLight }]}>
                    <Ionicons name="bicycle" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.orderStore} numberOfLines={1}>{order.store?.name ?? 'Store'}</Text>
                    <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <Text style={styles.orderAmount}>₦{Number(order.totalAmount).toLocaleString()}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{order.status.replace('_', ' ')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Available orders feed */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Available orders{availableOrders.length > 0 ? ` (${availableOrders.length})` : ''}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Deliveries')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {!isOnline ? (
          <View style={styles.offlineCard}>
            <Ionicons name="cloud-offline-outline" size={44} color={COLORS.textSecondary} />
            <Text style={styles.offlineText}>Go online to see available orders</Text>
            <TouchableOpacity style={styles.goOnlineBtn} onPress={() => handleToggleOnline(true)}>
              <Text style={styles.goOnlineBtnText}>Go online</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : availableOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={44} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No available orders right now</Text>
            <Text style={styles.emptySub}>New orders will appear here</Text>
          </View>
        ) : (
          <>
            {availableOrders.slice(0, 3).map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('DeliveryDetails', { orderId: order.id })}
                activeOpacity={0.75}
              >
                <View style={styles.orderCardLeft}>
                  <View style={[styles.orderIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="storefront" size={18} color={COLORS.secondary} />
                  </View>
                  <View>
                    <Text style={styles.orderStore} numberOfLines={1}>{order.store?.name ?? 'Store'}</Text>
                    <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.orderCardRight}>
                  <Text style={styles.orderAmount}>₦{Number(order.totalAmount).toLocaleString()}</Text>
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyBadgeText}>Ready</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {availableOrders.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreBtn}
                onPress={() => navigation.navigate('Deliveries')}
              >
                <Text style={styles.viewMoreText}>
                  +{availableOrders.length - 3} more orders
                </Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── New order offer modal ──────────────────────────────────────── */}
      <Modal
        visible={!!currentOffer}
        transparent
        animationType="slide"
        onRequestClose={() => handleRespondToOffer('DECLINE')}
      >
        <View style={styles.offerOverlay}>
          <View style={styles.offerCard}>
            {/* Countdown ring */}
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownText}>{offerCountdown}</Text>
              <Text style={styles.countdownLabel}>sec</Text>
            </View>

            <Text style={styles.offerTitle}>New Delivery Request!</Text>
            <Text style={styles.offerStore}>{currentOffer?.store?.name}</Text>
            {currentOffer?.riderPayout != null && (
              <Text style={styles.offerPayout}>
                Earn ₦{Number(currentOffer.riderPayout).toLocaleString()}
              </Text>
            )}
            <Text style={styles.offerSub}>Head to the store as they prepare your order</Text>

            <View style={styles.offerActions}>
              <TouchableOpacity
                style={[styles.offerBtn, styles.declineBtn]}
                onPress={() => handleRespondToOffer('DECLINE')}
                disabled={isRespondingToOffer}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.offerBtn, styles.acceptBtn]}
                onPress={() => handleRespondToOffer('ACCEPT')}
                disabled={isRespondingToOffer}
              >
                {isRespondingToOffer ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.acceptBtnText}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 12, color: COLORS.textSecondary },
  userName:  { fontSize: 18, fontWeight: '700', color: COLORS.text },
  notifBtn:  {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },

  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, marginHorizontal: SPACING.md, marginTop: SPACING.md,
    padding: SPACING.md, borderRadius: 16,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  statusCardOnline: { borderColor: COLORS.primaryLight, backgroundColor: '#FAFFF8' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  statusDot:    { width: 12, height: 12, borderRadius: 6 },
  dotOnline:    { backgroundColor: COLORS.primary },
  dotOffline:   { backgroundColor: COLORS.textSecondary },
  statusLabel:  { fontSize: 15, fontWeight: '600', color: COLORS.text },
  statusSub:    { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  statsRow:  { flexDirection: 'row', marginHorizontal: SPACING.md, marginTop: SPACING.md, gap: SPACING.sm },
  statCard:  { flex: 1, backgroundColor: COLORS.white, padding: SPACING.sm, borderRadius: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: SPACING.md, marginTop: SPACING.lg, marginBottom: SPACING.xs,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },

  orderCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm, padding: SPACING.md, borderRadius: 12,
  },
  orderCardLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  orderIcon:      { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  orderStore:     { fontSize: 14, fontWeight: '600', color: COLORS.text, maxWidth: 180 },
  orderId:        { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  orderCardRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount:    { fontSize: 14, fontWeight: '700', color: COLORS.text },

  activeBadge:     { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  readyBadge:      { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  readyBadgeText:  { fontSize: 10, fontWeight: '700', color: COLORS.secondary },

  offlineCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.md,
    padding: SPACING.xl, borderRadius: 12, alignItems: 'center', gap: 8,
  },
  offlineText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  goOnlineBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
  goOnlineBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },

  emptyCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.md,
    padding: SPACING.xl, borderRadius: 12, alignItems: 'center', gap: 6,
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  emptySub:  { fontSize: 13, color: COLORS.textSecondary },

  loadingBox: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.md,
    padding: SPACING.xl, borderRadius: 12, alignItems: 'center',
  },

  viewMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: SPACING.md, backgroundColor: COLORS.white,
    padding: SPACING.sm, borderRadius: 8, gap: 4,
  },
  viewMoreText: { fontSize: 13, fontWeight: '500', color: COLORS.primary },

  offerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  offerCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, paddingBottom: 36, alignItems: 'center', gap: SPACING.sm,
  },
  countdownCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  countdownText: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  countdownLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: -4 },
  offerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  offerStore: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  offerPayout: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  offerSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  offerActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm, width: '100%' },
  offerBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  declineBtn: { backgroundColor: '#FFE0E0' },
  acceptBtn: { backgroundColor: COLORS.primary },
  declineBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
  acceptBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
