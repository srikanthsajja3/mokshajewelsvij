import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, ScrollView, Text, ActivityIndicator, TouchableOpacity, Animated } from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductList from "../components/ProductList";
import { Product, fetchProductsFromSupabase } from "../data/products";
import { useWishlist } from "../contexts/WishlistContext";
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useUI } from '../contexts/UIContext';

interface WishlistScreenProps {
  scrollY?: Animated.Value;
  searchQuery?: string;
}

const WishlistScreen: React.FC<WishlistScreenProps> = ({ scrollY, searchQuery }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { setLoginVisible } = useUI();
  const { wishlist, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch all products and filter by wishlist IDs
        // In a real app, you'd have a specific fetch for multiple IDs
        const allProducts = await fetchProductsFromSupabase("All");
        setProducts(allProducts.filter(p => wishlist.includes(p.id)));
      } catch (error) {
        console.error("Error loading wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWishlistProducts();
  }, [wishlist]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Your Wishlist</Text>
            <Text style={styles.subtitle}>Reserved masterpieces waiting for you.</Text>
          </View>

          {loading || wishlistLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#D4AF37" />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your wishlist is empty.</Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.exploreButtonText}>Explore Collections</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ProductList 
              category="Wishlist" 
              onSelectProduct={(product) => navigation.navigate('ProductDetails', { id: product.id })} 
              sortBy="popularity"
              searchQuery={searchQuery}
              onPressLogin={() => setLoginVisible(true)}
            />
          )}
        </View>

        <Footer />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#291c0e",
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  headerSection: {
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
  },
  title: {
    fontFamily: "TrajanPro",
    fontSize: 28,
    color: "#D4AF37",
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  center: {
    padding: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#aaa",
    fontSize: 18,
    marginBottom: 30,
  },
  exploreButton: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 4,
  },
  exploreButtonText: {
    color: "#D4AF37",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  }
});

export default WishlistScreen;
