import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { storesApi, socketClient } from '../../api';
import { Order, OrderStatus } from '../../types';
import { COLORS, SPACING } from '../../constants/config';
import { formatQty } from '../../utils/quantity';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type Tab = 'incoming' | 'active' | 'done';

// Status groups
const INCOMING_STATUSES: OrderStatus[] = ['PAID'];
const ACTIVE_STATUSES: OrderStatus[] = ['STORE_ACCEPTED', 'PREPARING', 'ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'];
const DONE_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED'];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PAID:           { bg: '#E3F2FD', text: '#1565C0' },
  STORE_ACCEPTED: { bg: '#EDE7F6', text: '#4527A0' },
  PREPARING:      { bg: '#FFF8E1', text: '#E65100' },
  READY:          { bg: '#E8F5E9', text: '#2E7D32' },
  ASSIGNED:       { bg: '#E8EAF6', text: '#283593' },
  PICKED_UP:      { bg: '#E0F7FA', text: '#006064' },
  EN_ROUTE:       { bg: '#F3E5F5', text: '#6A1B9A' },
  ARRIVED:        { bg: '#E8F5E9', text: '#1B5E20' },
  COMPLETED:      { bg: '#E8F5E9', text: '#2E7D32' },
  CANCELLED:      { bg: '#FFEBEE', text: '#B71C1C' },
};

const STATUS_LABEL: Record<string, string> = {
  PAID:           'New Order',
  STORE_ACCEPTED: 'Accepted',
  PREPARING:      'Preparing',
  READY:          'Ready',
  ASSIGNED:       'Rider assigned',
  PICKED_UP:      'Picked up',
  EN_ROUTE:       'En route',
  ARRIVED:        'Arrived',
  COMPLETED:      'Completed',
  CANCELLED:      'Cancelled',
};

// What button to show for each current status (store actions only up to READY)
type ActionConfig = { label: string; nextStatus: OrderStatus; color: string } | null;
function getNextAction(status: OrderStatus): ActionConfig {
  switch (status) {
    // Accepting a paid order moves it straight to PREPARING (no extra tap).
    case 'PAID':           return { label: 'Accept Order', nextStatus: 'PREPARING', color: COLORS.primary };
    // Legacy in-flight orders still on STORE_ACCEPTED can advance to PREPARING.
    case 'STORE_ACCEPTED': return { label: 'Start Preparing', nextStatus: 'PREPARING', color: '#7B1FA2' };
    case 'PREPARING':      return { label: 'Mark Ready',   nextStatus: 'READY',     color: '#E65100' };
    default:               return null;
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

export const StoreOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tab, setTab]                 = useState<Tab>('incoming');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const data = await storesApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('StoreOrdersScreen fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  // Real-time: re-fetch when an order changes status
  useEffect(() => {
    const handler = () => fetchOrders();
    socketClient.on('order_status_changed', handler);
    return () => socketClient.off('order_status_changed', handler);
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, nextStatus: OrderStatus) => {
    setActionLoading(orderId);
    try {
      const updated = await storesApi.updateOrderStatus(orderId, nextStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not update order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you cannot fulfil this order? It will be cancelled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(orderId);
            try {
              await storesApi.rejectOrder(orderId);
              setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: 'CANCELLED' } : o
              ));
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message ?? 'Could not reject order');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const incomingOrders = orders.filter(o => INCOMING_STATUSES.includes(o.status));
  const activeOrders   = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const doneOrders     = orders.filter(o => DONE_STATUSES.includes(o.status));

  const displayedOrders =
    tab === 'incoming' ? incomingOrders :
    tab === 'active'   ? activeOrders   : doneOrders;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'incoming', label: 'Incoming',  count: incomingOrders.length },
    { key: 'active',   label: 'Active',    count: activeOrders.length },
    { key: 'done',     label: 'Done',      count: doneOrders.length },
  ];

  const renderOrder = ({ item }: { item: Order }) => {
    const cfg = STATUS_COLOR[item.status] ?? { bg: '#F5F5F5', text: '#666' };
    const action = getNextAction(item.status);
    const isActing = actionLoading === item.id;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.cardTime}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.text }]}>
              {STATUS_LABEL[item.status] ?? item.status}
            </Text>
          </View>
        </View>

        {/* Customer info */}
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {(item as any).customer?.name ?? 'Customer'}{' '}
            {(item as any).customer?.phone ? `· ${(item as any).customer.phone}` : ''}
          </Text>
        </View>

        {/* Items */}
        {Array.isArray((item as any).orderItems) && (item as any).orderItems.length > 0 && (
          <View style={styles.itemsContainer}>
            {(item as any).orderItems.map((oi: any, idx: number) => (
              <Text key={idx} style={styles.itemLine}>
                {formatQty(Number(oi.quantity), oi.unit)}× {oi.productName}
              </Text>
            ))}
          </View>
        )}

        {/* Rider info (if assigned) */}
        {(item as any).rider && (
          <View style={styles.infoRow}>
            <Ionicons name="bicycle-outline" size={14} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: COLORS.primary }]}>
              Rider: {(item as any).rider?.user?.name ?? 'Assigned'}
            </Text>
          </View>
        )}

        {/* Footer — amount + actions */}
        <View style={styles.cardFooter}>
          <Text style={styles.amount}>₦{Number(item.totalAmount).toLocaleString()}</Text>
          <View style={styles.actionsRow}>
            {/* Reject button — only for PAID orders */}
            {item.status === 'PAID' && (
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item.id)}
                disabled={isActing}
              >
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            )}
            {action && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: action.color }]}
                onPress={() => handleStatusUpdate(item.id, action.nextStatus)}
                disabled={isActing}
              >
                {isActing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
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

      {/* Incoming alert banner */}
      {tab === 'incoming' && incomingOrders.length > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="notifications" size={16} color="#7B3F00" />
          <Text style={styles.alertText}>
            {incomingOrders.length} order{incomingOrders.length > 1 ? 's' : ''} waiting for your acceptance
          </Text>
        </View>
      )}

      <FlatList
        data={displayedOrders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchOrders(true)}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {tab === 'incoming' ? 'No new orders' :
               tab === 'active'   ? 'No active orders' :
               'No completed orders yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {tab === 'incoming'
                ? 'New orders will appear here when customers pay'
                : 'Orders you accept will show here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },

  tabsContainer: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tab:         { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:   { borderBottomColor: COLORS.primary },
  tabText:     { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF3CD', paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FFDEA0',
  },
  alertText: { fontSize: 13, fontWeight: '600', color: '#7B3F00', flex: 1 },

  listContent: { padding: SPACING.md },

  card: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  cardId:     { fontSize: 14, fontWeight: '700', color: COLORS.text },
  cardTime:   { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  badge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText:  { fontSize: 11, fontWeight: '700' },

  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  infoText:   { fontSize: 13, color: COLORS.textSecondary, flex: 1 },

  itemsContainer: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: SPACING.sm, marginVertical: 6 },
  itemLine:       { fontSize: 13, color: COLORS.text, marginBottom: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  amount:     { fontSize: 16, fontWeight: '800', color: COLORS.text },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },

  rejectBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.error,
  },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.error },

  actionBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },

  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xl * 2 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: SPACING.md },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
