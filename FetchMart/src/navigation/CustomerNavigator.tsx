import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  HomeScreen,
  StoreDetailsScreen,
  ProductDetailsScreen,
  AllProductsScreen,
  PaymentScreen,
  OrderDetailsScreen,
  AllStoresScreen,
  CartScreen,
  OrdersScreen,
  ProfileScreen,
} from '../screens/customer';
import { GuestGate } from '../components';
import { useAuthStore } from '../store';
import {
  EditProfileScreen,
  SavedAddressesScreen,
  PaymentMethodsScreen,
  NotificationsSettingsScreen,
  HelpSupportScreen,
  TermsConditionsScreen,
} from '../screens/shared';
import { CustomerStackParamList, CustomerTabParamList } from './types';
import { FloatingTabBar } from '../components/FloatingTabBar';

const Stack = createNativeStackNavigator<CustomerStackParamList>();
const Tab = createBottomTabNavigator<CustomerTabParamList>();

/**
 * Orders is account-based; guests see a sign-in prompt instead. The switch
 * lives here (not inside OrdersScreen) so the screen's hooks never run in
 * guest mode and hook order stays stable across the transition.
 */
const OrdersTab: React.FC<any> = (props) => {
  const isGuest = useAuthStore((st) => st.isGuest);
  if (isGuest) return <GuestGate feature="orders" icon="receipt-outline" />;
  return <OrdersScreen {...props} />;
};

const CustomerTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersTab} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const CustomerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
      <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="AllProducts" component={AllProductsScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="AllStores" component={AllStoresScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
    </Stack.Navigator>
  );
};
