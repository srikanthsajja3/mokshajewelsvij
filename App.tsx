import React, { useState } from "react";
import { StyleSheet, StatusBar, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import HomeScreen from "./src/screens/HomeScreen";
import CategoryScreen from "./src/screens/CategoryScreen";
import ProductDetailsScreen from "./src/screens/ProductDetailsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { Product } from "./src/data/products";
import { CountryProvider } from "./src/contexts/CountryContext";
import { GoldRateProvider } from "./src/contexts/GoldRateContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import SwipeBackView from "./src/components/SwipeBackView";

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "category" | "details" | "login">("home");
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  const navigateBackToList = () => {
    setCurrentScreen("category");
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
          />
        </SwipeBackView>
      )}

      {currentScreen === "login" && (
        <LoginScreen 
          onLoginSuccess={navigateToHome} 
          onGoHome={navigateToHome} 
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CountryProvider>
          <GoldRateProvider>
            <AppContent />
          </GoldRateProvider>
        </CountryProvider>
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
