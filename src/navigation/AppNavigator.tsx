import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Lazy-loaded heavy modules (TensorFlow, Three.js, Admin/Vendor dashboards) to optimize initial JavaScript bundle size
const AdminDashboardScreen = lazy(() => import('../screens/AdminDashboardScreen'));
const VendorDashboardScreen = lazy(() => import('../screens/VendorDashboardScreen'));
const AddProductScreen = lazy(() => import('../screens/AddProductScreen'));
const ARTryOnScreen = lazy(() => import('../screens/ARTryOnScreen'));

const FallbackLoader = () => (
  <View style={{ flex: 1, backgroundColor: '#291c0e', justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#D4AF37" />
  </View>
);

const LazyScreen = (Component: React.ComponentType<any>) => (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <Component {...props} />
  </Suspense>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AdminDashboard" component={LazyScreen(AdminDashboardScreen)} />
      <Stack.Screen name="VendorDashboard" component={LazyScreen(VendorDashboardScreen)} />
      <Stack.Screen name="AddProduct" component={LazyScreen(AddProductScreen)} />
      <Stack.Screen name="ARTryOn" component={LazyScreen(ARTryOnScreen)} />
    </Stack.Navigator>
  );
};
