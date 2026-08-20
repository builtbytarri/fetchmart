import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NavigationContainerRef, useNavigation } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { StoreNavigator } from './StoreNavigator';
import { RiderNavigator } from './RiderNavigator';
import { SplashScreen, OnboardingScreen } from '../screens/onboarding';
import { useAuthStore } from '../store';
import { COLORS } from '../constants/config';
import { useNotifications } from '../hooks/useNotifications';

const ONBOARDING_KEY = 'onboarding_completed';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Deep-link handler for push notification taps
  const handleNotificationTap = (data: Record<string, unknown>) => {
    if (!user) return;
    if (data.orderId) {
      if (user.role === 'CUSTOMER') {
        navigationRef.current?.navigate('Customer', {
          screen: 'OrderDetails',
          params: { orderId: data.orderId as string },
        });
      } else if (user.role === 'RIDER') {
        navigationRef.current?.navigate('Rider', {
          screen: 'DeliveryDetails',
          params: { orderId: data.orderId as string },
        });
      }
    }
  };

  // Register for push notifications once the user is authenticated.
  useNotifications(handleNotificationTap);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await SecureStore.getItemAsync(ONBOARDING_KEY);
        setHasCompletedOnboarding(completed === 'true');
      } catch {
        setHasCompletedOnboarding(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboarding();
    loadUser();
  }, []);

  // When user becomes authenticated, mark onboarding as complete
  useEffect(() => {
    const markOnboardingComplete = async () => {
      if (isAuthenticated && !hasCompletedOnboarding) {
        try {
          await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
          setHasCompletedOnboarding(true);
        } catch (error) {
          console.error('Failed to save onboarding status:', error);
        }
      }
    };

    markOnboardingComplete();
  }, [isAuthenticated, hasCompletedOnboarding]);

  if (isLoading || isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If authenticated, always show the role-based navigator regardless of onboarding status
  if (isAuthenticated && user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user.role === 'CUSTOMER' && (
          <Stack.Screen name="Customer" component={CustomerNavigator} />
        )}
        {user.role === 'STORE' && (
          <Stack.Screen name="Store" component={StoreNavigator} />
        )}
        {user.role === 'RIDER' && (
          <Stack.Screen name="Rider" component={RiderNavigator} />
        )}
      </Stack.Navigator>
    );
  }

  // Not authenticated - show onboarding or auth
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding ? (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};
