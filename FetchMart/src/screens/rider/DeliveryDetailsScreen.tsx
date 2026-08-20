/**
 * DeliveryDetailsScreen
 *
 * Key fixes from audit:
 *  1. Real GPS via expo-location (was hardcoded Lagos coords)
 *  2. Periodic location ping to backend every 5s during active delivery
 *     (persists to DB + broadcasts via WebSocket to customer tracking map)
 *  3. Authorization enforced server-side — only the assigned rider acts
 *  4. Typed Order — no `(order as any)` casts
 *  5. Accepts both `orderId` and `deliveryId` route params for compatibility
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Animated,
  PanResponder,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN, COLORS, SPACING } from '../../constants/config';
import { deliveryApi, ridersApi } from '../../api';
import { Order, OrderStatus } from '../../types';
import { getDirections } from '../../utils/directions';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

const { height } = Dimensions.get('window');
const SHEET_MIN = height * 0.30;   // shows objective card in full at rest
const SHEET_MID = height * 0.55;   // shows dest card + partial items
const SHEET_MAX = height * 0.72;   // shows everything

// How often the rider's GPS position is sent to the backend while active (ms)
const LOCATION_PING_INTERVAL_MS = 5_000;

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, any>;
};

type DeliveryPhase = 'PICKUP' | 'DELIVERY';

interface LatLng { latitude: number; longitude: number; }

// Statuses where the rider should actively ping their location
const PING_STATUSES: OrderStatus[] = ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'ARRIVED'];

// Progress bar fill % for each order status — maps the full journey
// READY/ASSIGNED = approaching store, PICKED_UP = halfway, COMPLETED = done
const ORDER_PROGRESS_PCT: Partial<Record<OrderStatus, number>> = {
  READY:     0,
  ASSIGNED:  15,
  PICKED_UP: 50,
  EN_ROUTE:  75,
  ARRIVED:   90,
  COMPLETED: 100,
};

// Customer node turns green once the rider is actively heading to them
const CUSTOMER_NODE_ACTIVE: OrderStatus[] = ['EN_ROUTE', 'ARRIVED', 'COMPLETED'];

export const DeliveryDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const orderId = route.params?.orderId ?? route.params?.deliveryId;
  const cameraRef = useRef<Mapbox.Camera>(null);

  const [order, setOrder]           = useState<Order | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [phase, setPhase]           = useState<DeliveryPhase>('PICKUP');
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeInfo, setRouteInfo]   = useState<{ distance: string; duration: string } | null>(null);
  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);

  const pingTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  // Sheet starts at SHEET_MIN so the map + zoom controls are fully visible at rest.
  // Rider drags up to SHEET_MID / SHEET_MAX to see full order details.
  const sheetHeight    = useRef(new Animated.Value(SHEET_MIN)).current;
  // Track current zoom so +/- buttons increment from wherever the user is,
  // not from a hardcoded level. Updated by onCameraChanged on the MapView.
  const currentZoom    = useRef(14);
  const lastSheet      = useRef(SHEET_MIN);
  // Fires fitRoute only once — on the first time both endpoints are known.
  // After that the rider can zoom/pan freely without the camera jumping.
  const fittedPhase    = useRef<string | null>(null);

  // ── Sheet pan responder ───────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // Only capture single-finger drags — multi-touch (pinch/zoom) passes
      // through to the Mapbox MapView underneath.
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 1,
      onMoveShouldSetPanResponder:  (evt) => evt.nativeEvent.touches.length === 1,
      onPanResponderMove: (_, g) => {
        const h = lastSheet.current - g.dy;
        if (h >= SHEET_MIN && h <= SHEET_MAX) sheetHeight.setValue(h);
      },
      onPanResponderRelease: (_, g) => {
        const h = lastSheet.current - g.dy;
        let target = SHEET_MID;
        if (h < SHEET_MIN + 50)    target = SHEET_MIN;
        else if (h > SHEET_MAX - 50) target = SHEET_MAX;
        Animated.spring(sheetHeight, { toValue: target, useNativeDriver: false, bounciness: 4 }).start();
        lastSheet.current = target;
      },
    })
  ).current;

  // ── GPS: request permission + watch position ──────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Please enable location access to use delivery mode.');
        return;
      }

      // Start watching position — updates riderLocation state as the rider moves
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 3000 },
        loc => {
          setRiderLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        },
      );
    })();

    return () => { sub?.remove(); };
  }, []);

  // ── Periodic location ping to backend ────────────────────────────────────
  // Fires every 5 seconds while order is in an active delivery status.
  // This updates Redis + Postgres and broadcasts via WebSocket to the customer.
  useEffect(() => {
    if (pingTimer.current) clearInterval(pingTimer.current);

    if (!order || !riderLocation || !PING_STATUSES.includes(order.status)) return;

    const ping = async () => {
      try {
        const loc = riderLocation;  // capture current ref value
        await ridersApi.updateLocation({ latitude: loc.latitude, longitude: loc.longitude });
      } catch {
        // Non-critical — silently skip failed pings
      }
    };

    ping(); // immediate first ping
    pingTimer.current = setInterval(ping, LOCATION_PING_INTERVAL_MS);

    return () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
    };
  }, [order?.status, riderLocation?.latitude, riderLocation?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load order ─────────────────────────────────────────────────────────────
  const loadOrder = useCallback(async () => {
    try {
      const data = await deliveryApi.getDeliveryDetails(orderId);
      setOrder(data);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to load delivery');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // ── Determine delivery phase from order status ────────────────────────────
  useEffect(() => {
    if (!order) return;
    if (['READY', 'ASSIGNED'].includes(order.status)) setPhase('PICKUP');
    else if (['PICKED_UP', 'EN_ROUTE', 'ARRIVED'].includes(order.status)) setPhase('DELIVERY');
  }, [order?.status]);

  // ── Fetch route whenever rider moves or phase changes ─────────────────────
  useEffect(() => {
    if (!order || !riderLocation) { setRouteCoords([]); return; }

    const storeCoords  = order.store?.latitude  != null ? { latitude: order.store.latitude!,  longitude: order.store.longitude!  } : null;
    const custCoords   = order.deliveryLocation?.latitude != null ? { latitude: order.deliveryLocation.latitude!, longitude: order.deliveryLocation.longitude! } : null;
    const destination  = phase === 'PICKUP' ? storeCoords : custCoords;

    if (!destination) { setRouteCoords([]); return; }

    getDirections(riderLocation, destination).then(result => {
      const coords = result ? result.coordinates : [riderLocation, destination];
      if (result) setRouteInfo({ distance: result.distance, duration: result.duration });
      else        setRouteInfo(null);

      setRouteCoords(coords);

      // Auto-fit the camera once per phase so both endpoints are visible when the
      // screen opens AND again when the destination switches (PICKUP → DELIVERY).
      // Within a phase the rider can zoom/pan freely without the camera jumping.
      if (fittedPhase.current !== phase && coords.length >= 2) {
        fittedPhase.current = phase;
        // Small delay lets the MapView finish rendering before fitBounds fires.
        setTimeout(() => fitRoute(coords), 500);
      }
    });
  }, [riderLocation, phase, order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status update ──────────────────────────────────────────────────────────
  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updated = await deliveryApi.updateStatus(order.id, { status: newStatus });
      setOrder(updated);
      if (newStatus === 'COMPLETED') {
        if (pingTimer.current) clearInterval(pingTimer.current);
        Alert.alert('Delivery complete!', 'Great job. The customer has been notified.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Map helpers ────────────────────────────────────────────────────────────
  const fitRoute = (coords: LatLng[]) => {
    if (coords.length < 2) return;
    const lngs = coords.map(c => c.longitude);
    const lats  = coords.map(c => c.latitude);
    // Padding: [top, right, bottom, left]
    // Bottom is large enough to clear the SHEET_MIN peek card so the
    // lower endpoint never sits behind the sheet on initial auto-fit.
    cameraRef.current?.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      [120, 60, SHEET_MIN + 60, 60], 900,
    );
  };

  const openMapsNav = (dest: LatLng & { name?: string }) => {
    const ll    = `${dest.latitude},${dest.longitude}`;
    const label = dest.name ?? 'Destination';
    const url   = Platform.select({
      ios:     `maps:0,0?q=${label}@${ll}`,
      android: `geo:0,0?q=${ll}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    READY: 'ASSIGNED', ASSIGNED: 'PICKED_UP', PICKED_UP: 'EN_ROUTE',
    EN_ROUTE: 'ARRIVED', ARRIVED: 'COMPLETED',
  };
  const ACTION_TEXT: Partial<Record<OrderStatus, string>> = {
    READY: 'Accept order', ASSIGNED: 'Confirm pickup', PICKED_UP: 'Start delivery',
    EN_ROUTE: 'I have arrived', ARRIVED: 'Complete delivery',
  };
  const OBJECTIVE: Partial<Record<OrderStatus, string>> = {
    READY: 'Accept and head to store', ASSIGNED: 'Go pick up from store',
    PICKED_UP: 'Head to customer', EN_ROUTE: 'Delivering to customer',
    ARRIVED: 'Hand over to customer', COMPLETED: 'Delivered',
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const storeCoords   = (order?.store?.latitude != null && order?.store?.longitude != null)
    ? { latitude: order.store.latitude!, longitude: order.store.longitude!, name: order.store.name }
    : null;
  const custCoords    = (order?.deliveryLocation?.latitude != null && order?.deliveryLocation?.longitude != null)
    ? { latitude: order.deliveryLocation.latitude!, longitude: order.deliveryLocation.longitude! }
    : null;
  const destination   = phase === 'PICKUP' ? storeCoords : custCoords;

  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null = routeCoords.length > 1
    ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoords.map(c => [c.longitude, c.latitude]) } }
    : null;

  const mapCenter: [number, number] = riderLocation
    ? [riderLocation.longitude, riderLocation.latitude]
    : storeCoords ? [storeCoords.longitude, storeCoords.latitude]
    : [3.3792, 6.5244];

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.centered}><Text>Delivery not found</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        onCameraChanged={(state) => {
          currentZoom.current = state.properties.zoom;
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: mapCenter, zoomLevel: 14 }}
          animationMode="flyTo"
          animationDuration={400}
        />

        {/* Native user location dot — auto-follows device GPS */}
        <Mapbox.UserLocation visible renderMode={Mapbox.UserLocationRenderMode.Native} />

        {/* Store marker — storefront icon (highlighted while heading to pick up) */}
        {storeCoords && (
          <Mapbox.MarkerView id="store" coordinate={[storeCoords.longitude, storeCoords.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.marker, phase === 'PICKUP' ? styles.markerStore : styles.markerDim]}>
              <Ionicons name="storefront" size={16} color={COLORS.white} />
            </View>
          </Mapbox.MarkerView>
        )}

        {/* Customer marker — person icon (highlighted while delivering) */}
        {custCoords && (
          <Mapbox.MarkerView id="customer" coordinate={[custCoords.longitude, custCoords.latitude]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.marker, phase === 'DELIVERY' ? styles.markerCustomer : styles.markerDim]}>
              <Ionicons name="person" size={16} color={COLORS.white} />
            </View>
          </Mapbox.MarkerView>
        )}

        {/* Route polyline */}
        {routeGeoJSON && (
          <Mapbox.ShapeSource id="route" shape={routeGeoJSON}>
            <Mapbox.LineLayer id="routeLine" style={{ lineColor: COLORS.primary, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }} />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>

      {/* Back button */}
      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Map controls — zoom steps from current level, clamped 1–20 */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => {
            const next = Math.min(20, currentZoom.current + 1);
            currentZoom.current = next;
            cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 250 });
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => {
            const next = Math.max(1, currentZoom.current - 1);
            currentZoom.current = next;
            cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 250 });
          }}
        >
          <Ionicons name="remove" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => routeCoords.length > 1 && fitRoute(routeCoords)}
        >
          <Ionicons name="navigate" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Bottom sheet ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Single unified scroll — objective card + order details all flow together */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContent}
        >
          {/* ── Objective section ── */}
          <View style={styles.objectiveCard}>
            {/* Step progress — fill % tied to actual order status */}
            <View style={styles.peekSteps}>
              {/* Store node — green always; shows checkmark once picked up */}
              <View style={styles.peekNode}>
                <View style={[styles.peekNodeDot, styles.peekNodeDotActive]}>
                  <Ionicons
                    name={phase === 'DELIVERY' ? 'checkmark' : 'storefront'}
                    size={10}
                    color={COLORS.white}
                  />
                </View>
                <Text style={styles.peekNodeLabel}>Store</Text>
              </View>

              {/* Track — fills proportionally with order progress */}
              <View style={styles.peekTrack}>
                <View style={[styles.peekTrackFill, { width: `${ORDER_PROGRESS_PCT[order.status] ?? 0}%` }]} />
              </View>

              {/* Customer node — activates once rider is en-route */}
              <View style={styles.peekNode}>
                <View style={[
                  styles.peekNodeDot,
                  CUSTOMER_NODE_ACTIVE.includes(order.status) ? styles.peekNodeDotActive : styles.peekNodeDotInactive,
                ]}>
                  <Ionicons
                    name={order.status === 'COMPLETED' ? 'checkmark' : 'person'}
                    size={10}
                    color={CUSTOMER_NODE_ACTIVE.includes(order.status) ? COLORS.white : '#BDBDBD'}
                  />
                </View>
                <Text style={[
                  styles.peekNodeLabel,
                  !CUSTOMER_NODE_ACTIVE.includes(order.status) && styles.peekNodeLabelInactive,
                ]}>
                  Customer
                </Text>
              </View>
            </View>

            {/* Objective text + ETA — inset from the progress node edges */}
            <View style={styles.peekTextBlock}>
              <Text style={styles.peekObjective}>{OBJECTIVE[order.status] ?? ''}</Text>
              {routeInfo && (
                <Text style={styles.peekEta}>{routeInfo.distance} · {routeInfo.duration}</Text>
              )}
            </View>
          </View>

          {/* ── Destination card ── */}
          <View style={styles.destCard}>
            <View style={styles.destLeft}>
              <View style={styles.destIconWrap}>
                <Ionicons name={phase === 'PICKUP' ? 'storefront' : 'person'} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.destInfo}>
                <Text style={styles.destLabel}>{phase === 'PICKUP' ? 'Pick up from' : 'Deliver to'}</Text>
                <Text style={styles.destName} numberOfLines={1}>
                  {phase === 'PICKUP'
                    ? (order.store?.name ?? 'Store')
                    : (order.customer?.name ?? 'Customer')}
                </Text>
                {phase === 'DELIVERY' && order.customer?.address && (
                  <Text style={styles.destAddress} numberOfLines={2}>{order.customer.address}</Text>
                )}
              </View>
            </View>
            <View style={styles.destActions}>
              {(phase === 'PICKUP' ? (order.store as any)?.phone : order.customer?.phone) && (
                <TouchableOpacity
                  style={styles.destActionBtn}
                  onPress={() => {
                    const phone = phase === 'PICKUP' ? (order.store as any)?.phone : order.customer?.phone;
                    if (phone) Linking.openURL(`tel:${phone}`);
                  }}
                >
                  <Ionicons name="call" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              {destination && (
                <TouchableOpacity style={styles.destActionBtn} onPress={() => openMapsNav(destination)}>
                  <Ionicons name="navigate" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Order items ── */}
          <View style={styles.itemsCard}>
            <Text style={styles.itemsTitle}>Items ({order.orderItems?.length ?? 0})</Text>
            {order.orderItems?.map((item, i) => (
              <Text key={i} style={styles.itemText}>{item.quantity}× {item.productName}</Text>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₦{Number(order.totalAmount).toLocaleString()}</Text>
            </View>
          </View>

          {/* ── Action button ── */}
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && NEXT_STATUS[order.status] && (
            <TouchableOpacity
              style={[styles.actionBtn, isUpdating && styles.actionBtnDisabled]}
              onPress={() => { const s = NEXT_STATUS[order.status]; if (s) handleUpdateStatus(s); }}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name={order.status === 'ARRIVED' ? 'checkmark-circle' : 'arrow-forward-circle'}
                    size={22}
                    color={COLORS.white}
                  />
                  <Text style={styles.actionBtnText}>{ACTION_TEXT[order.status]}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map:       { ...StyleSheet.absoluteFillObject },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn: {
    backgroundColor: COLORS.white, width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: SPACING.md, marginTop: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },

  mapControls: { position: 'absolute', right: SPACING.md, top: 120, gap: 8 },
  mapBtn: {
    backgroundColor: COLORS.white, width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 3,
  },

  // Map pins — pure View only, no child icons (PointAnnotation: max 1 subview)
  marker: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: COLORS.white,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  markerStore:    { backgroundColor: COLORS.primary },
  markerCustomer: { backgroundColor: '#7C3AED' },
  markerDim:      { backgroundColor: '#9CA3AF' },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 12,
  },
  handleWrap: { alignItems: 'center', paddingVertical: 10 },
  handle:     { width: 38, height: 4, backgroundColor: '#D0D0D0', borderRadius: 2 },

  // Objective card — always visible at SHEET_MIN (mirrors the map banner style)
  peekRow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  // Step progress — icon nodes + filled track
  peekSteps:              { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  peekNode:               { alignItems: 'center', gap: 5, width: 64 },
  peekNodeDot:            { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  peekNodeDotActive:      { backgroundColor: COLORS.primary },
  peekNodeDotInactive:    { backgroundColor: '#EBEBEB' },
  peekNodeLabel:          { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  peekNodeLabelInactive:  { color: COLORS.textSecondary },
  // Track between nodes
  peekTrack:    { flex: 1, height: 4, backgroundColor: '#E8E8E8', borderRadius: 2, marginHorizontal: 8, overflow: 'hidden' },
  peekTrackFill:{ height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  peekTextBlock: { paddingHorizontal: SPACING.md, marginTop: 10 },
  peekObjective: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  peekEta:       { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 3 },

  // Single content container — all sections flow here
  sheetContent: { paddingHorizontal: SPACING.md, paddingTop: 4 },

  // Objective card — first thing visible at rest
  objectiveCard: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: SPACING.md,
  },

  // Destination card — more padding, sits clearly below objective
  destCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FFF8',
    borderWidth: 1, borderColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  destLeft:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  destIconWrap:  { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  destInfo:      { flex: 1, marginLeft: SPACING.sm },
  destLabel:     { fontSize: 11, color: COLORS.textSecondary },
  destName:      { fontSize: 16, fontWeight: '600', color: COLORS.text },
  destAddress:   { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  destActions:   { flexDirection: 'row', gap: 8 },
  destActionBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },

  itemsCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: '#F0F0F0',
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  itemsTitle:   { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  itemText:     { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  totalLabel:   { fontSize: 14, color: COLORS.text },
  totalAmount:  { fontSize: 17, fontWeight: '700', color: COLORS.primary },

  actionBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14, marginBottom: SPACING.sm, gap: 8 },
  actionBtnDisabled: { opacity: 0.65 },
  actionBtnText:     { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
