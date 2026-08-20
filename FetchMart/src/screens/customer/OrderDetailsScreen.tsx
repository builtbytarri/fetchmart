/**
 * OrderDetailsScreen — live order tracking with Mapbox
 *
 * Map behaviour by order status:
 *  CREATED / PAID / STORE_ACCEPTED / PREPARING / READY
 *    → Store pin only (rider not yet assigned)
 *
 *  ASSIGNED
 *    → Store pin + rider pin (rider heading to store)
 *    → Route line: rider → store   (Mapbox Directions)
 *
 *  PICKED_UP / EN_ROUTE / ARRIVED
 *    → Rider pin + customer delivery pin
 *    → Route line: rider → customer (Mapbox Directions)
 *
 *  COMPLETED / CANCELLED
 *    → Static map, no live tracking
 *
 * Live updates:
 *  1. Subscribe to WS room `order:<id>` via `subscribe:order`
 *  2. Listen for `rider_location_update` → update marker + reroute
 *  3. Listen for `order_status_changed` → refresh order data
 */

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ordersApi } from '../../api';
import { Order, OrderStatus } from '../../types';
import { socketClient } from '../../api/socketClient';
import { COLORS, SPACING, MAPBOX_ACCESS_TOKEN } from '../../constants/config';
import { formatQty, roundQty } from '../../utils/quantity';
import { CustomerStackParamList } from '../../navigation/types';
import { fetchJson } from '../../utils/http';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 280;

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderDetails'>;

// ── Status display config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap; description: string }
> = {
  CREATED:        { label: 'Order placed',      color: '#6B7280', icon: 'receipt-outline',                description: 'Waiting for payment' },
  PAID:           { label: 'Payment confirmed', color: '#2563EB', icon: 'card-outline',                   description: 'Waiting for store to accept' },
  STORE_ACCEPTED: { label: 'Accepted',          color: '#7C3AED', icon: 'checkmark-circle-outline',       description: 'Store has accepted your order' },
  PREPARING:      { label: 'Preparing',         color: '#D97706', icon: 'flame-outline',                  description: 'Store is preparing your items' },
  READY:          { label: 'Ready',             color: '#059669', icon: 'bag-check-outline',              description: 'Order is ready, finding a rider' },
  ASSIGNED:       { label: 'Rider assigned',    color: '#0284C7', icon: 'bicycle-outline',               description: 'Rider is heading to the store' },
  PICKED_UP:      { label: 'Picked up',         color: '#0284C7', icon: 'car-outline',                   description: 'Rider picked up your order' },
  EN_ROUTE:       { label: 'On the way',        color: '#0284C7', icon: 'navigate-outline',              description: 'Rider is heading to you' },
  ARRIVED:        { label: 'Arrived',           color: '#059669', icon: 'location-outline',              description: 'Rider has arrived at your location' },
  COMPLETED:      { label: 'Delivered',         color: COLORS.primary, icon: 'checkmark-done-circle-outline', description: 'Your order was delivered' },
  CANCELLED:      { label: 'Cancelled',         color: COLORS.error,   icon: 'close-circle-outline',       description: 'This order was cancelled' },
};

// Statuses where the rider is en-route to the customer
const DELIVERY_STATUSES: OrderStatus[] = ['PICKED_UP', 'EN_ROUTE', 'ARRIVED'];
// Statuses where the rider is heading to the store
const PICKUP_STATUSES: OrderStatus[] = ['ASSIGNED'];
// Statuses where live tracking is active
const LIVE_STATUSES: OrderStatus[] = [...PICKUP_STATUSES, ...DELIVERY_STATUSES];
// Statuses where order is fully done
const TERMINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED'];

// ── Mapbox Directions helper ─────────────────────────────────────────────────
async function fetchRoute(
  from: [number, number],   // [lng, lat]
  to:   [number, number],   // [lng, lat]
  token: string,
): Promise<GeoJSON.Feature<GeoJSON.LineString> | null> {
  try {
    const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
      `?access_token=${token}&geometries=geojson&overview=full&steps=false`;

    const json = await fetchJson<{
      routes?: Array<{ geometry: GeoJSON.LineString }>;
    }>(url);

    if (!json.routes?.length) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: json.routes[0].geometry,
    };
  } catch {
    return null;
  }
}

