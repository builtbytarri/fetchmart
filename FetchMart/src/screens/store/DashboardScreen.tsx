import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store';
import { storesApi } from '../../api';
import { Store } from '../../types';
import { COLORS, SPACING } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [store, setStore] = useState<Store | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [revenueToday, setRevenueToday] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleToggleStoreStatus = async (newStatus: boolean) => {
    if (!store) return;
    
    setIsTogglingStatus(true);
    try {
      const updatedStore = await storesApi.update(store.id, { isOpen: newStatus });
      setStore({ ...store, isOpen: updatedStore.isOpen });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update store status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const fetchStore = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const stores = await storesApi.getMyStores();
      if (stores.length > 0) {
        const s = stores[0];
        setStore(s);
        const [products, orders] = await Promise.all([
          storesApi.getProducts(s.id),
          storesApi.getMyOrders().catch(() => [] as any[]),
        ]);
        setProductCount(products.length);

        const todayStr = new Date().toDateString();
        // Only count orders the customer has actually paid for (exclude unpaid CREATED).
        const PAID_STATUSES = [
          'PAID', 'STORE_ACCEPTED', 'PREPARING', 'READY',
          'ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED', 'COMPLETED',
        ];
        const todayOrders = orders.filter(
          (o: any) =>
            new Date(o.createdAt).toDateString() === todayStr &&
            PAID_STATUSES.includes(o.status),
        );
        setOrdersToday(todayOrders.length);
        // Store revenue = gross item subtotal (what the store sold), NOT the full
        // order total — that also includes the app's service + delivery fees,
        // which belong to the platform/rider, not the store. The store's net after
        // the FetchMart commission is lower (shown in the wallet).
        setRevenueToday(
          todayOrders.reduce((sum: number, o: any) => sum + Number(o.subtotal ?? 0), 0),
        );
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load store:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchStore(true)}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Store Owner'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Store Info Card */}
        {store ? (
          <View style={styles.storeCard}>
            <View style={styles.storeIconContainer}>
              <Ionicons name="storefront" size={40} color={COLORS.primary} />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{store.name}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, store.isOpen ? styles.statusOpen : styles.statusClosed]} />
                <Text style={styles.statusText}>{store.isOpen ? 'Open' : 'Closed'}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('StoreSettings')}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.createStoreCard}
            onPress={() => navigation.navigate('CreateStore')}
          >
            <Ionicons name="add-circle-outline" size={40} color={COLORS.primary} />
            <Text style={styles.createStoreText}>Create Your Store</Text>
            <Text style={styles.createStoreSubtext}>Set up your store to start selling</Text>
          </TouchableOpacity>
        )}

        {/* Store Status Toggle */}
        {store && (
          <View style={styles.statusToggleCard}>
            <View style={styles.statusToggleInfo}>
              <Text style={styles.statusToggleLabel}>
                Store is {store.isOpen ? 'Open' : 'Closed'}
              </Text>
              <Text style={styles.statusToggleDescription}>
                {store.isOpen 
                  ? 'Customers can see and order from your store' 
                  : 'Your store is hidden from customers'}
              </Text>
            </View>
            {isTogglingStatus ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Switch
                value={store.isOpen}
                onValueChange={handleToggleStoreStatus}
                trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                thumbColor={store.isOpen ? COLORS.primary : '#BDBDBD'}
              />
            )}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cart-outline" size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>{ordersToday}</Text>
            <Text style={styles.statLabel}>Orders Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>
              ₦{revenueToday >= 1000
                ? `${(revenueToday / 1000).toFixed(1)}k`
                : revenueToday}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color={COLORS.secondary} />
            <Text style={styles.statValue}>{productCount}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Products')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="cube" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('StoreWallet')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.secondaryLight }]}>
              <Ionicons name="wallet" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('StoreAnalytics')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="analytics" size={24} color="#1976D2" />
            </View>
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => store && navigation.navigate('ManageCategories', { storeId: store.id })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="pricetags" size={24} color="#7B1FA2" />
            </View>
            <Text style={styles.actionText}>Categories</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('StoreOrders')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentOrders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Orders will appear here</Text>
          </View>
        ) : (
          recentOrders.map((order: any) => (
            <View key={order.id} style={styles.orderRow}>
              <View style={styles.orderRowLeft}>
                <Text style={styles.orderRowId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderRowStatus}>{order.status.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.orderRowAmount}>
                ₦{Number(order.totalAmount).toLocaleString('en-NG')}
              </Text>
            </View>
          ))
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
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
  },
  storeIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusOpen: {
    backgroundColor: COLORS.primary,
  },
  statusClosed: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  editButton: {
    padding: 8,
  },
  createStoreCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  createStoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  createStoreSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
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
  statusToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
  },
  statusToggleInfo: {
    flex: 1,
  },
  statusToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusToggleDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  orderRowLeft: { gap: 4 },
  orderRowId: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  orderRowStatus: { fontSize: 12, color: COLORS.textSecondary },
  orderRowAmount: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
