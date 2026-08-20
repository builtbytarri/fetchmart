import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Brand tokens — exact values from the official FetchMart logo ────────────
// Primary green  #38B449  →  leaf, wordmark, arc  (dominant — used everywhere)
// Accent coral   #E8572C  →  bag body             (used sparingly elsewhere)
//
// The floating pill uses the primary green indicator to stay consistent
// with the green theme used across the rest of the app.
const BRAND_GREEN = '#38B449';    // exact green from the logo leaf & wordmark
const BRAND_GREEN_DARK = '#2A8A37'; // darker shade for shadow/glow

// ─── Geometry ─────────────────────────────────────────────────────────────────
const H_MARGIN = 24;
const BAR_WIDTH = SCREEN_WIDTH - H_MARGIN * 2;
const BAR_HEIGHT = 62;
const INNER_PAD = 6;
const INDICATOR_SIZE = 46;

const ICON_MAP: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  // Customer tabs
  Home:       { active: 'home',        inactive: 'home-outline' },
  Orders:     { active: 'receipt',     inactive: 'receipt-outline' },
  Cart:       { active: 'bag-handle',  inactive: 'bag-handle-outline' },
  Profile:    { active: 'person',      inactive: 'person-outline' },
  // Rider tabs
  Dashboard:  { active: 'home',        inactive: 'home-outline' },
  Deliveries: { active: 'bicycle',     inactive: 'bicycle-outline' },
  // Store tabs (future-proofing)
  StoreOrders:{ active: 'receipt',     inactive: 'receipt-outline' },
};

// ─── Main component ───────────────────────────────────────────────────────────
export const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const tabCount = state.routes.length;
  const tabWidth = (BAR_WIDTH - INNER_PAD * 2) / tabCount;

  const indicatorX = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      stiffness: 200,
      damping: 20,
      mass: 0.8,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom + 8, 20) }]}
      pointerEvents="box-none"
    >
      {/* Green glow — matches brand primary */}
      <View style={styles.glowRing} />

      <View style={styles.bar}>
        {/* Sliding brand-green indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: INDICATOR_SIZE,
              height: INDICATOR_SIZE,
              top: (BAR_HEIGHT - INDICATOR_SIZE) / 2,
              left: INNER_PAD + (tabWidth - INDICATOR_SIZE) / 2,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const icons = ICON_MAP[route.name] ?? {
            active: 'ellipse',
            inactive: 'ellipse-outline',
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <TabButton
              key={route.key}
              focused={focused}
              iconName={focused ? icons.active : icons.inactive}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
              width={tabWidth}
            />
          );
        })}
      </View>
    </View>
  );
};

// ─── Single tab button ────────────────────────────────────────────────────────
interface TabButtonProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
  width: number;
}

const TabButton: React.FC<TabButtonProps> = ({
  focused,
  iconName,
  onPress,
  onLongPress,
  accessibilityLabel,
  width,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.86,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 36,
      bounciness: 8,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={focused ? { selected: true } : {}}
      style={[styles.tab, { width }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={iconName}
          size={22}
          // White when active (sits on green circle), muted grey when inactive
          color={focused ? '#FFFFFF' : 'rgba(30, 40, 30, 0.38)'}
        />
      </Animated.View>
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: H_MARGIN,
    right: H_MARGIN,
    alignItems: 'center',
  },

  // Soft green halo — matches the primary brand colour.
  glowRing: {
    position: 'absolute',
    width: BAR_WIDTH + 16,
    height: BAR_HEIGHT + 16,
    borderRadius: (BAR_HEIGHT + 16) / 2,
    backgroundColor: 'transparent',
    top: -8,
    left: -8,
    shadowColor: BRAND_GREEN_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 20,
    elevation: 0,
  },

  bar: {
    flexDirection: 'row',
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,

    // Near-white translucent pill base
    backgroundColor: 'rgba(252, 252, 252, 0.96)',

    // Ghost border — green tint at low opacity
    borderWidth: 1,
    borderColor: 'rgba(56, 180, 73, 0.12)',

    paddingHorizontal: INNER_PAD,
    alignItems: 'center',

    // Main shadow — green-tinted depth
    shadowColor: BRAND_GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },

  indicator: {
    position: 'absolute',
    backgroundColor: BRAND_GREEN,
    borderRadius: INDICATOR_SIZE / 2,
  },

  tab: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
