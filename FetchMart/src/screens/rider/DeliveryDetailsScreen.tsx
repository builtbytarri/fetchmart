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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { deliveryApi } from '../../api';
import { Order, OrderStatus } from '../../types';
import { COLORS, SPACING } from '../../constants/config';
import { getDirections } from '../../utils/directions';

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
  // Support both deliveryId and orderId params
  const deliveryId = route.params?.deliveryId || route.params?.orderId;
  const mapRef = useRef<MapView>(null);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<DeliveryPhase>('PICKUP');
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [routeInfo, setRouteInfo] = useState<{distance: string; duration: string} | null>(null);
  
  // Bottom sheet animation
  const sheetHeight = useRef(new Animated.Value(SHEET_MID_HEIGHT)).current;
  const lastSheetHeight = useRef(SHEET_MID_HEIGHT);
  
  // Mock rider location - Eko Hotel, Lekki, Lagos (in real app, this would come from device GPS)
  const [riderLocation] = useState({
    latitude: 6.4281,
    longitude: 3.4219,
  });

  // Pan responder for draggable bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = lastSheetHeight.current - gestureState.dy;
        if (newHeight >= SHEET_MIN_HEIGHT && newHeight <= SHEET_MAX_HEIGHT) {
          sheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = lastSheetHeight.current - gestureState.dy;
        let targetHeight = SHEET_MID_HEIGHT;
        
        if (newHeight < SHEET_MIN_HEIGHT + 50) {
          targetHeight = SHEET_MIN_HEIGHT;
        } else if (newHeight > SHEET_MAX_HEIGHT - 50) {
          targetHeight = SHEET_MAX_HEIGHT;
        } else if (newHeight < SHEET_MID_HEIGHT - 30) {
          targetHeight = SHEET_MIN_HEIGHT;
        } else if (newHeight > SHEET_MID_HEIGHT + 30) {
          targetHeight = SHEET_MAX_HEIGHT;
        }
        
        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
        lastSheetHeight.current = targetHeight;
      },
    })
  ).current;

  // Map zoom functions
  const zoomIn = () => {
    mapRef.current?.getCamera().then((camera) => {
      if (camera.zoom !== undefined) {
        mapRef.current?.animateCamera({
          ...camera,
          zoom: camera.zoom + 1,
        });
      }
    });
  };

  const zoomOut = () => {
    mapRef.current?.getCamera().then((camera) => {
      if (camera.zoom !== undefined) {
        mapRef.current?.animateCamera({
          ...camera,
          zoom: camera.zoom - 1,
        });
      }
    });
  };

  const recenterMap = () => {
    if (routeCoordinates.length > 0) {
      mapRef.current?.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    fetchDeliveryDetails();
  }, [deliveryId]);

  useEffect(() => {
    if (order) {
      // Determine phase based on order status
      if (['READY', 'ASSIGNED'].includes(order.status)) {
        setCurrentPhase('PICKUP');
      } else if (['PICKED_UP', 'EN_ROUTE', 'ARRIVED'].includes(order.status)) {
        setCurrentPhase('DELIVERY');
      }
    }
  }, [order?.status]);

  const fetchDeliveryDetails = async () => {
    try {
      const data = await deliveryApi.getDeliveryDetails(deliveryId);
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch delivery details:', err);
      Alert.alert('Error', 'Failed to load delivery details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    setIsUpdating(true);
    try {
      const updatedOrder = await deliveryApi.updateStatus(order.id, { status: newStatus });
      setOrder(updatedOrder);
      
      if (newStatus === 'COMPLETED') {
        Alert.alert('Success', 'Delivery completed!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatus = (): OrderStatus | null => {
    if (!order) return null;
    switch (order.status) {
      case 'READY': return 'ASSIGNED';
      case 'ASSIGNED': return 'PICKED_UP';
      case 'PICKED_UP': return 'EN_ROUTE';
      case 'EN_ROUTE': return 'ARRIVED';
      case 'ARRIVED': return 'COMPLETED';
      default: return null;
    }
  };

  const getActionButtonText = (): string => {
    if (!order) return '';
    switch (order.status) {
      case 'READY': return 'Accept Order';
      case 'ASSIGNED': return 'Confirm Pickup';
      case 'PICKED_UP': return 'Start Delivery';
      case 'EN_ROUTE': return 'Arrived at Location';
      case 'ARRIVED': return 'Complete Delivery';
      default: return 'Completed';
    }
  };

  const getObjectiveText = (): string => {
    if (!order) return '';
    switch (order.status) {
      case 'READY': return 'Accept and pick up from store';
      case 'ASSIGNED': return 'Pick up order from store';
      case 'PICKED_UP': return 'Head to customer location';
      case 'EN_ROUTE': return 'Delivering to customer';
      case 'ARRIVED': return 'Hand over to customer';
      case 'COMPLETED': return 'Delivery completed';
      default: return '';
    }
  };

  const openMapsNavigation = (destination: LocationData) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${destination.latitude},${destination.longitude}`;
    const label = destination.name || 'Destination';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    if (url) Linking.openURL(url);
  };

  const callPhone = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const getStoreLocation = (): LocationData | null => {
    const store = (order as any)?.store;
    if (!store) return null;
    return {
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.name,
      address: store.owner?.address,
      phone: store.owner?.phone,
    };
  };

  const getCustomerLocation = (): LocationData | null => {
    const customer = (order as any)?.customer;
    if (!customer) return null;
    return {
      latitude: customer.latitude || 6.4281,
      longitude: customer.longitude || 3.4219,
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
    };
  };

  const getCurrentDestination = (): LocationData | null => {
    return currentPhase === 'PICKUP' ? getStoreLocation() : getCustomerLocation();
  };

  const fetchRoute = async () => {
    const destination = getCurrentDestination();
    if (!destination) return;

    const result = await getDirections(riderLocation, destination);
    if (result) {
      setRouteCoordinates(result.coordinates);
      setRouteInfo({ distance: result.distance, duration: result.duration });
    } else {
      // Fallback to straight line if directions API fails
      setRouteCoordinates([riderLocation, destination]);
      setRouteInfo(null);
    }
  };

  const fitMapToRoute = () => {
    if (!mapRef.current) return;
    
    if (routeCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
    } else {
      const destination = getCurrentDestination();
      if (destination) {
        mapRef.current.fitToCoordinates([riderLocation, destination], {
          edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
          animated: true,
        });
      }
    }
  };

  useEffect(() => {
    if (order && !isLoading) {
      fetchRoute();
    }
  }, [order, currentPhase, isLoading]);

  useEffect(() => {
    if (routeCoordinates.length > 0) {
      setTimeout(fitMapToRoute, 300);
    }
  }, [routeCoordinates]);

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

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Store Marker */}
        {storeLocation && (
          <Marker
            coordinate={{
              latitude: storeLocation.latitude,
              longitude: storeLocation.longitude,
            }}
            title={storeLocation.name}
            description="Pickup Location"
          >
            <View style={[
              styles.markerContainer,
              currentPhase === 'PICKUP' ? styles.markerActive : styles.markerInactive
            ]}>
              <Ionicons 
                name="storefront" 
                size={20} 
                color={currentPhase === 'PICKUP' ? COLORS.white : COLORS.textSecondary} 
              />
            </View>
          </Marker>
        )}

        {/* Customer Marker */}
        {customerLocation && (
          <Marker
            coordinate={{
              latitude: customerLocation.latitude,
              longitude: customerLocation.longitude,
            }}
            title={customerLocation.name}
            description="Delivery Location"
          >
            <View style={[
              styles.markerContainer,
              currentPhase === 'DELIVERY' ? styles.markerActive : styles.markerInactive
            ]}>
              <Ionicons 
                name="location" 
                size={20} 
                color={currentPhase === 'DELIVERY' ? COLORS.white : COLORS.textSecondary} 
              />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={COLORS.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Back Button Overlay */}
      <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControlButton} onPress={zoomIn}>
          <Ionicons name="add" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlButton} onPress={zoomOut}>
          <Ionicons name="remove" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControlButton} onPress={recenterMap}>
          <Ionicons name="navigate" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Objective Banner */}
      <View style={styles.objectiveBanner}>
        <View style={styles.objectiveIcon}>
          <Ionicons 
            name={currentPhase === 'PICKUP' ? 'storefront' : 'location'} 
            size={16} 
            color={COLORS.white} 
          />
        </View>
        <View style={styles.objectiveContent}>
          <Text style={styles.objectiveLabel}>Current Objective</Text>
          <Text style={styles.objectiveText}>{getObjectiveText()}</Text>
          {routeInfo && (
            <Text style={styles.routeInfoText}>
              {routeInfo.distance} • {routeInfo.duration}
            </Text>
          )}
        </View>
        <View style={styles.progressDots}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[
            styles.progressDot, 
            currentPhase === 'DELIVERY' && styles.progressDotActive
          ]} />
        </View>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetContent}>
        {/* Destination Info */}
        <View style={styles.destinationCard}>
          <View style={styles.destinationHeader}>
            <View style={styles.destinationIconContainer}>
              <Ionicons 
                name={currentPhase === 'PICKUP' ? 'storefront' : 'person'} 
                size={24} 
                color={COLORS.primary} 
              />
            </View>
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationLabel}>
                {currentPhase === 'PICKUP' ? 'Pickup from' : 'Deliver to'}
              </Text>
              <Text style={styles.destinationName}>
                {currentDestination?.name || 'Unknown'}
              </Text>
              {currentDestination?.address && (
                <Text style={styles.destinationAddress} numberOfLines={2}>
                  {currentDestination.address}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionIconButton}
              onPress={() => callPhone(currentDestination?.phone)}
            >
              <Ionicons name="call" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionIconButton}
              onPress={() => currentDestination && openMapsNavigation(currentDestination)}
            >
              <Ionicons name="navigate" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.orderSummaryTitle}>Order Summary</Text>
          <View style={styles.orderItems}>
            {(order as any).orderItems?.map((item: any, index: number) => (
              <Text key={index} style={styles.orderItemText}>
                {item.quantity}x {item.productName}
              </Text>
            ))}
          </View>
          <View style={styles.orderTotal}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalAmount}>
              ₦{Number(order.totalAmount).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Main Action Button */}
        {order.status !== 'COMPLETED' && (
          <TouchableOpacity
            style={[styles.mainActionButton, isUpdating && styles.mainActionButtonDisabled]}
            onPress={() => {
              const nextStatus = getNextStatus();
              if (nextStatus) handleUpdateStatus(nextStatus);
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons 
                  name={order.status === 'ARRIVED' ? 'checkmark-circle' : 'arrow-forward-circle'} 
                  size={24} 
                  color={COLORS.white} 
                />
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
    marginTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapControls: {
    position: 'absolute',
    right: SPACING.md,
    top: 180,
    gap: SPACING.xs,
  },
  mapControlButton: {
    backgroundColor: COLORS.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  markerActive: {
    backgroundColor: COLORS.primary,
  },
  markerInactive: {
    backgroundColor: '#E0E0E0',
  },
  objectiveBanner: {
    position: 'absolute',
    top: 100,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  objectiveIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectiveContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  objectiveLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  objectiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  routeInfoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
  },
  sheetContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  destinationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  destinationLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  destinationAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderSummary: {
    paddingVertical: SPACING.md,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  orderItems: {
    marginBottom: SPACING.sm,
  },
  orderItemText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  orderTotalLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  orderTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  mainActionButtonDisabled: {
    opacity: 0.7,
  },
  mainActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