// ── Main screen ──────────────────────────────────────────────────────────────
export const OrderDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;

  const [order, setOrder]           = useState<Order | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [riderCoords, setRiderCoords] = useState<[number, number] | null>(null); // [lng, lat]
  const [routeFeature, setRouteFeature] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);

  const cameraRef   = useRef<MapboxGL.Camera>(null);
  const isLive      = useRef(false);

  // ── Load order ─────────────────────────────────────────────────────────────
  const loadOrder = useCallback(async () => {
    try {
      const data = await ordersApi.getById(orderId);
      setOrder(data);

      // Seed rider coords from initial DB value (if already has location)
      if (data.rider?.latitude != null && data.rider?.longitude != null) {
        setRiderCoords([data.rider.longitude, data.rider.latitude]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // ── Compute route whenever rider position or order status changes ───────────
  useEffect(() => {
    if (!order || !riderCoords) { setRouteFeature(null); return; }

    const status = order.status;

    let destination: [number, number] | null = null;

    if (PICKUP_STATUSES.includes(status)) {
      // Rider → Store
      if (order.store?.longitude != null && order.store?.latitude != null) {
        destination = [order.store.longitude, order.store.latitude];
      }
    } else if (DELIVERY_STATUSES.includes(status)) {
      // Rider → Customer delivery location
      const dl = order.deliveryLocation;
      if (dl?.longitude != null && dl?.latitude != null) {
        destination = [dl.longitude, dl.latitude];
      }
    }

    if (!destination) { setRouteFeature(null); return; }

    fetchRoute(riderCoords, destination, MAPBOX_ACCESS_TOKEN).then(feat => {
      setRouteFeature(feat);
    });
  }, [riderCoords, order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── WebSocket live tracking ─────────────────────────────────────────────────
  useEffect(() => {
    // Subscribe to the order room so the server sends us rider location updates
    socketClient.emit('subscribe:order', { orderId });
    isLive.current = true;

    const onLocation = (data: unknown) => {
      const d = data as { riderId: string; latitude: number; longitude: number };
      setRiderCoords([d.longitude, d.latitude]);
      // Fly camera to follow the rider
      cameraRef.current?.flyTo([d.longitude, d.latitude], 800);
    };

    const onStatusChange = (data: unknown) => {
      const d = data as { orderId: string; newStatus: string };
      if (d.orderId === orderId) {
        loadOrder();
      }
    };

    socketClient.on('rider_location_update', onLocation);
    socketClient.on('order_status_changed', onStatusChange);

    return () => {
      socketClient.off('rider_location_update', onLocation);
      socketClient.off('order_status_changed', onStatusChange);
      isLive.current = false;
    };
  }, [orderId, loadOrder]);

  // ── Camera bounds helper ────────────────────────────────────────────────────
  const getMapCenter = (): [number, number] => {
    if (riderCoords) return riderCoords;
    if (order?.store?.longitude && order?.store?.latitude)
      return [order.store.longitude, order.store.latitude];
    return [3.3792, 6.5244]; // Lagos default
  };

  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={52} color={COLORS.error} />
        <Text style={styles.errorText}>{error ?? 'Order not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadOrder}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const cfg    = STATUS_CONFIG[order.status];
  const isLiveTracking = LIVE_STATUSES.includes(order.status);
  const isDone = TERMINAL_STATUSES.includes(order.status);
  const showMap = !isDone || order.status === 'COMPLETED'; // hide map only on cancel

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order tracking</Text>
        <View style={{ width: 36 }} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Live map ──────────────────────────────────────────────────────── */}
        {showMap && (
          <View style={styles.mapContainer}>
            <MapboxGL.MapView
              style={styles.map}
              styleURL={MapboxGL.StyleURL.Street}
              scrollEnabled
              zoomEnabled
              pitchEnabled={false}
            >
              <MapboxGL.Camera
                ref={cameraRef}
                centerCoordinate={getMapCenter()}
                zoomLevel={14}
                animationMode="flyTo"
                animationDuration={600}
              />

              {/* Route line */}
              {routeFeature && (
                <MapboxGL.ShapeSource id="routeSource" shape={routeFeature}>
                  <MapboxGL.LineLayer
                    id="routeLine"
                    style={{
                      lineColor: COLORS.primary,
                      lineWidth: 4,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </MapboxGL.ShapeSource>
              )}

              {/* Store marker — storefront icon */}
              {order.store?.latitude != null && order.store?.longitude != null && (
                <MapboxGL.MarkerView
                  id="storePin"
                  coordinate={[order.store.longitude, order.store.latitude]}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.marker, styles.markerStore]}>
                    <Ionicons name="storefront" size={16} color={COLORS.white} />
                  </View>
                </MapboxGL.MarkerView>
              )}

              {/* Rider marker (live) — bike icon */}
              {riderCoords && (
                <MapboxGL.MarkerView
                  id="riderPin"
                  coordinate={riderCoords}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.marker, styles.markerRider, isLiveTracking && styles.markerLive]}>
                    <Ionicons name="bicycle" size={18} color={COLORS.white} />
                  </View>
                </MapboxGL.MarkerView>
              )}

              {/* Customer delivery marker — person icon */}
              {order.deliveryLocation?.latitude != null &&
               order.deliveryLocation?.longitude != null &&
               DELIVERY_STATUSES.includes(order.status) && (
                <MapboxGL.MarkerView
                  id="customerPin"
                  coordinate={[order.deliveryLocation.longitude!, order.deliveryLocation.latitude!]}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={[styles.marker, styles.markerCustomer]}>
                    <Ionicons name="person" size={16} color={COLORS.white} />
                  </View>
                </MapboxGL.MarkerView>
              )}
            </MapboxGL.MapView>

            {/* Live indicator badge */}
            {isLiveTracking && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Status card ───────────────────────────────────────────────────── */}
        <View style={[styles.statusCard, { borderColor: cfg.color + '33' }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: cfg.color + '18' }]}>
            <Ionicons name={cfg.icon} size={28} color={cfg.color} />
          </View>
          <View style={styles.statusText}>
            <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={styles.statusDesc}>{cfg.description}</Text>
          </View>
        </View>

        {/* ── Rider info (when assigned) ────────────────────────────────────── */}
        {order.rider && isLiveTracking && (
          <View style={styles.riderCard}>
            <View style={styles.riderAvatar}>
              <Ionicons name="person" size={22} color={COLORS.white} />
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{order.rider.name}</Text>
              <Text style={styles.riderSub}>Your rider</Text>
            </View>
            {order.rider.phone && (
              <TouchableOpacity style={styles.callBtn}>
                <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Order info ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order</Text>
          <Text style={styles.orderIdText}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          {order.store && (
            <View style={styles.row}>
              <Ionicons name="storefront-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.rowText}>{order.store.name}</Text>
            </View>
          )}
        </View>

        {/* ── Items ────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.orderItems?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemQty}>× {formatQty(Number(item.quantity), item.unit)}</Text>
              </View>
              <Text style={styles.itemPrice}>
                ₦{roundQty(Number(item.unitPrice) * Number(item.quantity)).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Total ────────────────────────────────────────────────────────── */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₦{Number(order.totalAmount).toLocaleString()}</Text>
        </View>

        <Text style={styles.timestamp}>
          Placed {new Date(order.createdAt).toLocaleString('en-NG', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: SPACING.lg },
  errorText: { fontSize: 16, color: COLORS.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primaryLight, borderRadius: 20 },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingBottom: 10,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },

  // Map
  mapContainer: { width: SCREEN_WIDTH, height: MAP_HEIGHT, position: 'relative' },
  map: { flex: 1 },

  // Map pins
  // Pure View pins — no child icons (PointAnnotation max 1 subview rule)
  marker: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: COLORS.white,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  markerStore:    { backgroundColor: COLORS.primary },
  markerRider:    { backgroundColor: '#0284C7' },
  markerLive:     { backgroundColor: '#E8572C' },
  markerCustomer: { backgroundColor: '#7C3AED' },

  // Live badge
  liveBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D058' },
  liveText: { color: '#FFF', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  // Status card
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1,
    margin: SPACING.md, padding: SPACING.md,
  },
  statusIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  statusText: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  statusDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  // Rider card
  riderCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, borderRadius: 14,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  riderAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0284C7',
    justifyContent: 'center', alignItems: 'center',
  },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  riderSub:  { fontSize: 12, color: COLORS.textSecondary },
  callBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },

  // Order info / items
  section: {
    backgroundColor: COLORS.white, borderRadius: 14,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    padding: SPACING.md, gap: 6,
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderIdText:  { fontSize: 15, fontWeight: '700', color: COLORS.text, fontVariant: ['tabular-nums'] },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText:      { fontSize: 14, color: COLORS.text },
  itemRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3 },
  itemLeft:     { flex: 1 },
  itemName:     { fontSize: 14, fontWeight: '500', color: COLORS.text },
  itemQty:      { fontSize: 12, color: COLORS.textSecondary },
  itemPrice:    { fontSize: 14, fontWeight: '600', color: COLORS.text },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14,
    marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  totalLabel:  { fontSize: 15, color: COLORS.textSecondary },
  totalAmount: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  timestamp:   { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 4 },
});
