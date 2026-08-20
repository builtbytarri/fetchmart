import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/config';
import { Order, OrderStatus } from '../types';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'CREATED':
      return COLORS.textSecondary;
    case 'PAID':
    case 'STORE_ACCEPTED':
    case 'PREPARING':
      return COLORS.warning;
    case 'READY':
    case 'ASSIGNED':
    case 'PICKED_UP':
    case 'EN_ROUTE':
    case 'ARRIVED':
      return COLORS.secondary;
    case 'COMPLETED':
      return COLORS.success;
    case 'CANCELLED':
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
};

const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    CREATED: 'Awaiting Payment',
    PAID: 'Paid',
    STORE_ACCEPTED: 'Accepted',
    PREPARING: 'Preparing',
    READY: 'Ready for Pickup',
    ASSIGNED: 'Rider Assigned',
    PICKED_UP: 'Picked Up',
    EN_ROUTE: 'On the Way',
    ARRIVED: 'Arrived',
    COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const formatPrice = (price: number | string) =>
    `₦${Number(price).toLocaleString('en-NG')}`;
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      {order.store && (
        <View style={styles.storeInfo}>
          <Ionicons name="storefront-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.storeName}>{order.store.name}</Text>
        </View>
      )}

      <View style={styles.itemsContainer}>
        <Text style={styles.itemsLabel}>
          {(order.orderItems ?? []).length} item{(order.orderItems ?? []).length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.total}>{formatPrice(order.totalAmount)}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.viewDetails}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  storeName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  itemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  viewDetails: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
