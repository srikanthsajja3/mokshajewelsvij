import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ActivityIndicator, Animated, FlatList } from "react-native";
import OptimizedImage from "./OptimizedImage";
import { Product, fetchProductsFromSupabase, ProductFilters } from "../data/products";
import { useCountry } from "../contexts/CountryContext";
import { formatPrice } from "../utils/currency";
import { SortOption } from "./CategoryBar";
import { useWishlist } from "../contexts/WishlistContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

interface ProductListProps {
  category: string;
  onSelectProduct: (product: Product) => void;
  sortBy: SortOption;
  searchQuery?: string;
  onPressLogin?: () => void;
  filters?: ProductFilters;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScroll?: (event: any) => void;
  stickyHeaderIndices?: number[];
  onClearFilters?: () => void;
  hasSidebar?: boolean;
}

const AnimatedProductCard = React.memo(({ item, itemWidth, onSelectProduct, handleWishlistToggle, isInWishlist, formatPrice, countryCode, addedToCartId, handleAddToCart, index, shouldLoad }: any) => {
  const [hovered, setHovered] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: Math.min(index, 8) * 100, 
        useNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: Math.min(index, 8) * 100,
        useNativeDriver,
      })
    ]).start();
  }, [index, fadeAnim, translateY, useNativeDriver]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const onPressAddToCart = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver })
    ]).start();
    handleAddToCart(item);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }], width: itemWidth }}>
      <TouchableOpacity 
        style={[
          styles.productCard, 
          { width: '100%' },
          Platform.OS === 'web' && hovered && styles.productCardHovered
        ]}
        activeOpacity={0.8}
        onPress={() => onSelectProduct(item)}
        // @ts-ignore
        onMouseEnter={() => setHovered(true)}
        // @ts-ignore
        onMouseLeave={() => setHovered(false)}
      >
        <View style={styles.imageContainer}>
          <OptimizedImage 
            url={item.image} 
            style={styles.productImage} 
            shouldLoad={shouldLoad}
          />
          {/* Hallmark Trust Badge */}
          <View style={styles.hallmarkBadge}>
            <Text style={styles.hallmarkBadgeText}>
              {item.category === 'Diamonds' ? 'IGI CERTIFIED' : 'BIS 916'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.wishlistIcon} 
            onPress={() => handleWishlistToggle(item.id)}
          >
            <Text style={[styles.heart, isInWishlist && styles.heartActive]}>
              {isInWishlist ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productWeight}>{item.grossWeight.toFixed(2)}g | {item.purity}</Text>
          <Text style={styles.productPrice}>{formatPrice(item.price, countryCode)}</Text>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={[styles.addToCartBtn, addedToCartId === item.id && styles.addToCartBtnSuccess]}
              onPress={onPressAddToCart}
            >
              <Text style={[styles.addToCartBtnText, addedToCartId === item.id && styles.addToCartBtnTextSuccess]}>
                {addedToCartId === item.id ? "ADDED ✓" : "ADD TO BAG"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) => {
  return prev.item.id === next.item.id && 
         prev.shouldLoad === next.shouldLoad &&
         prev.isInWishlist === next.isInWishlist &&
         prev.addedToCartId === next.addedToCartId &&
         prev.itemWidth === next.itemWidth &&
         prev.countryCode === next.countryCode;
});

