import React, { useState, useMemo, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ActivityIndicator } from "react-native";
import { Product, fetchProductsFromSupabase } from "../data/products";
import { useCountry } from "../contexts/CountryContext";
import { formatPrice } from "../utils/currency";
import { SortOption } from "./CategoryBar";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";

interface ProductListProps {
  category: string;
  onSelectProduct: (product: Product) => void;
  sortBy: SortOption;
  searchQuery?: string;
  onPressLogin?: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ category, onSelectProduct, sortBy, searchQuery = "", onPressLogin }) => {
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist, wishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: Product[] = [];
        if (category === "Wishlist") {
          // If we are in wishlist mode, fetch all and filter by current wishlist IDs
          const all = await fetchProductsFromSupabase("All");
          // Use the wishlist array from context directly for filtering
          data = all.filter(p => wishlist.includes(p.id));
        } else {
          data = await fetchProductsFromSupabase(category);
        }
        setProducts(data);
      } catch (err) {
        console.error("Error loading products:", err);
        setError("Failed to connect to the gallery.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category, wishlist]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search Filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.productCode.toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (sortBy) {
      case "popularity":
        result.sort((a, b) => b.popularity - a.popularity);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "latest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "weight_low":
        result.sort((a, b) => a.grossWeight - b.grossWeight);
        break;
      case "weight_high":
        result.sort((a, b) => b.grossWeight - a.grossWeight);
        break;
    }
    return result;
  }, [products, sortBy, searchQuery]);

  const handleWishlistToggle = async (productId: string) => {
    if (!user) {
      onPressLogin?.();
      return;
    }
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  let numColumns = 2;
  if (width > 1400) numColumns = 6;
  else if (width > 1200) numColumns = 5;
  else if (width > 900) numColumns = 4;
  else if (width > 600) numColumns = 3;

  const spacing = 15;
  const padding = 20;
  const itemWidth = (width - (padding * 2) - (spacing * (numColumns - 1))) / numColumns;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {searchQuery ? `Search: ${searchQuery}` : `${category} Collection`}
        </Text>
        <Text style={styles.countText}>{filteredAndSortedProducts.length} Items</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Fetching Masterpieces...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: "#ff4444" }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
                setProducts([]);
                setLoading(true);
            }}
          >
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            {filteredAndSortedProducts.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.productCard, { width: itemWidth }]}
                activeOpacity={0.8}
                onPress={() => onSelectProduct(item)}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <TouchableOpacity 
                    style={styles.wishlistIcon} 
                    onPress={() => handleWishlistToggle(item.id)}
                  >
                    <Text style={[styles.heart, isInWishlist(item.id) && styles.heartActive]}>
                      {isInWishlist(item.id) ? "♥" : "♡"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productWeight}>{item.grossWeight.toFixed(2)}g | {item.purity}</Text>
                  <Text style={styles.productPrice}>{formatPrice(item.price, countryCode)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {filteredAndSortedProducts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found matching your criteria.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#291c0e",
    minHeight: 400,
  },
  loadingContainer: {
    padding: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#D4AF37",
    marginTop: 20,
    fontFamily: "TrajanPro",
    fontSize: 14,
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 25,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
  },
  title: {
    fontFamily: "TrajanPro",
    fontSize: 20,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  countText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  productCard: {
    backgroundColor: "#3d2b1a",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#4a3520",
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  wishlistIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  heart: {
    color: "#fff",
    fontSize: 18,
  },
  heartActive: {
    color: "#D4AF37",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  productWeight: {
    color: "#aaa",
    fontSize: 10,
    marginBottom: 6,
  },
  productPrice: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    fontStyle: "italic",
  },
  retryButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
  }
});

export default ProductList;
