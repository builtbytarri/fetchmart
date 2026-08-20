import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { walletApi } from '../../api';
import { WalletSummary, LedgerEntry } from '../../types';
import { COLORS, SPACING } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const EarningsScreen: React.FC<Props> = ({ navigation }) => {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await walletApi.getWallet();
      setWallet(data);
    } catch {
      // leave wallet null; UI shows empty state
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

  const handleWithdraw = () => {
    if (!wallet) return;
    const balance = Number(wallet.balance);

    if (!wallet.bankAccount) {
      Alert.alert('Add a bank account', 'Set up your payout bank account first.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add account', onPress: () => navigation.navigate('BankAccount') },
      ]);
      return;
    }
    if (balance <= 0) {
      Alert.alert('Nothing to withdraw', 'You have no available balance yet.');
      return;
    }

    Alert.alert(
      'Withdraw earnings',
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

  const renderLedger = (item: LedgerEntry) => {
    const isCredit = item.type === 'CREDIT';
    return (
      <View key={item.id} style={styles.earningCard}>
        <View style={styles.earningInfo}>
          <Text style={styles.earningDate}>{item.reason}</Text>
          <Text style={styles.earningDeliveries}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.earningAmount, { color: isCredit ? COLORS.primary : COLORS.error }]}>
          {isCredit ? '+' : '−'}₦{Number(item.amount).toLocaleString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const balance = Number(wallet?.balance ?? 0);
  // Riders are only credited on delivery, so this is normally zero — it is
  // shown for parity with the store wallet and to surface any goodwill credit
  // that has not yet cleared.
  const pendingBalance = Number(wallet?.pendingBalance ?? 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BankAccount')}>
          <Ionicons name="card-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Available Balance</Text>
          <Text style={styles.summaryAmount}>₦{balance.toLocaleString()}</Text>
          {pendingBalance > 0 && (
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.white} />
                <Text style={styles.summaryStatText}>
                  ₦{pendingBalance.toLocaleString()} pending delivery
                </Text>
              </View>
            </View>
          )}
          {wallet?.bankAccount ? (
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Ionicons name="business" size={16} color={COLORS.white} />
                <Text style={styles.summaryStatText}>
                  {wallet.bankAccount.bankName ?? wallet.bankAccount.bankCode} ••••
                  {wallet.bankAccount.accountNumber.slice(-4)}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('BankAccount')}>
              <Text style={styles.linkText}>+ Add payout bank account</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {wallet && wallet.ledger.length > 0 ? (
            wallet.ledger.map(renderLedger)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySubtext}>Complete deliveries to start earning</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.withdrawButton, (balance <= 0 || withdrawing) && styles.withdrawDisabled]}
          onPress={handleWithdraw}
          disabled={withdrawing}
        >
          {withdrawing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="cash-outline" size={20} color={COLORS.white} />
              <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
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
  summaryCard: {
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  summaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  summaryStatText: {
    fontSize: 14,
    color: COLORS.white,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: SPACING.md,
    textDecorationLine: 'underline',
  },
  section: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  earningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  earningInfo: {
    flex: 1,
  },
  earningDate: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  earningDeliveries: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.xl,
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
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  withdrawDisabled: {
    opacity: 0.5,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
