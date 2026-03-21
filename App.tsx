import React, { useState } from "react";
import { StyleSheet, StatusBar, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import HomeScreen from "./src/screens/HomeScreen";
import CategoryScreen from "./src/screens/CategoryScreen";
import ProductDetailsScreen from "./src/screens/ProductDetailsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import CartScreen from "./src/screens/CartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import WishlistScreen from "./src/screens/WishlistScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";
import VendorDashboardScreen from "./src/screens/VendorDashboardScreen";
import { Product } from "./src/data/products";
import { CountryProvider } from "./src/contexts/CountryContext";
import { GoldRateProvider } from "./src/contexts/GoldRateContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { CartProvider } from "./src/contexts/CartContext";
import { WishlistProvider } from "./src/contexts/WishlistContext";
import SwipeBackView from "./src/components/SwipeBackView";
import { StripeWrapper } from "./src/components/StripeWrapper";

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "category" | "details" | "login" | "cart" | "checkout" | "orders" | "wishlist" | "profile" | "admin" | "vendor">("home");
  const [selectedCategory, setSelectedCategory] = useState("Gold");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin, isVendor, isLoading: authLoading } = useAuth();

  const [fontsLoaded] = useFonts({
    "TrajanPro": require("./assets/fonts/TrajanPro-Regular.ttf"),
  });

  const navigateToCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentScreen("category");
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen("details");
  };

  const navigateToHome = () => {
    setCurrentScreen("home");
  };

  const navigateToLogin = () => {
    setCurrentScreen("login");
  };

  const navigateToCart = () => {
    setCurrentScreen("cart");
  };

  const navigateToCheckout = () => {
    setCurrentScreen("checkout");
  };

  const navigateToOrders = () => {
    setCurrentScreen("orders");
  };

  const navigateToWishlist = () => {
    setCurrentScreen("wishlist");
  };

  const navigateToProfile = () => {
    setCurrentScreen("profile");
  };

  const navigateToAdmin = () => {
    setCurrentScreen("admin");
  };

  const navigateToVendor = () => {
    setCurrentScreen("vendor");
  };

  const navigateBackToList = () => {
    setCurrentScreen("category");
  };

  const handleCheckout = () => {
    if (!user) {
      navigateToLogin();
    } else {
      navigateToCheckout();
    }
  };

  const handleOrders = () => {
    if (!user) {
      navigateToLogin();
    } else {
      navigateToOrders();
    }
  };

  const handleProfile = () => {
    if (!user) {
      navigateToLogin();
    } else {
      navigateToProfile();
    }
  };

  const handleWishlist = () => {
    if (!user) {
      navigateToLogin();
    } else {
      navigateToWishlist();
    }
  };

  const handleVendor = () => {
    if (!user) {
      navigateToLogin();
    } else {
      navigateToVendor();
    }
  };

  if (!fontsLoaded || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const commonProps = {
    onGoHome: navigateToHome,
    onPressLogin: navigateToLogin,
    onPressCart: navigateToCart,
    onPressOrders: handleOrders,
    onPressWishlist: handleWishlist,
    onPressProfile: handleProfile,
    onPressAdmin: navigateToAdmin,
    onPressVendor: handleVendor,
    searchQuery,
    onSearch: setSearchQuery,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {currentScreen === "home" && (
        <HomeScreen 
          onSelectCategory={navigateToCategory} 
          {...commonProps}
        />
      )}
      
      {currentScreen === "category" && (
        <SwipeBackView onSwipeBack={navigateToHome}>
          <CategoryScreen 
            category={selectedCategory} 
            onSelectCategory={navigateToCategory} 
            onSelectProduct={navigateToProduct}
            {...commonProps}
          />
        </SwipeBackView>
      )}

      {currentScreen === "details" && selectedProduct && (
        <SwipeBackView onSwipeBack={navigateBackToList}>
          <ProductDetailsScreen 
            product={selectedProduct} 
            onBack={navigateBackToList}
            onSelectProduct={navigateToProduct}
            {...commonProps}
          />
        </SwipeBackView>
      )}

      {currentScreen === "login" && (
        <LoginScreen 
          onLoginSuccess={navigateToHome} 
          onGoHome={navigateToHome} 
          onClose={navigateToHome}
        />
      )}

      {currentScreen === "cart" && (
        <CartScreen 
          onCheckout={handleCheckout}
          {...commonProps}
        />
      )}

      {currentScreen === "checkout" && (
        <CheckoutScreen 
          onSuccess={navigateToOrders}
          {...commonProps}
        />
      )}

      {currentScreen === "orders" && (
        <OrdersScreen 
          {...commonProps}
        />
      )}

      {currentScreen === "wishlist" && (
        <WishlistScreen 
          onSelectProduct={navigateToProduct}
          {...commonProps}
        />
      )}

      {currentScreen === "profile" && (
        <ProfileScreen 
          {...commonProps}
        />
      )}

      {currentScreen === "admin" && (
        <AdminDashboardScreen 
          {...commonProps}
        />
      )}

      {currentScreen === "vendor" && (
        <VendorDashboardScreen 
          {...commonProps}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <CountryProvider>
                <GoldRateProvider>
                  <StripeWrapper>
                    <AppContent />
                  </StripeWrapper>
                </GoldRateProvider>
              </CountryProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#291c0e",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#291c0e",
    justifyContent: "center",
    alignItems: "center",
  },
});
