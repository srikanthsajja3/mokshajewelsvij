import React, { useState } from "react";
import { StyleSheet, StatusBar, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import HomeScreen from "./src/screens/HomeScreen";
import CategoryScreen from "./src/screens/CategoryScreen";
import ProductDetailsScreen from "./src/screens/ProductDetailsScreen";
import { Product } from "./src/data/products";
import { CountryProvider } from "./src/contexts/CountryContext";
import { GoldRateProvider } from "./src/contexts/GoldRateContext";
import SwipeBackView from "./src/components/SwipeBackView";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "category" | "details">("home");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const navigateBackToList = () => {
    setCurrentScreen("category");
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CountryProvider>
        <GoldRateProvider>
          <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {currentScreen === "home" && (
              <HomeScreen onSelectCategory={navigateToCategory} onGoHome={navigateToHome} />
            )}
            
            {currentScreen === "category" && (
              <SwipeBackView onSwipeBack={navigateToHome}>
                <CategoryScreen 
                  category={selectedCategory} 
                  onSelectCategory={navigateToCategory} 
                  onSelectProduct={navigateToProduct}
                  onGoHome={navigateToHome} 
                />
              </SwipeBackView>
            )}

            {currentScreen === "details" && selectedProduct && (
              <SwipeBackView onSwipeBack={navigateBackToList}>
                <ProductDetailsScreen 
                  product={selectedProduct} 
                  onGoHome={navigateToHome}
                  onBack={navigateBackToList}
                />
              </SwipeBackView>
            )}
          </View>
        </GoldRateProvider>
      </CountryProvider>
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
