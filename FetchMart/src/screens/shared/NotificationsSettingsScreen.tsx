import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../../constants/config';
import { usersApi, NotificationPreferences } from '../../api/users';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const NotificationsSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.getNotificationPreferences()
      .then(setPrefs)
      .catch(() => Alert.alert('Error', 'Could not load notification settings'))
      .finally(() => setLoading(false));
  }, []);

  const updatePref = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    if (!prefs) return;
    const prev = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const saved = await usersApi.updateNotificationPreferences({ [key]: value });
      setPrefs(saved);
    } catch {
      setPrefs(prev);
      Alert.alert('Error', 'Could not save preference');
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  const NotificationItem = ({
    title,
    description,
    prefKey,
  }: {
    title: string;
    description: string;
    prefKey: keyof NotificationPreferences;
  }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationDescription}>{description}</Text>
      </View>
      <Switch
        value={prefs?.[prefKey] ?? true}
        onValueChange={(v) => updatePref(prefKey, v)}
        disabled={loading || saving}
        trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
        thumbColor={prefs?.[prefKey] ? COLORS.primary : '#BDBDBD'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                title="Enable Push Notifications"
                description="Receive notifications on your device"
                prefKey="notifyPush"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                title="Order Updates"
                description="Get notified about your order status"
                prefKey="notifyOrderUpdates"
              />
              <View style={styles.divider} />
              <NotificationItem
                title="Promotions & Offers"
                description="Receive special deals and discounts"
                prefKey="notifyPromotions"
              />
              <View style={styles.divider} />
              <NotificationItem
                title="New Stores"
                description="Be notified when new stores open nearby"
                prefKey="notifyNewStores"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Notifications</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                title="Email Updates"
                description="Receive order confirmations and updates via email"
                prefKey="notifyEmail"
              />
            </View>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
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
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  notificationInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  notificationDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: SPACING.md,
  },
});