const ProductList: React.FC<ProductListProps> = ({ 
  category, 
  onSelectProduct, 
  sortBy, 
  searchQuery = "", 
  onPressLogin,
  filters = {},
  ListHeaderComponent,
  onScroll: onScrollProp,
  stickyHeaderIndices,
  onClearFilters,
  hasSidebar = false
}) => {
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist, wishlist } = useWishlist();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  // Visibility Tracking
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const isScrolling = useRef(false);
  const viewableIds = useRef(new Set<string>());
  const lastProcessedIds = useRef<string>('');
  const scrollTimer = useRef<any>(null);
  const sequentialTimer = useRef<any>(null);

  const startSequentialLoad = useCallback((idsToLoad: string[]) => {
    const idsString = idsToLoad.sort().join(',');
    if (idsString === lastProcessedIds.current) return;
    lastProcessedIds.current = idsString;

    if (sequentialTimer.current) clearInterval(sequentialTimer.current);
    
    let index = 0;
    sequentialTimer.current = setInterval(() => {
      if (index >= idsToLoad.length) {
        clearInterval(sequentialTimer.current);
        sequentialTimer.current = null;
        return;
      }

      const nextId = idsToLoad[index];
      setActiveIds(prev => {
        if (prev.has(nextId)) return prev;
        const next = new Set(prev);
        next.add(nextId);
        return next;
      });
      index++;
    }, 100); 
  }, []);

  const handleScrollEnd = useCallback(() => {
    isScrolling.current = false;
    startSequentialLoad(Array.from(viewableIds.current));
  }, [startSequentialLoad]);

  const handleScrollBegin = useCallback(() => {
    isScrolling.current = true;
    if (sequentialTimer.current) {
      clearInterval(sequentialTimer.current);
      sequentialTimer.current = null;
    }
    lastProcessedIds.current = ''; 
  }, []);

  const handleScroll = useCallback((event: any) => {
    if (onScrollProp) onScrollProp(event);
    
    if (Platform.OS === 'web') {
      isScrolling.current = true;
      if (sequentialTimer.current) {
        clearInterval(sequentialTimer.current);
        sequentialTimer.current = null;
      }
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(handleScrollEnd, 150);
    }
  }, [onScrollProp, handleScrollEnd]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const ids = viewableItems.map((vi: any) => vi.item.id);
    viewableIds.current = new Set(ids);
    if (!isScrolling.current) {
      startSequentialLoad(ids);
    }
  }).current;

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedToCartId(product.id);
    setTimeout(() => {
      setAddedToCartId(null);
    }, 2000);
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let data: Product[] = [];
        if (category === "Wishlist") {
          const all = await fetchProductsFromSupabase("All");
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.productCode.toLowerCase().includes(query)
      );
    }

    if (filters.subCategory) {
      const sub = filters.subCategory.toLowerCase();
      result = result.filter(p => {
        return (p.type?.toLowerCase() === sub) || 
               (p.category?.toLowerCase() === sub) ||
               (p.collection?.toLowerCase() === sub) ||
               (p.name?.toLowerCase().includes(sub));
      });
    }

    if (filters.minPrice !== undefined) {
      result = result.filter(p => p.price >= (filters.minPrice || 0));
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter(p => p.price <= (filters.maxPrice || Infinity));
    }
    if (filters.purity && filters.purity.length > 0) {
      result = result.filter(p => filters.purity?.includes(p.purity));
    }
    if (filters.metalColor && filters.metalColor.length > 0) {
      result = result.filter(p => filters.metalColor?.includes(p.metalColor));
    }

    switch (sortBy) {
      case "popularity": result.sort((a, b) => b.popularity - a.popularity); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "latest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "price_low": result.sort((a, b) => a.price - b.price); break;
      case "price_high": result.sort((a, b) => b.price - a.price); break;
      case "weight_low": result.sort((a, b) => a.grossWeight - b.grossWeight); break;
      case "weight_high": result.sort((a, b) => b.grossWeight - a.grossWeight); break;
    }
    return result;
  }, [products, sortBy, searchQuery, filters]);

  const handleWishlistToggle = async (productId: string) => {
    if (!user) { onPressLogin?.(); return; }
    if (isInWishlist(productId)) await removeFromWishlist(productId);
    else await addToWishlist(productId);
  };

  const gridWidth = width - (hasSidebar ? 284 : 0);

  const spacing = Platform.OS === 'web' ? 16 : 12;
  const padding = gridWidth > 1200 ? gridWidth * 0.02 : 12;
  const containerWidth = Platform.OS === 'web' ? Math.min(gridWidth, 2500) : gridWidth;
  const availableWidth = containerWidth - (padding * 2);

  // Dynamically calculate columns based on target compact card width (~180px on Web, ~140px on Mobile)
  const targetCardWidth = Platform.OS === 'web' ? 180 : 140;
  let numColumns = Math.floor((availableWidth + spacing) / (targetCardWidth + spacing));
  numColumns = Math.max(2, numColumns); // Minimum 2 columns

  const itemWidth = (availableWidth - (spacing * (numColumns - 1))) / numColumns;

  const renderItem = ({ item, index }: { item: Product; index: number }) => (
    <AnimatedProductCard
      item={item}
      index={index}
      itemWidth={itemWidth}
      onSelectProduct={onSelectProduct}
      handleWishlistToggle={handleWishlistToggle}
      isInWishlist={isInWishlist(item.id)}
      formatPrice={formatPrice}
      countryCode={countryCode}
      addedToCartId={addedToCartId}
      handleAddToCart={handleAddToCart}
      shouldLoad={activeIds.has(item.id)}
    />
  );

  return (
    <FlatList
      data={filteredAndSortedProducts}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      numColumns={numColumns}
      key={`${numColumns}`}
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.list, 
        Platform.OS === 'web' && { alignSelf: 'center', width: '100%', maxWidth: 2500, paddingHorizontal: padding }
      ]}
      columnWrapperStyle={numColumns > 1 ? { gap: spacing } : undefined}
      ListHeaderComponent={() => (
        <>
          {ListHeaderComponent}
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {searchQuery ? `Search: ${searchQuery}` : `${category} Collection`}
            </Text>
            <Text style={styles.countText}>{filteredAndSortedProducts.length} Items</Text>
          </View>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text style={styles.loadingText}>Fetching Masterpieces...</Text>
            </View>
          )}
          {error && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: "#ff4444" }]}>{error}</Text>
            </View>
          )}
        </>
      )}
      ListEmptyComponent={!loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found matching your criteria.</Text>
          {onClearFilters && (
            <TouchableOpacity 
              style={styles.emptyClearBtn}
              onPress={onClearFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyClearBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50, minimumViewTime: 100 }}
      onScrollBeginDrag={handleScrollBegin}
      onMomentumScrollEnd={handleScrollEnd}
      onScrollEndDrag={handleScrollEnd}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      stickyHeaderIndices={stickyHeaderIndices}
      windowSize={5}
      initialNumToRender={6}
      maxToRenderPerBatch={20}
      removeClippedSubviews={Platform.OS === 'android'}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 15,
    paddingBottom: 40,
    backgroundColor: "#291c0e",
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
    marginBottom: 15,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
  },
  title: {
    fontFamily: "TrajanPro",
    fontSize: 20,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingTop: 12,
    paddingBottom: 12,
  },
  countText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  productCard: {
    backgroundColor: "#150d05", // Rich dark luxury background
    borderRadius: 4, // Classic straight edges
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.08)",
    ...Platform.select({
      web: {
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }
    })
  },
  productCardHovered: {
    borderColor: 'rgba(212, 175, 55, 0.6)',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 30px rgba(212, 175, 55, 0.12)',
        transform: 'translateY(-6px)',
      }
    } as any)
  },
  hallmarkBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(21, 13, 5, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderRadius: 2,
    zIndex: 10,
  },
  hallmarkBadgeText: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  imageContainer: {
    position: "relative",
    backgroundColor: "#201409",
  },
  productImage: {
    width: "100%",
    height: 160, // Taller image for better jewelry visibility
  },
  wishlistIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(21, 13, 5, 0.6)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  heart: {
    color: "#fff",
    fontSize: 14,
  },
  heartActive: {
    color: "#D4AF37",
  },
  productInfo: {
    padding: 18,
    paddingTop: 12,
    alignItems: "center", // Symmetric centered details for classic luxury look
  },
  productName: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "TrajanPro", // High-end brand font
    marginBottom: 6,
    letterSpacing: 1,
    textAlign: "center",
  },
  productWeight: {
    color: "#a8927e", // Elegant muted text
    fontSize: 9.5,
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  productPrice: {
    color: "#D4AF37",
    fontSize: 13,
    fontFamily: "TrajanPro",
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 4, // Added margin to space out the button
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyClearBtn: {
    marginTop: 15,
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  emptyClearBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addToCartBtn: {
    marginTop: 12,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    backgroundColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }
    })
  },
  addToCartBtnSuccess: {
    backgroundColor: "#291c0e",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  addToCartBtnText: {
    color: "#291c0e",
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addToCartBtnTextSuccess: {
    color: "#D4AF37",
  }
});

export default ProductList;
