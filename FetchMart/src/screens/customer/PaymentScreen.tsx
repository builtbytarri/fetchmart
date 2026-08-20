/**
 * PaymentScreen — zero native-module payment flow
 *
 * Problem: Both react-native-webview and expo-web-browser are native modules
 * that require npx expo run:ios to compile into the binary. With newArchEnabled:true
 * they crash immediately in Expo Go.
 *
 * Solution: Pure JS approach that works in Expo Go today:
 *  1. Linking.openURL(checkoutUrl) — opens Safari (built into React Native, no native module)
 *  2. Poll GET /payments/orders/:orderId/verify every 3s — the backend makes an
 *     OUTBOUND verify call to Flutterwave and marks the order PAID if it cleared.
 *  3. When order.status === PAID → success, clear cart, navigate to OrderDetails
 *
 * Active verification (outbound) is used instead of waiting for Flutterwave's
 * inbound webhook, which can't reach a local/dev server and never fires a
 * redirect for async methods like bank transfer. The strict 4-check verification
 * still runs server-side. The webhook path remains as a backup in production.
 *
 * For a native build (npx expo run:ios), this still works correctly.
 * A WebView upgrade can be dropped in later without changing the flow.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ordersApi, paymentsApi } from '../../api';
import { useCartStore } from '../../store';
import { COLORS, SPACING } from '../../constants/config';
import { CustomerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Payment'>;

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS  = 5 * 60_000; // 5 minutes

type Phase =
  | 'idle'                                     // page just mounted
  | 'waiting'                                  // browser opened, polling
  | 'verifying'                                // status flipped to PAID, confirming
  | { result: 'success'; orderId: string }
  | { result: 'failed';  message: string }
  | { result: 'timeout' };

export const PaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, paymentUrl } = route.params;
  const { clearCart } = useCartStore();

  const [phase, setPhase] = useState<Phase>('idle');

  const pollTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const appState     = useRef<AppStateStatus>(AppState.currentState);

  const stopPolling = useCallback(() => {
    if (pollTimer.current)    clearInterval(pollTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    pollTimer.current    = null;
    timeoutTimer.current = null;
  }, []);

  const checkOrderStatus = useCallback(async () => {
    try {
      // Actively ask the backend to verify with Flutterwave (outbound) rather
      // than waiting for the inbound webhook — which never fires in local dev,
      // and isn't triggered by async bank transfers that don't redirect back.
      let status: string;
      try {
        const res = await paymentsApi.verifyOrder(orderId);
        status = res.status;
      } catch {
        // Fall back to a plain status read if the verify call hiccups.
        const order = await ordersApi.getById(orderId);
        status = order.status;
      }

      if (status === 'PAID' || status === 'STORE_ACCEPTED' ||
          status === 'PREPARING' || status === 'READY' ||
          status === 'ASSIGNED'  || status === 'PICKED_UP' ||
          status === 'EN_ROUTE'  || status === 'ARRIVED'   ||
          status === 'COMPLETED') {
        stopPolling();
        setPhase('verifying');
        clearCart();
        // Brief pause so "confirming" state is visible
        setTimeout(() => setPhase({ result: 'success', orderId }), 600);
      }
      // CREATED = still unpaid, keep polling
      // CANCELLED = stop with failure
      if (status === 'CANCELLED') {
        stopPolling();
        setPhase({ result: 'failed', message: 'Your order was cancelled.' });
      }
    } catch {
      // Network hiccup — keep polling silently
    }
  }, [orderId, clearCart, stopPolling]);

  const startPolling = useCallback(() => {
    pollTimer.current = setInterval(checkOrderStatus, POLL_INTERVAL_MS);
    timeoutTimer.current = setTimeout(() => {
      stopPolling();
      setPhase({ result: 'timeout' });
    }, POLL_TIMEOUT_MS);
  }, [checkOrderStatus, stopPolling]);

  const openCheckout = useCallback(async () => {
    try {
      await Linking.openURL(paymentUrl);
      setPhase('waiting');
      startPolling();
    } catch {
      setPhase({ result: 'failed', message: 'Could not open the payment page.' });
    }
  }, [paymentUrl, startPolling]);

  // Auto-open on mount
  useEffect(() => {
    openCheckout();
    return () => stopPolling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resume polling when app comes back to foreground (user returns from Safari)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        // User just switched back to the app — poll immediately
        if (phase === 'waiting') checkOrderStatus();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [phase, checkOrderStatus]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const goToOrder = (id: string) => navigation.replace('OrderDetails', { orderId: id });
  const goHome    = () => navigation.navigate('CustomerTabs', { screen: 'Home' } as any);

  // ── Success ──────────────────────────────────────────────────────────────
  if (typeof phase === 'object' && phase.result === 'success') {
    return (
      <View style={styles.screen}>
        <Ionicons name="checkmark-circle" size={84} color={COLORS.primary} />
        <Text style={styles.title}>Payment confirmed!</Text>
        <Text style={styles.subtitle}>Your order has been placed and the store has been notified.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => goToOrder(phase.orderId)}>
          <Text style={styles.primaryBtnText}>View order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={goHome}>
          <Text style={styles.secondaryBtnText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  if (typeof phase === 'object' && phase.result === 'failed') {
    return (
      <View style={styles.screen}>
        <Ionicons name="close-circle" size={84} color={COLORS.error} />
        <Text style={styles.title}>Payment failed</Text>
        <Text style={styles.subtitle}>{phase.message}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={openCheckout}>
          <Text style={styles.primaryBtnText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Back to cart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Timeout ───────────────────────────────────────────────────────────────
  if (typeof phase === 'object' && phase.result === 'timeout') {
    return (
      <View style={styles.screen}>
        <Ionicons name="time-outline" size={84} color={COLORS.textSecondary} />
        <Text style={styles.title}>Payment not confirmed yet</Text>
        <Text style={styles.subtitle}>
          If you completed payment, it may take a moment to reflect.
          Check your orders page or contact support.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
          setPhase('waiting');
          startPolling();
        }}>
          <Text style={styles.primaryBtnText}>Keep checking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={goHome}>
          <Text style={styles.secondaryBtnText}>Go to home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Waiting / verifying / idle ────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 8 }} />

      <Text style={styles.title}>
        {phase === 'verifying'
          ? 'Confirming payment…'
          : phase === 'waiting'
            ? 'Waiting for payment'
            : 'Opening checkout…'}
      </Text>

      <Text style={styles.subtitle}>
        {phase === 'verifying'
          ? 'Almost done, please wait…'
          : phase === 'waiting'
            ? 'Complete payment in the browser, then come back here. This screen updates automatically.'
            : 'A browser window will open shortly.'}
      </Text>

      {phase === 'waiting' && (
        <>
          {/* Re-open Safari if the user accidentally closed it */}
          <TouchableOpacity style={styles.outlineBtn} onPress={() => Linking.openURL(paymentUrl)}>
            <Ionicons name="open-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.outlineBtnText}>Re-open payment page</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => {
            stopPolling();
            navigation.goBack();
          }}>
            <Text style={styles.secondaryBtnText}>Cancel — back to cart</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    gap: 14,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: {
    fontSize: 15, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 8,
  },
  primaryBtn: {
    width: '100%', backgroundColor: COLORS.primary,
    paddingVertical: 16, borderRadius: 30, alignItems: 'center',
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 30,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  outlineBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  secondaryBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 30,
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  secondaryBtnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
