import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
  PendingVerificationScreen,
} from '../screens/store';
import {
  EditProfileScreen,
  PaymentMethodsScreen,
  NotificationsSettingsScreen,
  HelpSupportScreen,
  TermsConditionsScreen,
  BankAccountScreen,
} from '../screens/shared';
import { COLORS } from '../constants/config';
import { StoreStackParamList } from './types';
import { StoreStatusContext } from './storeStatusContext';
import { storesApi } from '../api';

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

// 'loading'  → still resolving the store status
// 'no-store' → store-role user hasn't created a store yet (show the app so they
//              can create one from the Dashboard's "Create Your Store" card)
// 'pending'  → a store exists but admin hasn't verified it yet
// 'verified' → store exists and is approved
type VerificationState = 'loading' | 'no-store' | 'pending' | 'verified';

export const StoreNavigator: React.FC = () => {
  const [verificationState, setVerificationState] = useState<VerificationState>('loading');

  const checkVerification = useCallback(async () => {
    try {
      const stores = await storesApi.getMyStores();
      if (stores.length === 0) {
        // No store yet — let them into the app to create one.
        setVerificationState('no-store');
      } else if (stores[0].isVerified) {
        setVerificationState('verified');
      } else {
        setVerificationState('pending');
      }
    } catch {
      // Fail open so a network error doesn't permanently block the store
      setVerificationState('verified');
    }
  }, []);

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  let content: React.ReactNode;

  if (verificationState === 'loading') {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  } else if (verificationState === 'pending') {
    content = <PendingVerificationScreen onRefresh={checkVerification} />;
  } else {
    // 'verified' and 'no-store' both render the full store app. A no-store user
    // lands on the Dashboard, which shows the "Create Your Store" card.
    content = (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="BankAccount" component={BankAccountScreen} />
    </Stack.Navigator>
    );
  }

  return (
    <StoreStatusContext.Provider value={{ refresh: checkVerification }}>
      {content}
    </StoreStatusContext.Provider>
  );
};
