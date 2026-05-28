import React, { useState, useRef } from "react";
import { StyleSheet, StatusBar, View, ActivityIndicator, Animated, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import LoginScreen from "./src/screens/LoginScreen";
import { CountryProvider } from "./src/contexts/CountryContext";
import { GoldRateProvider } from "./src/contexts/GoldRateContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { CartProvider } from "./src/contexts/CartContext";
import { WishlistProvider } from "./src/contexts/WishlistContext";
import { StripeWrapper } from "./src/components/StripeWrapper";
import SideDrawer from "./src/components/SideDrawer";
import Header from "./src/components/Header";

import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { RootStackParamList } from "./src/navigation/types";
import { UIProvider, useUI } from "./src/contexts/UIContext";

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const linking = {
  prefixes: [Platform.OS === 'web' ? window.location.origin : 'mokshajewels://'],
  config: {
    screens: {
      Home: 'home',
      Category: 'category/:category',
      ProductDetails: {
        path: 'product/:id',
        parse: {
          id: (id: string) => id,
        },
      },
      Cart: 'cart',
      Checkout: 'checkout',
      Orders: 'orders',
      Wishlist: 'wishlist',
      Profile: 'profile',
      AdminDashboard: 'admin',
      VendorDashboard: 'vendor',
      AddProduct: 'add-product',
      ARTryOn: 'ar',
    },
  },
};

function AppContent() {
  const { drawerVisible, setDrawerVisible, loginVisible, setLoginVisible } = useUI();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoading: authLoading, isRecovering } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentRoute, setCurrentRoute] = useState<string>("Home");

  const [fontsLoaded] = useFonts({
    "TrajanPro": require("./assets/fonts/TrajanPro-Regular.ttf"),
  });

  React.useEffect(() => {
    if (isRecovering) {
      setLoginVisible(true);
    }
  }, [isRecovering]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0 && currentRoute !== "Category") {
      navigationRef.navigate("Category", { category: "All" });
    }
  };

  if (!fontsLoaded || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const handleNavigateFromDrawer = (screen: keyof RootStackParamList) => {
    setDrawerVisible(false);
    
    // Type-safe navigation mapping
    if (screen === 'Category') {
      navigationRef.navigate('Category', { category: 'All' });
    } else if (screen === 'Home' || screen === 'Cart' || screen === 'Wishlist' || 
               screen === 'Profile' || screen === 'Orders' || screen === 'AdminDashboard' || 
               screen === 'VendorDashboard') {
      // @ts-ignore - navigationRef.navigate signature is complex for dynamic keys
      navigationRef.navigate(screen);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <NavigationContainer 
        ref={navigationRef}
        linking={linking}
        onStateChange={() => {
          const routeName = navigationRef.getCurrentRoute()?.name;
          if (routeName) setCurrentRoute(routeName);
        }}
      >
        {currentRoute !== "ARTryOn" && (
          <Header 
            scrollY={scrollY}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onPressMenu={() => setDrawerVisible(true)}
            isHome={currentRoute === "Home"}
          />
        )}
        <AppNavigator />

        <LoginScreen 
          visible={loginVisible}
          onLoginSuccess={() => setLoginVisible(false)} 
          onGoHome={() => {
            setLoginVisible(false);
            navigationRef.navigate("Home");
          }} 
          onClose={() => setLoginVisible(false)}
          initialIsUpdatingPassword={isRecovering}
        />

        <SideDrawer 
          isVisible={drawerVisible} 
          onClose={() => setDrawerVisible(false)} 
          onNavigate={handleNavigateFromDrawer}
          activeScreen={currentRoute}
        />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <UIProvider>
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
          </UIProvider>
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
