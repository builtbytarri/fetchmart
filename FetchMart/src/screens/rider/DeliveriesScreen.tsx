import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { deliveryApi } from '../../api';
import { Order } from '../../types';
import { COLORS, SPACING } from '../../constants/config';

type Tab = 'available' | 'active' | 'completed';

type Props = { navigation: NativeStackNavigationProp<any> };

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  READY:     { label: 'Available',  bg: '#FFF3E0', text: '#E65100' },
  ASSIGNED:  { label: 'Pickup',     bg: '#E3F2FD', text: '#1565C0' },
  PICKED_UP: { label: 'In transit', bg: '#E8EAF6', text: '#283593' },
  EN_ROUTE:  { label: 'On the way', bg: '#E8EAF6', text: '#283593' },
  ARRIVED:   { label: 'Arrived',    bg: COLORS.primaryLight, text: COLORS.primary },
  COMPLETED: { label: 'Delivered',  bg: COLORS.primaryLight, text: COLORS.primary },
};

export const DeliveriesScreen: React.FC<Props> = ({ navigation }) => {
  const [available,  setAvailable]  = useState<Order[]>([]);
  const [active,     setActive]     = useState<Order[]>([]);
  const [completed,  setCompleted]  = useState<Order[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('available');

  const fetchDeliveries = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [avail, act, done] = await Promise.all([
        deliveryApi.getAvailableOrders(),
        deliveryApi.getMyDeliveries(),
        deliveryApi.getCompletedDeliveries(),
      ]);
      setAvailable(avail);
      setActive(act);
      setCompleted(done);
    } catch (err) {
      console.error('DeliveriesScreen fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDeliveries(); }, [fetchDeliveries]));

  const renderDelivery = ({ item }: { item: Order }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, bg: '#F5F5F5', text: '#666' };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DeliveryDetails', { orderId: item.id })}
        activeOpacity={0.75}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Route visualization */}
        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.routeText} numberOfLines={1}>{item.store?.name ?? 'Store'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.error }]} />
            <Text style={styles.routeText} numberOfLines={1}>
              {(item as any).customer?.address ?? (item as any).customer?.name ?? 'Customer'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.amount}>₦{Number(item.totalAmount).toLocaleString()}</Text>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'available', label: 'Available', count: available.length },
    { key: 'active',    label: 'Active',    count: active.length },
    { key: 'completed', label: 'Done',      count: 0 },
  ];

  const data = tab === 'available' ? available : tab === 'active' ? active : completed;

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Deliveries</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}{t.count > 0 ? ` (${t.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderDelivery}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchDeliveries(true)}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bicycle-outline" size={52} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {tab === 'available' ? 'No orders ready right now'
                : tab === 'active' ? 'No active deliveries'
                : 'No completed deliveries yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, backgroundColor: COLORS.white },
  title:  { fontSize: 22, fontWeight: '700', color: COLORS.text },

  tabs: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: COLORS.primary },
  tabText:      { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive:{ color: COLORS.primary, fontWeight: '700' },

  list: { padding: SPACING.md },

  card: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  cardId:      { fontSize: 14, fontWeight: '700', color: COLORS.text },
  badge:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText:   { fontSize: 11, fontWeight: '700' },

  route:    { marginBottom: SPACING.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
  routeLine:{ width: 2, height: 16, backgroundColor: '#E0E0E0', marginLeft: 3.5, marginVertical: 2 },
  routeText:{ flex: 1, fontSize: 13, color: COLORS.text },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  amount:     { fontSize: 15, fontWeight: '700', color: COLORS.text },
  viewBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 2 },
  viewBtnText:{ fontSize: 12, fontWeight: '600', color: COLORS.primary },

  empty:     { alignItems: 'center', paddingVertical: SPACING.xl * 2, gap: SPACING.sm },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
});
