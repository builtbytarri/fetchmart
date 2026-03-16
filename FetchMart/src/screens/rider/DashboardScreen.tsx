import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store';
import { deliveryApi } from '../../api';
import { Order } from '../../types';
import { COLORS, SPACING } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const RiderDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const orders = await deliveryApi.getMyDeliveries();
      // Filter to show only READY orders (available for pickup)
      const available = orders.filter(o => o.status === 'READY');
      setAvailableOrders(available);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleRefresh = () => {
    fetchOrders(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Rider'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Online Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <View style={[styles.statusDot, isOnline ? styles.statusOnline : styles.statusOffline]} />
            <Text style={styles.statusText}>
              {isOnline ? 'You are online' : 'You are offline'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
            thumbColor={isOnline ? COLORS.primary : '#BDBDBD'}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bicycle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Deliveries Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>₦0</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Available Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Available Orders {availableOrders.length > 0 && `(${availableOrders.length})`}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Deliveries')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {!isOnline ? (
          <View style={styles.offlineCard}>
            <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.offlineText}>Go online to see available orders</Text>
            <TouchableOpacity 
              style={styles.goOnlineButton}
              onPress={() => setIsOnline(true)}
            >
              <Text style={styles.goOnlineButtonText}>Go Online</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : availableOrders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No available orders</Text>
            <Text style={styles.emptySubtext}>New orders will appear here</Text>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {availableOrders.slice(0, 3).map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.miniOrderCard}
                onPress={() => navigation.navigate('DeliveryDetails', { orderId: order.id })}
              >
                <View style={styles.miniOrderLeft}>
                  <View style={styles.miniOrderIcon}>
                    <Ionicons name="storefront" size={18} color={COLORS.secondary} />
                  </View>
                  <View style={styles.miniOrderInfo}>
                    <Text style={styles.miniOrderStore} numberOfLines={1}>
                      {order.store?.name || 'Store'}
                    </Text>
                    <Text style={styles.miniOrderId}>
                      #{order.id.slice(-6).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.miniOrderRight}>
                  <Text style={styles.miniOrderAmount}>
                    ₦{Number(order.totalAmount).toLocaleString()}
                  </Text>
                  <View style={styles.miniOrderBadge}>
                    <Text style={styles.miniOrderBadgeText}>Ready</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {availableOrders.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('Deliveries')}
              >
                <Text style={styles.viewMoreText}>
                  View {availableOrders.length - 3} more orders
                </Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  statusOnline: {
    backgroundColor: COLORS.primary,
  },
  statusOffline: {
    backgroundColor: COLORS.textSecondary,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  offlineCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  goOnlineButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  goOnlineButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyOrders: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  ordersContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  miniOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  miniOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniOrderIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniOrderInfo: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  miniOrderStore: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  miniOrderId: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  miniOrderRight: {
    alignItems: 'flex-end',
  },
  miniOrderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  miniOrderBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  miniOrderBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: 8,
    gap: 4,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },
});
