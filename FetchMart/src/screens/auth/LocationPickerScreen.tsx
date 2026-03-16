import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/config';

const { width, height } = Dimensions.get('window');

interface LocationPickerScreenProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onBack: () => void;
}

export const LocationPickerScreen: React.FC<LocationPickerScreenProps> = ({
  onLocationSelected,
  onBack,
}) => {
  const [region, setRegion] = useState<Region>({
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
  });
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setMarkerPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      mapRef.current?.animateToRegion(newRegion, 1000);
      await getAddressFromCoords(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    setIsLoadingAddress(true);
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result) {
        const addressParts = [
          result.streetNumber,
          result.street,
          result.district,
          result.city,
          result.region,
        ].filter(Boolean);
        setAddress(addressParts.join(', '));
      }
    } catch (error) {
      console.log('Error getting address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    await getAddressFromCoords(latitude, longitude);
  };

  const handleMarkerDragEnd = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    await getAddressFromCoords(latitude, longitude);
  };

  const handleContinue = () => {
    onLocationSelected({
      latitude: markerPosition.latitude,
      longitude: markerPosition.longitude,
      address,
    });
  };

  const handleRecenter = async () => {
    await getCurrentLocation();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={markerPosition}
          draggable
          onDragEnd={handleMarkerDragEnd}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marker}>
              <Ionicons name="location" size={24} color="#4CAF50" />
            </View>
            <View style={styles.markerShadow} />
          </View>
        </Marker>
      </MapView>

      <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </SafeAreaView>

      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
        <Ionicons name="locate" size={24} color="#4CAF50" />
      </TouchableOpacity>

      <SafeAreaView style={styles.bottomContainer} edges={['bottom']}>
        {isLoadingAddress ? (
          <View style={styles.addressContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.addressText}>Getting address...</Text>
          </View>
        ) : address ? (
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={20} color={COLORS.text} />
            <Text style={styles.addressText} numberOfLines={2}>
              {address}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
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
  map: {
    width,
    height,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 180,
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerShadow: {
    width: 10,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    marginTop: -5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#4CAF50',
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
