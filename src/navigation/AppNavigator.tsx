import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import HomeScreen from '../screens/HomeScreen';

// Lazy-load secondary screens to optimize Home Screen initial bundle size and load speed
const CategoryScreen = lazy(() => import('../screens/CategoryScreen'));
const ProductDetailsScreen = lazy(() => import('../screens/ProductDetailsScreen'));
const CartScreen = lazy(() => import('../screens/CartScreen'));
const CheckoutScreen = lazy(() => import('../screens/CheckoutScreen'));
const OrdersScreen = lazy(() => import('../screens/OrdersScreen'));
const WishlistScreen = lazy(() => import('../screens/WishlistScreen'));
const ProfileScreen = lazy(() => import('../screens/ProfileScreen'));
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
      <Stack.Screen name="Category" component={LazyScreen(CategoryScreen)} />
      <Stack.Screen name="ProductDetails" component={LazyScreen(ProductDetailsScreen)} />
      <Stack.Screen name="Cart" component={LazyScreen(CartScreen)} />
      <Stack.Screen name="Checkout" component={LazyScreen(CheckoutScreen)} />
      <Stack.Screen name="Orders" component={LazyScreen(OrdersScreen)} />
      <Stack.Screen name="Wishlist" component={LazyScreen(WishlistScreen)} />
      <Stack.Screen name="Profile" component={LazyScreen(ProfileScreen)} />
      <Stack.Screen name="AdminDashboard" component={LazyScreen(AdminDashboardScreen)} />
      <Stack.Screen name="VendorDashboard" component={LazyScreen(VendorDashboardScreen)} />
      <Stack.Screen name="AddProduct" component={LazyScreen(AddProductScreen)} />
      <Stack.Screen name="ARTryOn" component={LazyScreen(ARTryOnScreen)} />
    </Stack.Navigator>
  );
};
