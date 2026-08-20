import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  FlatList,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, MAPBOX_ACCESS_TOKEN } from '../constants/config';
import { fetchJson } from '../utils/http';

interface AddressAutocompleteProps {
  value: string;
  onSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
  label?: string;
  /** ISO country code to bias results, e.g. "ng" for Nigeria. Defaults to "ng". */
  country?: string;
  /** Bias suggestions toward a coordinate (e.g. user's last known location). */
  proximity?: { latitude: number; longitude: number };
  /** Max height of the scrollable suggestions list. */
  dropdownMaxHeight?: number;
  containerStyle?: ViewStyle;
}

interface Suggestion {
  id: string;
  placeName: string;
  longitude: number;
  latitude: number;
}

const DEBOUNCE_MS = 350;
const DEFAULT_DROPDOWN_MAX_HEIGHT = 280;

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onSelect,
  placeholder = 'Search for address',
  label,
  country = 'ng',
  proximity,
  dropdownMaxHeight = DEFAULT_DROPDOWN_MAX_HEIGHT,
  containerStyle,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proximityRef = useRef(proximity);

  useEffect(() => {
    proximityRef.current = proximity;
  }, [proximity]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setHasSearched(false);
    try {
      const proximityParam = proximityRef.current
        ? `&proximity=${proximityRef.current.longitude},${proximityRef.current.latitude}`
        : '';

      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json` +
        `?access_token=${MAPBOX_ACCESS_TOKEN}` +
        `&autocomplete=true` +
        `&limit=10` +
        `&country=${country}` +
        `&types=address,place,poi,locality,neighborhood,postcode` +
        proximityParam;

      const data = await fetchJson<{ features?: any[] }>(url, { signal: controller.signal });

      if (!data.features) {
        setSuggestions([]);
        setShowResults(true);
        setHasSearched(true);
        return;
      }

      const items: Suggestion[] = data.features.map((f: any) => ({
        id: f.id,
        placeName: f.place_name,
        longitude: f.center[0],
        latitude: f.center[1],
      }));
      setSuggestions(items);
      setShowResults(true);
      setHasSearched(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Mapbox geocoding error:', err.message);
        setSuggestions([]);
        setShowResults(true);
        setHasSearched(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleSearch = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowResults(false);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), DEBOUNCE_MS);
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    scheduleSearch(text);
  };

  const handleFocus = () => {
    if (query.trim().length >= 2) {
      if (suggestions.length > 0) {
        setShowResults(true);
      } else {
        scheduleSearch(query);
      }
    }
  };

  const handlePick = (s: Suggestion) => {
    setQuery(s.placeName);
    setShowResults(false);
    setSuggestions([]);
    setHasSearched(false);
    Keyboard.dismiss();
    onSelect({
      address: s.placeName,
      latitude: s.latitude,
      longitude: s.longitude,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowResults(false);
    setHasSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  };

  const showDropdown = showResults && (isLoading || hasSearched);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.trailingIcon} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.trailingIcon}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && (
        <View style={[styles.dropdown, { maxHeight: dropdownMaxHeight }]}>
          {isLoading && suggestions.length === 0 ? (
            <View style={styles.dropdownMessage}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.dropdownMessageText}>Searching addresses…</Text>
            </View>
          ) : suggestions.length === 0 ? (
            <View style={styles.dropdownMessage}>
              <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.dropdownMessageText}>No addresses found — try a nearby landmark</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={{ maxHeight: dropdownMaxHeight }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => handlePick(item)}
                  style={[styles.row, index < suggestions.length - 1 && styles.rowBorder]}
                  activeOpacity={0.6}
                >
                  <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.rowText}>{item.placeName}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    zIndex: 1000,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.text,
  },
  trailingIcon: {
    paddingLeft: SPACING.xs,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  dropdownMessageText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});
