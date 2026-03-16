import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  DashboardScreen,
  ProductsScreen,
  StoreOrdersScreen,
  StoreProfileScreen,
  CreateStoreScreen,
  AddProductScreen,
  StoreSettingsScreen,
  ManageCategoriesScreen,
  EditProductScreen,
  StoreWalletScreen,
  StoreAnalyticsScreen,
} from '../screens/store';
import {
  EditProfileScreen,
  PaymentMethodsScreen,
  NotificationsSettingsScreen,
  HelpSupportScreen,
  TermsConditionsScreen,
} from '../screens/shared';
import { COLORS } from '../constants/config';

export type StoreStackParamList = {
  StoreTabs: undefined;
  Products: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  ManageCategories: { storeId: string };
  StoreOrders: undefined;
  CreateStore: undefined;
  EditProfile: undefined;
  StoreSettings: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  TermsConditions: undefined;
  StoreWallet: undefined;
  StoreAnalytics: undefined;
};

export type StoreTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<StoreStackParamList>();
const Tab = createBottomTabNavigator<StoreTabParamList>();

const StoreTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={StoreOrdersScreen} />
      <Tab.Screen name="Profile" component={StoreProfileScreen} />
    </Tab.Navigator>
  );
};

export const StoreNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StoreTabs" component={StoreTabs} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="StoreOrders" component={StoreOrdersScreen} />
      <Stack.Screen name="CreateStore" component={CreateStoreScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="StoreSettings" component={StoreSettingsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="StoreWallet" component={StoreWalletScreen} />
      <Stack.Screen name="StoreAnalytics" component={StoreAnalyticsScreen} />
    </Stack.Navigator>
  );
};
