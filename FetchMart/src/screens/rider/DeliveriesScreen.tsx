import React, { useState, useEffect, useCallback } from 'react';
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const DeliveriesScreen: React.FC<Props> = ({ navigation }) => {
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const fetchDeliveries = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [active, completed] = await Promise.all([
        deliveryApi.getMyDeliveries(),
        deliveryApi.getCompletedDeliveries(),
      ]);
      console.log('Active deliveries fetched:', active.length, active);
      console.log('Completed deliveries fetched:', completed.length);
      setActiveDeliveries(active);
      setCompletedDeliveries(completed);
    } catch (err: any) {
      console.error('Failed to fetch deliveries:', err?.response?.data || err?.message || err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
    }, [])
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'READY': return 'Available';
      case 'ASSIGNED': return 'Pickup Required';
      case 'PICKED_UP': return 'In Transit';
      case 'EN_ROUTE': return 'On the Way';
      case 'ARRIVED': return 'Arrived';
      case 'COMPLETED': return 'Delivered';
      default: return status;
    }
  };

  const renderDelivery = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.deliveryCard}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'COMPLETED' ? styles.statusCompleted : styles.statusActive
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'COMPLETED' ? styles.statusTextCompleted : styles.statusTextActive
          ]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <View style={styles.addressContainer}>
        <View style={styles.addressRow}>
          <View style={[styles.addressDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.addressText} numberOfLines={1}>
            {(item as any).store?.name || 'Store'}
          </Text>
        </View>
        <View style={styles.addressLine} />
        <View style={styles.addressRow}>
          <View style={[styles.addressDot, { backgroundColor: COLORS.error }]} />
          <Text style={styles.addressText} numberOfLines={1}>
            {(item as any).customer?.address || (item as any).customer?.name || 'Customer'}
          </Text>
        </View>
      </View>
      <View style={styles.deliveryFooter}>
        <Text style={styles.amountText}>₦{Number(item.totalAmount).toLocaleString()}</Text>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: item.id })}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const currentDeliveries = activeTab === 'active' ? activeDeliveries : completedDeliveries;

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
        <Text style={styles.headerTitle}>My Deliveries</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active {activeDeliveries.length > 0 && `(${activeDeliveries.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Deliveries List */}
      <FlatList
        data={currentDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderDelivery}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchDeliveries(true)}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No {activeTab} deliveries</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'active' 
                ? 'Accept orders to start delivering' 
                : 'Completed deliveries will appear here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.md,
  },
  deliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  deliveryId: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  deliveryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addressContainer: {
    marginBottom: SPACING.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  addressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 4,
    marginVertical: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  distanceText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#FFF3E0',
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#F57C00',
  },
  statusTextCompleted: {
    color: COLORS.primary,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
});
