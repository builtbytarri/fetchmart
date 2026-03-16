import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  RiderDashboardScreen,
  DeliveriesScreen,
  RiderProfileScreen,
  EarningsScreen,
  VehicleInfoScreen,
  DeliveryDetailsScreen,
} from '../screens/rider';
import {
  EditProfileScreen,
  NotificationsSettingsScreen,
  HelpSupportScreen,
  TermsConditionsScreen,
} from '../screens/shared';
import { deliveryApi } from '../api';
import { COLORS } from '../constants/config';

export type RiderStackParamList = {
  RiderTabs: undefined;
  DeliveryDetails: { deliveryId: string };
  EditProfile: undefined;
  Earnings: undefined;
  VehicleInfo: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  TermsConditions: undefined;
};

export type RiderTabParamList = {
  Dashboard: undefined;
  Deliveries: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RiderStackParamList>();
const Tab = createBottomTabNavigator<RiderTabParamList>();

const RiderTabs: React.FC = () => {
  const [activeDeliveryCount, setActiveDeliveryCount] = useState(0);

  const fetchActiveDeliveries = async () => {
    try {
      const deliveries = await deliveryApi.getMyDeliveries();
      setActiveDeliveryCount(deliveries.length);
    } catch (err) {
      // Silently fail - rider profile might not exist yet
      setActiveDeliveryCount(0);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveDeliveries();
    }, [])
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Show red badge for available/active deliveries
          if (route.name === 'Deliveries' && activeDeliveryCount > 0) {
            return (
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {activeDeliveryCount > 9 ? '9+' : activeDeliveryCount}
                  </Text>
                </View>
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingBottom: 25,
          paddingTop: 12,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={RiderDashboardScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} />
      <Tab.Screen name="Profile" component={RiderProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -10,
    top: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export const RiderNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="RiderTabs" component={RiderTabs} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
      <Stack.Screen name="Notifications" component={NotificationsSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
};
