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

const FallbackLoader = () => (
  <View style={{ flex: 1, backgroundColor: '#291c0e', justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#D4AF37" />
  </View>
);

// Create stable, top-level screen wrappers so React Navigation never unmounts/re-mounts screens on re-renders
const CategoryScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <CategoryScreen {...props} />
  </Suspense>
);

const ProductDetailsScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <ProductDetailsScreen {...props} />
  </Suspense>
);

const CartScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <CartScreen {...props} />
  </Suspense>
);

const CheckoutScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <CheckoutScreen {...props} />
  </Suspense>
);

const OrdersScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <OrdersScreen {...props} />
  </Suspense>
);

const WishlistScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <WishlistScreen {...props} />
  </Suspense>
);

const ProfileScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <ProfileScreen {...props} />
  </Suspense>
);

const AdminDashboardScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <AdminDashboardScreen {...props} />
  </Suspense>
);

const VendorDashboardScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <VendorDashboardScreen {...props} />
  </Suspense>
);

const AddProductScreenWrapper = (props: any) => (
  <Suspense fallback={<FallbackLoader />}>
    <AddProductScreen {...props} />
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
      <Stack.Screen name="Category" component={CategoryScreenWrapper} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreenWrapper} />
      <Stack.Screen name="Cart" component={CartScreenWrapper} />
      <Stack.Screen name="Checkout" component={CheckoutScreenWrapper} />
      <Stack.Screen name="Orders" component={OrdersScreenWrapper} />
      <Stack.Screen name="Wishlist" component={WishlistScreenWrapper} />
      <Stack.Screen name="Profile" component={ProfileScreenWrapper} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreenWrapper} />
      <Stack.Screen name="VendorDashboard" component={VendorDashboardScreenWrapper} />
      <Stack.Screen name="AddProduct" component={AddProductScreenWrapper} />
    </Stack.Navigator>
  );
};
