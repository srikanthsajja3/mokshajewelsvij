import React, { useRef, useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Text, Image, TouchableOpacity, useWindowDimensions, ViewStyle, Platform, ActivityIndicator, TextInput, Alert } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../supabase";
import { Product, fetchProductsFromSupabase } from "../data/products";
import { useCountry } from "../contexts/CountryContext";
import { formatPrice } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

interface ProductDetailsScreenProps {
  product: Product;
  onGoHome: () => void;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onPressLogin: () => void;
  onPressCart: () => void;
  onPressOrders: () => void;
  onPressWishlist: () => void;
  onPressProfile: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = (props) => {
  const { product, onBack, onSelectProduct } = props;
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const scrollRef = useRef<ScrollView>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [showAddedMsg, setShowAddedMsg] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const isLargeScreen = width > 768;
  
  const contentStyle: ViewStyle = isLargeScreen 
    ? { width: "100%", alignSelf: "flex-start", flexDirection: "row" as const } 
    : { width: "100%" };

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoadingRecs(true);
      const data = await fetchProductsFromSupabase(product.category);
      // Filter out current product and take top 4
      setRecommendations(data.filter(p => p.id !== product.id).slice(0, 4));
      setLoadingRecs(false);
    };

    const loadReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setReviews(data);
      }
    };

    const checkPurchase = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('order_items')
        .select('id, orders(status)')
        .eq('product_id', product.id)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'delivered');
      
      if (!error && data && data.length > 0) {
        setHasPurchased(true);
      }
    };

    loadRecommendations();
    loadReviews();
    checkPurchase();
    // Scroll to top when product changes
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [product.id, product.category, user]);

  const handleSubmitReview = async () => {
    if (!user) {
      props.onPressLogin();
      return;
    }
    if (!userReview.comment.trim()) {
      Alert.alert("Review Required", "Please share your thoughts on this masterpiece.");
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: product.id,
          rating: userReview.rating,
          comment: userReview.comment
        });

      if (error) throw error;
      
      Alert.alert("Thank You", "Your review has been shared with the community.");
      setUserReview({ rating: 5, comment: "" });
      // Refresh reviews
      const { data: updatedReviews } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      if (updatedReviews) setReviews(updatedReviews);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not post review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBuyNow = () => {
    addToCart(product);
    if (!user) {
      props.onPressLogin();
    } else {
      props.onPressCart();
    }
  };

  const handleAddToCart = () => {
    addToCart(product);
    setShowAddedMsg(true);
    setTimeout(() => setShowAddedMsg(false), 3000);
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      props.onPressLogin();
      return;
    }
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  return (
    <View style={styles.container}>
      <Header {...props} />

      {showAddedMsg ? (
        <View style={styles.addedMessage}>
          <Text style={styles.addedMessageText}>✨ Added to your bag!</Text>
        </View>
      ) : null}

      <ScrollView 
        ref={scrollRef} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <View style={[styles.mainContent, contentStyle]}>
            <View style={[styles.imageColumn, { width: isLargeScreen ? "50%" : "100%" }]}>
              <View style={styles.imageSection}>
                <Image source={{ uri: product.image }} style={styles.mainImage} />
                <TouchableOpacity 
                  style={styles.wishlistIcon} 
                  onPress={handleWishlistToggle}
                >
                  <Text style={[styles.heart, isInWishlist(product.id) && styles.heartActive]}>
                    {isInWishlist(product.id) ? "♥" : "♡"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.infoSection, { width: isLargeScreen ? "50%" : "100%" }]}>
              <Text style={styles.categoryBadge}>{product.category}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productCode}>Product Code: {product.productCode}</Text>
              <Text style={styles.price}>{formatPrice(product.price, countryCode)}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Product Specifications</Text>
                <View style={styles.specTable}>
                  <View style={styles.specTableRow}>
                    <Text style={styles.specTableLabel}>Product</Text>
                    <Text style={styles.specTableValue}>{product.category}</Text>
                  </View>
                  {product.type ? (
                    <View style={styles.specTableRow}>
                      <Text style={styles.specTableLabel}>Type</Text>
                      <Text style={styles.specTableValue}>{product.type}</Text>
                    </View>
                  ) : null}
                  {product.collection ? (
                    <View style={styles.specTableRow}>
                      <Text style={styles.specTableLabel}>Collection</Text>
                      <Text style={styles.specTableValue}>{product.collection}</Text>
                    </View>
                  ) : null}
                  {product.gender ? (
                    <View style={styles.specTableRow}>
                      <Text style={styles.specTableLabel}>Gender</Text>
                      <Text style={styles.specTableValue}>{product.gender}</Text>
                    </View>
                  ) : null}
                  {product.occasion ? (
                    <View style={styles.specTableRow}>
                      <Text style={styles.specTableLabel}>Occasion</Text>
                      <Text style={styles.specTableValue}>{product.occasion}</Text>
                    </View>
                  ) : null}
                  {product.designTheme ? (
                    <View style={styles.specTableRow}>
                      <Text style={styles.specTableLabel}>Design Theme</Text>
                      <Text style={styles.specTableValue}>{product.designTheme}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Metal Details</Text>
                <View style={styles.specTable}>
                  <View style={styles.specTableRow}>
                    <Text style={styles.specTableLabel}>Gold Weight</Text>
                    <Text style={styles.specTableValue}>{product.goldWeight.toFixed(3)} g</Text>
                  </View>
                  <View style={styles.specTableRow}>
                    <Text style={styles.specTableLabel}>Purity</Text>
                    <Text style={styles.specTableValue}>{product.purity}</Text>
                  </View>
                  <View style={styles.specTableRow}>
                    <Text style={styles.specTableLabel}>Metal Color</Text>
                    <Text style={styles.specTableValue}>{product.metalColor}</Text>
                  </View>
                </View>

                {(product.gemstoneType || product.gemstoneWeight) ? (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Stone Details</Text>
                    <View style={styles.specTable}>
                      {product.gemstoneType ? (
                        <View style={styles.specTableRow}>
                          <Text style={styles.specTableLabel}>Gemstone Type</Text>
                          <Text style={styles.specTableValue}>{product.gemstoneType}</Text>
                        </View>
                      ) : null}
                      {product.gemstoneWeight ? (
                        <View style={styles.specTableRow}>
                          <Text style={styles.specTableLabel}>Gemstone Weight</Text>
                          <Text style={styles.specTableValue}>{product.gemstoneWeight.toFixed(3)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price Breakup</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Metal</Text>
                  <Text style={styles.priceValue}>{formatPrice(product.priceBreakup.metal, countryCode)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>VA & Making</Text>
                  <Text style={styles.priceValue}>{formatPrice(product.priceBreakup.vaMaking, countryCode)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Stone, Beeds, Etc</Text>
                  <Text style={styles.priceValue}>{formatPrice(product.priceBreakup.stoneBeads, countryCode)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Tax</Text>
                  <Text style={styles.priceValue}>{formatPrice(product.priceBreakup.tax, countryCode)}</Text>
                </View>
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatPrice(product.price, countryCode)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.actionButton} onPress={handleBuyNow}>
                <Text style={styles.actionButtonText}>Buy Now</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.addToCartButton]} onPress={handleAddToCart}>
                <Text style={styles.addToCartButtonText}>Add to Bag</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleWishlistToggle}>
                <Text style={styles.secondaryButtonText}>
                  {isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onBack}>
                <Text style={styles.secondaryButtonText}>Back to Collections</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Community Reviews</Text>
            
            {hasPurchased ? (
              <View style={styles.reviewForm}>
                <Text style={styles.formLabel}>Share your experience</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setUserReview({ ...userReview, rating: star })}>
                      <FontAwesome5 
                        name="star" 
                        solid={star <= userReview.rating} 
                        size={20} 
                        color={star <= userReview.rating ? "#D4AF37" : "#4a3520"} 
                        style={{ marginRight: 10 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Write your review here..."
                  placeholderTextColor="#666"
                  multiline
                  value={userReview.comment}
                  onChangeText={(text) => setUserReview({ ...userReview, comment: text })}
                />
                <TouchableOpacity 
                  style={[styles.submitBtn, submittingReview && { opacity: 0.7 }]} 
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.submitBtnText}>Post Review</Text>}
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.reviewsList}>
              {reviews.length === 0 ? (
                <Text style={styles.emptyReviews}>Be the first to review this masterpiece.</Text>
              ) : (
                reviews.map((rev) => (
                  <View key={rev.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{rev.profiles?.full_name || "Anonymous"}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FontAwesome5 
                            key={s} 
                            name="star" 
                            solid={s <= rev.rating} 
                            size={10} 
                            color={s <= rev.rating ? "#D4AF37" : "#4a3520"} 
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                    <Text style={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Recommendations Section */}
          {recommendations.length > 0 ? (
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationTitle}>Recommended for You</Text>
              <View style={styles.recommendationGrid}>
                {recommendations.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.recommendationCard}
                    onPress={() => onSelectProduct(item)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.image }} style={styles.recImage} />
                    <View style={styles.recInfo}>
                      <Text style={styles.recName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.recPrice}>{formatPrice(item.price, countryCode)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <Footer />
      </ScrollView>
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
  addedMessage: {
    backgroundColor: "#D4AF37",
    paddingVertical: 10,
    alignItems: "center",
    position: "absolute",
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  addedMessageText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  mainContent: {
    padding: 20,
    gap: 30,
  },
  imageColumn: {
    gap: 20,
  },
  imageSection: {
    borderRadius: 15,
    height: 400,
    overflow: "hidden",
    backgroundColor: "#3d2b1a",
    borderWidth: 1,
    borderColor: "#4a3520",
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  wishlistIcon: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  heart: {
    color: "#fff",
    fontSize: 24,
  },
  heartActive: {
    color: "#D4AF37",
  },
  infoSection: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  categoryBadge: {
    color: "#D4AF37",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  productName: {
    fontFamily: "TrajanPro",
    fontSize: 28,
    color: "#fff",
    marginBottom: 5,
  },
  productCode: {
    color: "#888",
    fontSize: 12,
    marginBottom: 15,
    letterSpacing: 1,
  },
  price: {
    fontSize: 24,
    color: "#D4AF37",
    fontWeight: "bold",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#4a3520",
    marginVertical: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "TrajanPro",
    color: "#fff",
    fontSize: 16,
    marginBottom: 15,
    letterSpacing: 1,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  specLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  specValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  specTable: {
    borderWidth: 1,
    borderColor: "#4a3520",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  specTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#4a3520",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  specTableLabel: {
    flex: 1,
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  specTableValue: {
    flex: 1.5,
    color: "#fff",
    fontSize: 13,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  priceValue: {
    color: "#fff",
    fontSize: 14,
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#4a3520",
  },
  totalLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "bold",
  },
  actionButton: {
    backgroundColor: "#D4AF37",
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  actionButtonText: {
    color: "#291c0e",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addToCartButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  addToCartButtonText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4a3520",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  recommendationsSection: {
    padding: 20,
    marginTop: 20,
  },
  recommendationTitle: {
    fontFamily: "TrajanPro",
    fontSize: 20,
    color: "#fff",
    marginBottom: 20,
    letterSpacing: 1,
  },
  recommendationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  recommendationCard: {
    width: Platform.OS === 'web' ? '22%' : '47%',
    backgroundColor: "#3d2b1a",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4a3520",
    marginBottom: 10,
  },
  recImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  recInfo: {
    padding: 10,
  },
  recName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  recPrice: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "600",
  },
  // Review Styles
  reviewsSection: {
    padding: 20,
    marginTop: 10,
  },
  reviewForm: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    marginBottom: 30,
  },
  formLabel: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
  },
  ratingRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: "#3d2b1a",
    color: "#fff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4a3520",
    height: 100,
    textAlignVertical: "top",
    marginBottom: 15,
  },
  submitBtn: {
    backgroundColor: "#D4AF37",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#000",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  reviewsList: {
    gap: 20,
  },
  reviewCard: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.1)",
    paddingBottom: 20,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewDate: {
    color: "#666",
    fontSize: 10,
  },
  emptyReviews: {
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  }
});

export default ProductDetailsScreen;
