import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { COLORS, SPACING } from '../constants/config';

interface AddressAutocompleteProps {
  value: string;
  onSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
  label?: string;
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onSelect,
  placeholder = 'Search for address',
  label,
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (value && ref.current) {
      ref.current.setAddressText(value);
    }
  }, []);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder}
        textInputProps={{
          placeholderTextColor: COLORS.textSecondary,
        }}
        onPress={(data, details = null) => {
          if (details) {
            onSelect({
              address: data.description,
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
          }
        }}
        query={{
          key: GOOGLE_PLACES_API_KEY,
          language: 'en',
          components: 'country:ng',
        }}
        fetchDetails={true}
        enablePoweredByContainer={false}
        minLength={2}
        debounce={300}
        styles={{
          container: {
            flex: 0,
          },
          textInputContainer: {
            backgroundColor: 'transparent',
          },
          textInput: {
            height: 50,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 8,
            paddingHorizontal: SPACING.md,
            fontSize: 16,
            color: COLORS.text,
            backgroundColor: COLORS.white,
          },
          listView: {
            backgroundColor: COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 8,
            marginTop: 4,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          row: {
            backgroundColor: COLORS.white,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
          },
          separator: {
            height: 1,
            backgroundColor: COLORS.border,
          },
          description: {
            fontSize: 14,
            color: COLORS.text,
          },
          poweredContainer: {
            display: 'none',
          },
        }}
        nearbyPlacesAPI="GooglePlacesSearch"
        GooglePlacesSearchQuery={{
          rankby: 'distance',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
});
