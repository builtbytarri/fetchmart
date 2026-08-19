import React, { useState, useEffect, useRef } from 'react';
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
import { MAPBOX_ACCESS_TOKEN, COLORS, SPACING } from '../../constants/config';
import { deliveryApi } from '../../api';
import { Order, OrderStatus } from '../../types';
import { getDirections } from '../../utils/directions';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

const { width, height } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = height * 0.25;
const SHEET_MID_HEIGHT = height * 0.4;
const SHEET_MAX_HEIGHT = height * 0.6;

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, any>;
};

type DeliveryPhase = 'PICKUP' | 'DELIVERY';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  phone?: string;
}

export const DeliveryDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const deliveryId = route.params?.deliveryId || route.params?.orderId;
  const cameraRef = useRef<Mapbox.Camera>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<DeliveryPhase>('PICKUP');
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [cameraZoom, setCameraZoom] = useState(13);

  const sheetHeight = useRef(new Animated.Value(SHEET_MID_HEIGHT)).current;
  const lastSheetHeight = useRef(SHEET_MID_HEIGHT);

  // Mock rider location — replace with real expo-location in production
  const [riderLocation] = useState({ latitude: 6.4281, longitude: 3.4219 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const h = lastSheetHeight.current - g.dy;
        if (h >= SHEET_MIN_HEIGHT && h <= SHEET_MAX_HEIGHT) sheetHeight.setValue(h);
      },
      onPanResponderRelease: (_, g) => {
        const h = lastSheetHeight.current - g.dy;
        let target = SHEET_MID_HEIGHT;
        if (h < SHEET_MIN_HEIGHT + 50) target = SHEET_MIN_HEIGHT;
        else if (h > SHEET_MAX_HEIGHT - 50) target = SHEET_MAX_HEIGHT;
        else if (h < SHEET_MID_HEIGHT - 30) target = SHEET_MIN_HEIGHT;
        else if (h > SHEET_MID_HEIGHT + 30) target = SHEET_MAX_HEIGHT;
        Animated.spring(sheetHeight, { toValue: target, useNativeDriver: false, bounciness: 4 }).start();
        lastSheetHeight.current = target;
      },
    })
  ).current;

  const zoomIn = () => {
    const next = cameraZoom + 1;
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 200 });
    setCameraZoom(next);
  };

  const zoomOut = () => {
    const next = cameraZoom - 1;
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 200 });
    setCameraZoom(next);
  };

  const fitMapToRoute = (coords: { latitude: number; longitude: number }[]) => {
    if (coords.length === 0) return;
    const lngs = coords.map((c) => c.longitude);
    const lats = coords.map((c) => c.latitude);
    cameraRef.current?.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      [100, 50, 250, 50],
      800,
    );
  };

  useEffect(() => { fetchDeliveryDetails(); }, [deliveryId]);

  useEffect(() => {
    if (!order) return;
    if (['READY', 'ASSIGNED'].includes(order.status)) setCurrentPhase('PICKUP');
    else if (['PICKED_UP', 'EN_ROUTE', 'ARRIVED'].includes(order.status)) setCurrentPhase('DELIVERY');
  }, [order?.status]);

  const fetchDeliveryDetails = async () => {
    try {
      const data = await deliveryApi.getDeliveryDetails(deliveryId);
      setOrder(data);
    } catch {
      Alert.alert('Error', 'Failed to load delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const updated = await deliveryApi.updateStatus(order.id, { status: newStatus });
      setOrder(updated);
      if (newStatus === 'COMPLETED') {
        Alert.alert('Success', 'Delivery completed!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatus = (): OrderStatus | null => {
    if (!order) return null;
    const map: Partial<Record<OrderStatus, OrderStatus>> = {
      READY: 'ASSIGNED',
      ASSIGNED: 'PICKED_UP',
      PICKED_UP: 'EN_ROUTE',
      EN_ROUTE: 'ARRIVED',
      ARRIVED: 'COMPLETED',
    };
    return map[order.status] ?? null;
  };

  const getActionButtonText = (): string => {
    if (!order) return '';
    const map: Partial<Record<OrderStatus, string>> = {
      READY: 'Accept Order',
      ASSIGNED: 'Confirm Pickup',
      PICKED_UP: 'Start Delivery',
      EN_ROUTE: 'Arrived at Location',
      ARRIVED: 'Complete Delivery',
    };
    return map[order.status] ?? 'Completed';
  };

  const getObjectiveText = (): string => {
    if (!order) return '';
    const map: Partial<Record<OrderStatus, string>> = {
      READY: 'Accept and pick up from store',
      ASSIGNED: 'Pick up order from store',
      PICKED_UP: 'Head to customer location',
      EN_ROUTE: 'Delivering to customer',
      ARRIVED: 'Hand over to customer',
      COMPLETED: 'Delivery completed',
    };
    return map[order.status] ?? '';
  };

  const openMapsNavigation = (dest: LocationData) => {
    const ll = `${dest.latitude},${dest.longitude}`;
    const label = dest.name || 'Destination';
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${ll}`,
      android: `geo:0,0?q=${ll}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  const getStoreLocation = (): LocationData | null => {
    const store = (order as any)?.store;
    if (!store) return null;
    return { latitude: store.latitude, longitude: store.longitude, name: store.name, address: store.owner?.address, phone: store.owner?.phone };
  };

  const getCustomerLocation = (): LocationData | null => {
    const customer = (order as any)?.customer;
    if (!customer) return null;
    return { latitude: customer.latitude || 6.4281, longitude: customer.longitude || 3.4219, name: customer.name, address: customer.address, phone: customer.phone };
  };

  const getCurrentDestination = () => (currentPhase === 'PICKUP' ? getStoreLocation() : getCustomerLocation());

  useEffect(() => {
    if (!order || isLoading) return;
    const dest = getCurrentDestination();
    if (!dest) return;
    getDirections(riderLocation, dest).then((result) => {
      if (result) {
        setRouteCoordinates(result.coordinates);
        setRouteInfo({ distance: result.distance, duration: result.duration });
        setTimeout(() => fitMapToRoute(result.coordinates), 300);
      } else {
        setRouteCoordinates([riderLocation, dest]);
        setRouteInfo(null);
      }
    });
  }, [order, currentPhase, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Text>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const storeLocation = getStoreLocation();
  const customerLocation = getCustomerLocation();
  const currentDestination = getCurrentDestination();

  const routeGeoJSON = routeCoordinates.length > 1
    ? {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: routeCoordinates.map((c) => [c.longitude, c.latitude]),
        },
        properties: {},
      }
    : null;

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        onCameraChanged={(state) => setCameraZoom(state.properties.zoom)}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [riderLocation.longitude, riderLocation.latitude],
            zoomLevel: 13,
          }}
        />

        <Mapbox.UserLocation visible renderMode={Mapbox.UserLocationRenderMode.Native} />

        {storeLocation && (
          <Mapbox.PointAnnotation
            id="storeMarker"
            coordinate={[storeLocation.longitude, storeLocation.latitude]}
          >
            <View style={[styles.markerContainer, currentPhase === 'PICKUP' ? styles.markerActive : styles.markerInactive]}>
              <Ionicons name="storefront" size={20} color={currentPhase === 'PICKUP' ? COLORS.white : COLORS.textSecondary} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {customerLocation && (
          <Mapbox.PointAnnotation
            id="customerMarker"
            coordinate={[customerLocation.longitude, customerLocation.latitude]}
          >
            <View style={[styles.markerContainer, currentPhase === 'DELIVERY' ? styles.markerActive : styles.markerInactive]}>
              <Ionicons name="location" size={20} color={currentPhase === 'DELIVERY' ? COLORS.white : COLORS.textSecondary} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {routeGeoJSON && (
          <Mapbox.ShapeSource id="routeSource" shape={routeGeoJSON}>
            <Mapbox.LineLayer
              id="routeLayer"
              style={{ lineColor: COLORS.primary, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>

      <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlButton} onPress={zoomIn}>
          <Ionicons name="add" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlButton} onPress={zoomOut}>
          <Ionicons name="remove" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlButton} onPress={() => routeCoordinates.length > 0 && fitMapToRoute(routeCoordinates)}>
          <Ionicons name="navigate" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.objectiveBanner}>
        <View style={styles.objectiveIcon}>
          <Ionicons name={currentPhase === 'PICKUP' ? 'storefront' : 'location'} size={16} color={COLORS.white} />
        </View>
        <View style={styles.objectiveContent}>
          <Text style={styles.objectiveLabel}>Current Objective</Text>
          <Text style={styles.objectiveText}>{getObjectiveText()}</Text>
          {routeInfo && (
            <Text style={styles.routeInfoText}>{routeInfo.distance} • {routeInfo.duration}</Text>
          )}
        </View>
        <View style={styles.progressDots}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, currentPhase === 'DELIVERY' && styles.progressDotActive]} />
        </View>
      </View>

      <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetContent}>
          <View style={styles.destinationCard}>
            <View style={styles.destinationHeader}>
              <View style={styles.destinationIconContainer}>
                <Ionicons name={currentPhase === 'PICKUP' ? 'storefront' : 'person'} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.destinationInfo}>
                <Text style={styles.destinationLabel}>{currentPhase === 'PICKUP' ? 'Pickup from' : 'Deliver to'}</Text>
                <Text style={styles.destinationName}>{currentDestination?.name || 'Unknown'}</Text>
                {currentDestination?.address && (
                  <Text style={styles.destinationAddress} numberOfLines={2}>{currentDestination.address}</Text>
                )}
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionIconButton} onPress={() => currentDestination?.phone && Linking.openURL(`tel:${currentDestination.phone}`)}>
                <Ionicons name="call" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconButton} onPress={() => currentDestination && openMapsNavigation(currentDestination)}>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            <View style={styles.orderItems}>
              {(order as any).orderItems?.map((item: any, idx: number) => (
                <Text key={idx} style={styles.orderItemText}>{item.quantity}x {item.productName}</Text>
              ))}
            </View>
            <View style={styles.orderTotal}>
              <Text style={styles.orderTotalLabel}>Total</Text>
              <Text style={styles.orderTotalAmount}>₦{Number(order.totalAmount).toLocaleString()}</Text>
            </View>
          </View>

          {order.status !== 'COMPLETED' && (
            <TouchableOpacity
              style={[styles.mainActionButton, isUpdating && styles.mainActionButtonDisabled]}
              onPress={() => { const s = getNextStatus(); if (s) handleUpdateStatus(s); }}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name={order.status === 'ARRIVED' ? 'checkmark-circle' : 'arrow-forward-circle'} size={24} color={COLORS.white} />
                  <Text style={styles.mainActionButtonText}>{getActionButtonText()}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  map: { ...StyleSheet.absoluteFillObject },
  backButtonContainer: { position: 'absolute', top: 0, left: 0, right: 0 },
  backButton: { backgroundColor: COLORS.white, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.md, marginTop: SPACING.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  mapControls: { position: 'absolute', right: SPACING.md, top: 180, gap: SPACING.xs },
  mapControlButton: { backgroundColor: COLORS.white, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  markerContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
  markerActive: { backgroundColor: COLORS.primary },
  markerInactive: { backgroundColor: '#E0E0E0' },
  objectiveBanner: { position: 'absolute', top: 100, left: SPACING.md, right: SPACING.md, backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  objectiveIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  objectiveContent: { flex: 1, marginLeft: SPACING.sm },
  objectiveLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase' },
  objectiveText: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  routeInfoText: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  progressDots: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  progressDotActive: { backgroundColor: COLORS.primary },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10 },
  dragHandleContainer: { alignItems: 'center', paddingVertical: SPACING.sm },
  dragHandle: { width: 40, height: 4, backgroundColor: '#D0D0D0', borderRadius: 2 },
  sheetContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  destinationCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  destinationHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  destinationIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  destinationInfo: { flex: 1, marginLeft: SPACING.sm },
  destinationLabel: { fontSize: 12, color: COLORS.textSecondary },
  destinationName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  destinationAddress: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm },
  actionIconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  orderSummary: { paddingVertical: SPACING.md },
  orderSummaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  orderItems: { marginBottom: SPACING.sm },
  orderItemText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  orderTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  orderTotalLabel: { fontSize: 14, color: COLORS.text },
  orderTotalAmount: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  mainActionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: 12, marginBottom: SPACING.md, gap: SPACING.sm },
  mainActionButtonDisabled: { opacity: 0.7 },
  mainActionButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
