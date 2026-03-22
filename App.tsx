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
import AddProductScreen from "./src/screens/AddProductScreen";
import { Product } from "./src/data/products";
import { CountryProvider } from "./src/contexts/CountryContext";
import { GoldRateProvider } from "./src/contexts/GoldRateContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { CartProvider } from "./src/contexts/CartContext";
import { WishlistProvider } from "./src/contexts/WishlistContext";
import SwipeBackView from "./src/components/SwipeBackView";
import { StripeWrapper } from "./src/components/StripeWrapper";
import SideDrawer from "./src/components/SideDrawer";

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "category" | "details" | "login" | "cart" | "checkout" | "orders" | "wishlist" | "profile" | "admin" | "vendor" | "addProduct">("home");
  const [history, setHistory] = useState<any[]>([{ screen: "home" }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("Gold");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin, isVendor, isLoading: authLoading, isRecovering } = useAuth();

  React.useEffect(() => {
    if (isRecovering) {
      setCurrentScreen("login");
    }
  }, [isRecovering]);

  const navigateTo = (screen: any, params?: any) => {
    // If params are provided, update state accordingly
    if (params?.category) setSelectedCategory(params.category);
    if (params?.product) setSelectedProduct(params.product);
    if (params?.vendorId !== undefined) setSelectedVendorId(params.vendorId);

    const newHistory = history.slice(0, historyIndex + 1);
    const newState = { screen, category: params?.category, product: params?.product, vendorId: params?.vendorId };
    
    // Don't add if it's the same as current
    const current = newHistory[newHistory.length - 1];
    if (current && current.screen === screen && current.category === params?.category && current.product?.id === params?.product?.id) {
      return;
    }

    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentScreen(screen);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      if (prev.category) setSelectedCategory(prev.category);
      if (prev.product) setSelectedProduct(prev.product);
      if (prev.vendorId) setSelectedVendorId(prev.vendorId);
      
      setHistoryIndex(historyIndex - 1);
      setCurrentScreen(prev.screen);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      if (next.category) setSelectedCategory(next.category);
      if (next.product) setSelectedProduct(next.product);
      if (next.vendorId) setSelectedVendorId(next.vendorId);
      
      setHistoryIndex(historyIndex + 1);
      setCurrentScreen(next.screen);
    }
  };

  const [fontsLoaded] = useFonts({
    "TrajanPro": require("./assets/fonts/TrajanPro-Regular.ttf"),
  });

  const navigateToCategory = (cat: string) => {
    navigateTo("category", { category: cat });
  };

  const navigateToProduct = (product: Product) => {
    navigateTo("details", { product });
  };

  const navigateToHome = () => {
    navigateTo("home");
  };

  const navigateToLogin = () => {
    navigateTo("login");
  };

  const navigateToCart = () => {
    navigateTo("cart");
  };

  const navigateToCheckout = () => {
    navigateTo("checkout");
  };

  const navigateToOrders = () => {
    navigateTo("orders");
  };

  const navigateToWishlist = () => {
    navigateTo("wishlist");
  };

  const navigateToProfile = () => {
    navigateTo("profile");
  };

  const navigateToAdmin = () => {
    navigateTo("admin");
  };

  const navigateToVendor = () => {
    navigateTo("vendor");
  };

  const navigateToAddProduct = (vendorId: string) => {
    navigateTo("addProduct", { vendorId });
  };

  const navigateBackToList = () => {
    handleBack();
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
    onBack: handleBack,
    onForward: handleForward,
    onPressMenu: () => setDrawerVisible(true),
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1,
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
          initialIsUpdatingPassword={isRecovering}
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
          onAddProduct={navigateToAddProduct}
          {...commonProps}
        />
      )}

      {currentScreen === "addProduct" && (
        <AddProductScreen 
          vendorId={selectedVendorId}
          onBack={navigateToVendor}
          {...commonProps}
        />
      )}

      <SideDrawer 
        isVisible={drawerVisible} 
        onClose={() => setDrawerVisible(false)} 
        onNavigate={(screen: any) => navigateTo(screen)}
        activeScreen={currentScreen}
      />
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
