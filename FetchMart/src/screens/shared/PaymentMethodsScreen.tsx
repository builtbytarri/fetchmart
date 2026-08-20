import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../../constants/config';
import { paymentsApi, SavedPaymentMethod } from '../../api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const CARD_BRAND_ICONS: Record<string, { icon: keyof typeof Ionicons['glyphMap']; color: string }> = {
  VISA: { icon: 'card', color: '#1A1F71' },
  MASTERCARD: { icon: 'card', color: '#EB001B' },
  VERVE: { icon: 'card', color: '#0B7B3E' },
};

export const PaymentMethodsScreen: React.FC<Props> = ({ navigation }) => {
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      const data = await paymentsApi.getPaymentMethods();
      setPaymentMethods(data);
    } catch {
      // Silently ignore — list stays empty
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  const handleDelete = (item: SavedPaymentMethod) => {
    Alert.alert(
      'Remove Card',
      `Remove ${item.maskedCard}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentsApi.deletePaymentMethod(item.id);
              setPaymentMethods(prev => prev.filter(m => m.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not remove card. Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderCard = ({ item }: { item: SavedPaymentMethod }) => {
    const brand = CARD_BRAND_ICONS[item.cardType] ?? { icon: 'card', color: COLORS.primary };
    return (
      <View style={styles.methodCard}>
        <View style={[styles.methodIcon, { backgroundColor: `${brand.color}15` }]}>
          <Ionicons name={brand.icon} size={22} color={brand.color} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodLabel} numberOfLines={1}>{item.maskedCard}</Text>
          <Text style={styles.methodSub}>
            Expires {item.expiryMonth}/{item.expiryYear}
          </Text>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={paymentMethods}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMethods(); }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={60} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No saved cards</Text>
              <Text style={styles.emptySubtext}>
                Cards are saved automatically after your first successful payment.
                Complete a checkout and your card will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  methodSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.lg,
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
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});
