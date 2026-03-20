import React, { useState } from "react";
import { StyleSheet, StatusBar, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import HomeScreen from "./src/screens/HomeScreen";
import CategoryScreen from "./src/screens/CategoryScreen";
import ProductDetailsScreen from "./src/screens/ProductDetailsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import CartScreen from "./src/screens/CartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import { Product } from "./src/data/products";
import { CountryProvider } from "./src/contexts/CountryContext";
import { GoldRateProvider } from "./src/contexts/GoldRateContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { CartProvider } from "./src/contexts/CartContext";
import SwipeBackView from "./src/components/SwipeBackView";
import { StripeWrapper } from "./src/components/StripeWrapper";

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "category" | "details" | "login" | "cart" | "checkout" | "orders">("home");
  const [selectedCategory, setSelectedCategory] = useState("Gold");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { user, isLoading: authLoading } = useAuth();

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

  if (!fontsLoaded || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {currentScreen === "home" && (
        <HomeScreen 
          onSelectCategory={navigateToCategory} 
          onGoHome={navigateToHome} 
          onPressLogin={navigateToLogin}
          onPressCart={navigateToCart}
          onPressOrders={handleOrders}
        />
      )}
      
      {currentScreen === "category" && (
        <SwipeBackView onSwipeBack={navigateToHome}>
          <CategoryScreen 
            category={selectedCategory} 
            onSelectCategory={navigateToCategory} 
            onSelectProduct={navigateToProduct}
            onGoHome={navigateToHome} 
            onPressLogin={navigateToLogin}
            onPressCart={navigateToCart}
            onPressOrders={handleOrders}
          />
        </SwipeBackView>
      )}

      {currentScreen === "details" && selectedProduct && (
        <SwipeBackView onSwipeBack={navigateBackToList}>
          <ProductDetailsScreen 
            product={selectedProduct} 
            onGoHome={navigateToHome}
            onBack={navigateBackToList}
            onPressLogin={navigateToLogin}
            onPressCart={navigateToCart}
            onPressOrders={handleOrders}
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
          onGoHome={navigateToHome}
          onCheckout={handleCheckout}
          onPressLogin={navigateToLogin}
          onPressOrders={handleOrders}
        />
      )}

      {currentScreen === "checkout" && (
        <CheckoutScreen 
          onGoHome={navigateToHome}
          onSuccess={navigateToOrders}
          onPressLogin={navigateToLogin}
          onPressOrders={handleOrders}
          onPressCart={navigateToCart}
        />
      )}

      {currentScreen === "orders" && (
        <OrdersScreen 
          onGoHome={navigateToHome}
          onPressLogin={navigateToLogin}
          onPressOrders={handleOrders}
          onPressCart={navigateToCart}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <CountryProvider>
            <GoldRateProvider>
              <StripeWrapper>
                <AppContent />
              </StripeWrapper>
            </GoldRateProvider>
          </CountryProvider>
        </CartProvider>
      </AuthProvider>
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
