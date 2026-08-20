import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { walletApi } from '../../api';
import { WalletSummary } from '../../types';
import { COLORS, SPACING } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const StoreWalletScreen: React.FC<Props> = ({ navigation }) => {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await walletApi.getWallet();
      setWallet(data);
    } catch {
      // leave null; UI shows empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const balance = Number(wallet?.balance ?? 0);
  // Credited at payment but held until the order is delivered — shown so the
  // store can see money is on the way without being able to withdraw it yet.
  const pendingBalance = Number(wallet?.pendingBalance ?? 0);

  const handleWithdraw = () => {
    if (!wallet) return;
    if (!wallet.bankAccount) {
      Alert.alert('Add a bank account', 'Set up your payout bank account first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add account', onPress: () => navigation.navigate('BankAccount') },
      ]);
      return;
    }
    if (balance <= 0) {
      Alert.alert('Insufficient Balance', 'You need earnings before you can withdraw.');
      return;
    }
    Alert.alert(
      'Withdraw',
      `Withdraw ₦${balance.toLocaleString()} to ${wallet.bankAccount.accountName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            setWithdrawing(true);
            try {
              await walletApi.withdraw(balance);
              Alert.alert('Withdrawal requested', 'Your payout is on its way.');
              await load();
            } catch (err: any) {
              Alert.alert('Withdrawal failed', err.response?.data?.message ?? 'Please try again.');
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={28} color={COLORS.white} />
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
          {pendingBalance > 0 && (
            <View style={styles.pendingRow}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.pendingText}>
                ₦{pendingBalance.toLocaleString()} pending delivery
              </Text>
            </View>
          )}
          {wallet?.bankAccount && (
            <View style={styles.pendingRow}>
              <Ionicons name="business" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.pendingText}>
                {wallet.bankAccount.bankName ?? wallet.bankAccount.bankCode} ••••
                {wallet.bankAccount.accountNumber.slice(-4)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleWithdraw} disabled={withdrawing}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.secondaryLight }]}>
              {withdrawing ? (
                <ActivityIndicator color={COLORS.secondary} />
              ) : (
                <Ionicons name="arrow-up" size={24} color={COLORS.secondary} />
              )}
            </View>
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BankAccount')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="card" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionButtonText}>Bank Account</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {wallet && wallet.ledger.length > 0 ? (
          <View style={{ marginHorizontal: SPACING.md }}>
            {wallet.ledger.map((entry) => {
              const isCredit = entry.type === 'CREDIT';
              return (
                <View key={entry.id} style={styles.ledgerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerReason}>{entry.reason}</Text>
                    <Text style={styles.ledgerDate}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.ledgerAmount, { color: isCredit ? COLORS.primary : COLORS.error }]}
                  >
                    {isCredit ? '+' : '−'}₦{Number(entry.amount).toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your earnings will appear here</Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  ledgerReason: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  ledgerDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 16,
    fontWeight: '700',
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
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  pendingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  actionButtonText: {
    fontSize: 14,
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
  emptyContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
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
});
