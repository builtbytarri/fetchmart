import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, MAPBOX_ACCESS_TOKEN } from '../../constants/config';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

const BRAND_GREEN = '#38B449';   // exact primary from logo
const BRAND_GREEN_LIGHT = '#E8F7EB';

interface LocationPickerScreenProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onBack: () => void;
  /** When false, skip GPS and open at initialLocation (or Lagos default). */
  autoLocate?: boolean;
  initialLocation?: { latitude: number; longitude: number };
  confirmLabel?: string;
}

const DEFAULT_COORDS = { latitude: 6.5244, longitude: 3.3792 };

export const LocationPickerScreen: React.FC<LocationPickerScreenProps> = ({
  onLocationSelected,
  onBack,
  autoLocate = true,
  initialLocation,
  confirmLabel = 'Continue',
}) => {
  const cameraRef = useRef<Mapbox.Camera>(null);

  const startCoords = initialLocation ?? DEFAULT_COORDS;
  const [markerPosition, setMarkerPosition] = useState(startCoords);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(autoLocate);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);

  useEffect(() => {
    if (autoLocate) {
      getCurrentLocation();
    } else {
      setMarkerPosition(startCoords);
      setZoomLevel(15);
      cameraRef.current?.setCamera({
        centerCoordinate: [startCoords.longitude, startCoords.latitude],
        zoomLevel: 15,
        animationMode: 'flyTo',
        animationDuration: 600,
      });
      getAddressFromCoords(startCoords.latitude, startCoords.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required. Please enable it in your device settings.');
        setIsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      setMarkerPosition({ latitude, longitude });
      const newZoom = 15;
      setZoomLevel(newZoom);
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: newZoom,
        animationMode: 'flyTo',
        animationDuration: 1200,
      });

      await getAddressFromCoords(latitude, longitude);
    } catch {
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const zoomIn = () => {
    const next = Math.min(zoomLevel + 1.5, 22);
    setZoomLevel(next);
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 250 });
  };

  const zoomOut = () => {
    const next = Math.max(zoomLevel - 1.5, 1);
    setZoomLevel(next);
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 250 });
  };

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    setIsLoadingAddress(true);
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        const parts = [result.streetNumber, result.street, result.district, result.city, result.region].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch {
      // silently ignore — user can still proceed
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapPress = async (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    setMarkerPosition({ latitude: lat, longitude: lng });
    await getAddressFromCoords(lat, lng);
  };

  const handleMarkerDragEnd = async (e: any) => {
    const [lng, lat] = e.geometry.coordinates;
    setMarkerPosition({ latitude: lat, longitude: lng });
    await getAddressFromCoords(lat, lng);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* flex:1 map fills all remaining space so gesture area matches visual area exactly */}
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        onPress={handleMapPress}
        logoEnabled={false}
        attributionEnabled={false}
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        compassEnabled
        compassPosition={{ top: 100, right: 16 }}
        onCameraChanged={(state) => setZoomLevel(state.properties.zoom)}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [markerPosition.longitude, markerPosition.latitude],
            zoomLevel: 13,
          }}
          minZoomLevel={1}
          maxZoomLevel={22}
          animationMode="flyTo"
          animationDuration={500}
        />

        <Mapbox.UserLocation visible renderMode={Mapbox.UserLocationRenderMode.Native} />

        <Mapbox.PointAnnotation
          id="selectedLocation"
          coordinate={[markerPosition.longitude, markerPosition.latitude]}
          draggable
          onDragEnd={handleMarkerDragEnd}
        >
          <View style={styles.marker}>
            <Ionicons name="location" size={28} color={BRAND_GREEN} />
          </View>
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>

      {/* Back button */}
      <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Right-side controls column: zoom in, zoom out, recenter */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={zoomIn} activeOpacity={0.75}>
          <Ionicons name="add" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.controlDivider} />
        <TouchableOpacity style={styles.controlButton} onPress={zoomOut} activeOpacity={0.75}>
          <Ionicons name="remove" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.recenterButton} onPress={getCurrentLocation} activeOpacity={0.75}>
        <Ionicons name="locate" size={22} color={COLORS.white} />
      </TouchableOpacity>

      <SafeAreaView style={styles.bottomContainer} edges={['bottom']}>
        {isLoadingAddress ? (
          <View style={styles.addressContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.addressText}>Getting address...</Text>
          </View>
        ) : address ? (
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={20} color={COLORS.text} />
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.continueButton} onPress={() => onLocationSelected({ ...markerPosition, address })}>
          <Text style={styles.continueButtonText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const CARD_SHADOW = {
  shadowColor: 'rgba(0,0,0,0.15)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 6,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  // flex:1 instead of fixed pixel height — gesture recogniser now covers
  // exactly the same area as the visible map, no more, no less.
  map: {
    flex: 1,
  },

  // Back button
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
  },
  backButton: {
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...CARD_SHADOW,
  },

  // Zoom + / - grouped pill on the right side
  mapControls: {
    position: 'absolute',
    right: SPACING.md,
    top: '35%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 8,
  },

  // Recenter — brand green shadow so it reads as the primary action
  recenterButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 200,
    backgroundColor: BRAND_GREEN,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },

  // Marker pin
  marker: {
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: 20,
    ...CARD_SHADOW,
  },

  // Bottom sheet
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  addressText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: BRAND_GREEN,
    paddingVertical: SPACING.md + 2,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
