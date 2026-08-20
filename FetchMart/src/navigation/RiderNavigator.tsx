import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
  BankAccountScreen,
} from '../screens/shared';
import { FloatingTabBar } from '../components/FloatingTabBar';
import { RiderStackParamList } from './types';

export type RiderTabParamList = {
  Dashboard:   undefined;
  Deliveries:  undefined;
  Profile:     undefined;
};

const Stack = createNativeStackNavigator<RiderStackParamList>();
const Tab   = createBottomTabNavigator<RiderTabParamList>();

// FloatingTabBar reads route.name to pick icons — these must match the ICON_MAP
// in FloatingTabBar.tsx.  We add the rider icons there below.
const RiderTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Dashboard"  component={RiderDashboardScreen} />
    <Tab.Screen name="Deliveries" component={DeliveriesScreen}     />
    <Tab.Screen name="Profile"    component={RiderProfileScreen}   />
  </Tab.Navigator>
);

export const RiderNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RiderTabs"       component={RiderTabs}                  />
    <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen}      />
    <Stack.Screen name="EditProfile"     component={EditProfileScreen}          />
    <Stack.Screen name="Earnings"        component={EarningsScreen}             />
    <Stack.Screen name="VehicleInfo"     component={VehicleInfoScreen}          />
    <Stack.Screen name="Notifications"   component={NotificationsSettingsScreen}/>
    <Stack.Screen name="HelpSupport"     component={HelpSupportScreen}          />
    <Stack.Screen name="TermsConditions" component={TermsConditionsScreen}      />
    <Stack.Screen name="BankAccount"     component={BankAccountScreen}          />
  </Stack.Navigator>
);
