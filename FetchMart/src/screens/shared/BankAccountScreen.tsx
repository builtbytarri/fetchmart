import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components';
import { walletApi } from '../../api';
import { BankInfo, BankAccount } from '../../types';
import { COLORS, SPACING } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const BankAccountScreen: React.FC<Props> = ({ navigation }) => {
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [existing, setExisting] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    // Load the two independently: a wallet failure (e.g. the store hasn't been
    // created yet, so there's no wallet) must NOT block the bank list, and a
    // bank-list failure must show its own accurate message.
    let bankList: BankInfo[] = [];

    const loadBanks = walletApi
      .getBanks()
      .then((list) => {
        bankList = list;
        setBanks(list);
      })
      .catch(() =>
        Alert.alert('Error', 'Could not load bank list. Please try again.'),
      );

    const loadWallet = walletApi
      .getWallet()
      .then((wallet) => {
        if (wallet.bankAccount) {
          setExisting(wallet.bankAccount);
          setAccountNumber(wallet.bankAccount.accountNumber);
        }
      })
      .catch(() => {
        // No wallet yet (store not created) — fine, just nothing to prefill.
      });

    Promise.all([loadBanks, loadWallet])
      .then(() => {
        // Match a previously-saved bank once both have resolved.
        setExisting((prev) => {
          if (prev) {
            const match = bankList.find((b) => b.code === prev.bankCode);
            if (match) setSelectedBank(match);
          }
          return prev;
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks.slice(0, 30);
    const q = search.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 30);
  }, [banks, search]);

  const handleSave = async () => {
    if (!selectedBank) {
      Alert.alert('Select a bank', 'Please choose your bank from the list.');
      return;
    }
    if (accountNumber.trim().length < 10) {
      Alert.alert('Invalid account', 'Enter a valid 10-digit account number.');
      return;
    }

    setSaving(true);
    try {
      const saved = await walletApi.saveBankAccount({
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
      });
      setExisting(saved);
      Alert.alert('Saved', `Account verified: ${saved.accountName}`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Could not verify account',
        err.response?.data?.message ?? 'Please check the details and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout Bank Account</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {existing && (
            <View style={styles.currentCard}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <View style={{ marginLeft: SPACING.sm }}>
                <Text style={styles.currentName}>{existing.accountName}</Text>
                <Text style={styles.currentMeta}>
                  {existing.bankName ?? existing.bankCode} • {existing.accountNumber}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.label}>Account number</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            placeholder="0123456789"
            maxLength={10}
          />

          <Text style={styles.label}>Bank</Text>
          {selectedBank && (
            <View style={styles.selectedBank}>
              <Text style={styles.selectedBankText}>{selectedBank.name}</Text>
              <TouchableOpacity onPress={() => setSelectedBank(null)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {!selectedBank && (
            <>
              <TextInput
                style={styles.input}
                value={search}
                onChangeText={setSearch}
                placeholder="Search your bank…"
              />
              <View style={styles.bankList}>
                {filteredBanks.map((bank) => (
                  <TouchableOpacity
                    key={`${bank.code}-${bank.name}`}
                    style={styles.bankRow}
                    onPress={() => {
                      setSelectedBank(bank);
                      setSearch('');
                    }}
                  >
                    <Text style={styles.bankRowText}>{bank.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Button
            title={saving ? 'Verifying…' : 'Save bank account'}
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: SPACING.lg }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.md },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  currentName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  currentMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedBank: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedBankText: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  changeText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  bankList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  bankRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bankRowText: { fontSize: 14, color: COLORS.text },
});
