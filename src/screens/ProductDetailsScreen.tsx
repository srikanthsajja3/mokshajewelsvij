import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { StyleSheet, View, ScrollView, Text, Image, TouchableOpacity, useWindowDimensions, ViewStyle, Platform, ActivityIndicator, TextInput, Alert, Animated, Modal, SafeAreaView } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import ImageViewer from 'react-native-image-zoom-viewer';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../supabase";
import { Product, fetchProductsFromSupabase } from "../data/products";
import { useCountry } from "../contexts/CountryContext";
import { formatPrice } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";

import { useNavigation, useRoute, RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

import { useUI } from "../contexts/UIContext";

import { fetchProductById } from "../data/products";

interface ProductDetailsScreenProps {
  scrollY?: Animated.Value;
}

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({ scrollY: scrollYProp }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetails'>>();
  const [product, setProduct] = useState<Product | null>(route.params?.product || null);
  const [fetchingProduct, setFetchingProduct] = useState(!route.params?.product && !!route.params?.id);
  const { setLoginVisible } = useUI();

  const localScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = scrollYProp || localScrollY;

  useEffect(() => {
    const loadProduct = async () => {
      if (!product && route.params?.id) {
        setFetchingProduct(true);
        try {
          const fetched = await fetchProductById(route.params.id);
          setProduct(fetched);
        } catch (err) {
          console.error("Error fetching product for deep link:", err);
        } finally {
          setFetchingProduct(false);
        }
      }
    };
    loadProduct();
  }, [route.params?.id]);

  const onBack = () => navigation.goBack();
  const onSelectProduct = (newProduct: Product) => navigation.navigate('ProductDetails', { id: newProduct.id });
  
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const scrollRef = useRef<any>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [showAddedMsg, setShowAddedMsg] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const [activeImageIndex, setActiveIndex] = useState(0);

  const allImages = useMemo(() => {
    if (!product) return [];
    const images = [product.image];
    if (product.galleryUrls && Array.isArray(product.galleryUrls)) {
      images.push(...product.galleryUrls);
    }
    return images.filter(img => !!img);
  }, [product?.image, product?.galleryUrls]);

  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const itemWidth = isLargeScreen ? (width * 0.5 - 40) : (width - 40);
    const index = Math.round(scrollPosition / itemWidth);
    if (index !== activeImageIndex) {
      setActiveIndex(index);
    }
  };

  const isLargeScreen = width > 700;
  
  const contentStyle: ViewStyle = isLargeScreen 
    ? { width: "100%", alignSelf: "flex-start", flexDirection: "row" as const } 
    : { width: "100%" };

  // Generate Image URLs for the ImageViewer
  const viewerImages = useMemo(() => {
    return allImages.map(url => ({ url }));
  }, [allImages]);

  useEffect(() => {
    setActiveIndex(0); // Reset index on product change
    
    // Safety check if product is null
    if (!product || !product.id || !product.category) return;

    const loadRecommendations = async () => {
      setLoadingRecs(true);
      const data = await fetchProductsFromSupabase(product.category);
      // Filter out current product and take top 4
      setRecommendations(data.filter(p => p.id !== product.id).slice(0, 4));
      setLoadingRecs(false);
    };

    loadRecommendations();
  }, [product?.id, product?.category]);

  useEffect(() => {
    if (!product?.id) return;
    
    const loadReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, profiles(full_name)')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setReviews(data);
        }
      } catch (err) {
        console.warn("Error loading reviews:", err);
      }
    };

    const checkPurchase = async () => {
      if (!user?.id) {
        setHasPurchased(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('id, orders(status)')
          .eq('product_id', product.id)
          .eq('orders.user_id', user.id)
          .eq('orders.status', 'delivered');
        
        if (!error && data && data.length > 0) {
          setHasPurchased(true);
        } else {
          setHasPurchased(false);
        }
      } catch (err) {
        console.warn("Error checking purchase status:", err);
        setHasPurchased(false);
      }
    };

    loadReviews();
    checkPurchase();
  }, [product?.id, user?.id]);

  useEffect(() => {
    // Scroll to top when product changes
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [product?.id]);

  const handleSubmitReview = async () => {
    if (!user) {
      setLoginVisible(true);
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

  const handleWhatsAppEnquiry = () => {
    const phoneNumber = "919922244439";
    const message = `Namaste Moksha Jewels! I am interested in this masterpiece:
    
Product: ${product.name}
ID: ${product.id}
Code: ${product.productCode}
Category: ${product.category}

Please provide more details regarding this item.`;
    
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      import('expo-linking').then(Linking => {
        Linking.openURL(url);
      });
    }
  };

  const handleAddToCart = () => {
    // Feature disabled for launch
    Alert.alert("Launch Phase", "For our initial launch, we are accepting enquiries directly via WhatsApp. Please use the 'Enquire on WhatsApp' button.");
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      setLoginVisible(true);
      return;
    }
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const [activeSection, setActiveSection] = useState<string | null>("specs");
  const [zoomData, setZoomData] = useState({ visible: false, x: 0, y: 0 });

  const handleMouseMove = (e: any) => {
    if (!isLargeScreen || Platform.OS !== 'web') return;
    
    // Use client coordinates relative to the element's bounding box for stability
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomData({ visible: true, x, y });
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const AccordionSection = ({ 
    id, 
    title, 
    children 
  }: { 
    id: string; 
    title: string; 
    children: React.ReactNode 
  }) => {
    const isOpen = activeSection === id;
    return (
      <View style={styles.accordionItem}>
        <TouchableOpacity 
          style={styles.accordionHeader} 
          onPress={() => toggleSection(id)}
          activeOpacity={0.7}
        >
          <Text style={styles.accordionTitle}>{title}</Text>
          <FontAwesome5 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={12} 
            color="#D4AF37" 
          />
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.accordionContent}>
            {children}
          </View>
        )}
      </View>
    );
  };

  if (fetchingProduct) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Unveiling Masterpiece...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Masterpiece not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAddedMsg ? (
        <View style={styles.addedMessage}>
          <Text style={styles.addedMessageText}>✨ Added to your bag!</Text>
        </View>
      ) : null}

      <Animated.ScrollView 
        ref={scrollRef} 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <View style={[styles.mainContent, contentStyle]}>
            <View style={[styles.imageColumn, { width: isLargeScreen ? "50%" : "100%" }]}>
              <View style={styles.imageSection}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {allImages.map((img, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.imageWrapper, { width: isLargeScreen ? (width * 0.5 - 40) : (width - 40) }]}
                      activeOpacity={1}
                      // @ts-ignore
                      onMouseMove={handleMouseMove}
                      // @ts-ignore
                      onMouseLeave={() => setZoomData({ ...zoomData, visible: false })}
                      onPress={() => {
                        setActiveIndex(index);
                        setIsViewerVisible(true);
                      }}
                    >
                      <Image source={{ uri: img }} style={styles.mainImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {allImages.length > 1 && (
                  <View style={styles.pagination}>
                    {allImages.map((_, i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.dot, 
                          activeImageIndex === i && styles.activeDot
                        ]} 
                      />
                    ))}
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.wishlistIcon} 
                  onPress={handleWishlistToggle}
                >
                  <Text style={[styles.heart, isInWishlist(product.id) && styles.heartActive]}>
                    {isInWishlist(product.id) ? "♥" : "♡"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Full Screen Image Viewer Modal */}
              <Modal visible={isViewerVisible} transparent={true} onRequestClose={() => setIsViewerVisible(false)}>
                <ImageViewer 
                  imageUrls={viewerImages}
                  index={activeImageIndex}
                  onSwipeDown={() => setIsViewerVisible(false)}
                  enableSwipeDown={true}
                  renderHeader={() => (
                    <SafeAreaView>
                      <TouchableOpacity 
                        style={{ position: 'absolute', top: 20, right: 20, zIndex: 9999, padding: 10 }} 
                        onPress={() => setIsViewerVisible(false)}
                      >
                        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
                      </TouchableOpacity>
                    </SafeAreaView>
                  )}
                />
              </Modal>

              {/* Zoom Overlay for Web (Moved outside imageSection to avoid clipping) */}
              {Platform.OS === 'web' && zoomData.visible && isLargeScreen && (
                <View style={[styles.zoomOverlay, { 
                  left: "105%", // Position it to the right of the image column
                  top: 0,
                }]}>
                  <View style={[styles.zoomedImage, {
                    backgroundImage: `url(${allImages[activeImageIndex]})`,
                    backgroundPosition: `${zoomData.x}% ${zoomData.y}%`,
                  }]} />
                </View>
              )}

              {/* Action Buttons under Image */}
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleWhatsAppEnquiry}>
                  <Text style={styles.actionButtonText}>Enquire on WhatsApp</Text>
                </TouchableOpacity>

                {/* Add to Bag removed for launch */}
              </View>
            </View>

            <View style={[styles.infoSection, { width: isLargeScreen ? "50%" : "100%" }]}>
              <Text style={styles.categoryBadge}>{product.category}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productCode}>Product Code: {product.productCode}</Text>
              <Text style={styles.price}>{formatPrice(product.price, countryCode)}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.section}>
                <AccordionSection id="specs" title="Product Specifications">
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
                </AccordionSection>

                <AccordionSection id="metal" title="Metal Details">
                  <View style={styles.specTable}>
                    <View style={styles.specTableRow}>
                      <Text style={styles.specTableLabel}>Gold Weight</Text>
                      <Text style={styles.specTableValue}>{(product.goldWeight || 0).toFixed(3)} g</Text>
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
                </AccordionSection>

                {(product.gemstoneType || product.gemstoneWeight) ? (
                  <AccordionSection id="stone" title="Stone Details">
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
                          <Text style={styles.specTableValue}>{(product.gemstoneWeight || 0).toFixed(3)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </AccordionSection>
                ) : null}

                <AccordionSection id="price" title="Price Breakup">
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Metal</Text>
                    <Text style={styles.priceValue}>{formatPrice(product.priceBreakup?.metal || 0, countryCode)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>VA & Making</Text>
                    <Text style={styles.priceValue}>{formatPrice(product.priceBreakup?.vaMaking || 0, countryCode)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Stone, Beeds, Etc</Text>
                    <Text style={styles.priceValue}>{formatPrice(product.priceBreakup?.stoneBeads || 0, countryCode)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tax</Text>
                    <Text style={styles.priceValue}>{formatPrice(product.priceBreakup?.tax || 0, countryCode)}</Text>
                  </View>
                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatPrice(product.price || 0, countryCode)}</Text>
                  </View>
                </AccordionSection>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleWishlistToggle}>
                <Text style={styles.secondaryButtonText}>
                  {isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                </Text>
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
      </Animated.ScrollView>
    </View>
  );
};

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
  loadingText: {
    marginTop: 10,
    color: "#D4AF37",
    fontFamily: "TrajanPro",
    fontSize: 16,
    letterSpacing: 1,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
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
    position: "relative", // Crucial for absolute positioning of the zoom overlay
    zIndex: 10,
  },
  imageSection: {
    borderRadius: 15,
    height: 320,
    overflow: "hidden",
    backgroundColor: "#3d2b1a",
    borderWidth: 1,
    borderColor: "#4a3520",
    position: "relative",
  },
  imageWrapper: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#D4AF37',
    width: 12, // Slightly wider for active
  },
  imageActions: {
    marginTop: 20,
    gap: 10,
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
  zoomOverlay: {
    position: "absolute",
    top: 0,
    width: 400,
    height: 400,
    backgroundColor: "#3d2b1a",
    borderWidth: 2,
    borderColor: "#D4AF37",
    borderRadius: 8,
    zIndex: 1000,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
    // @ts-ignore
    pointerEvents: "none", // Prevent overlay from intercepting mouse events
  },
  zoomedImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff", // Fallback color
    // @ts-ignore
    backgroundRepeat: 'no-repeat',
    // @ts-ignore
    backgroundSize: '400%', // Increased zoom level for better detail
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
  arButton: {
    backgroundColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  arButtonContent: {
    flexDirection: "row",
    alignItems: "center",
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
  // Accordion Styles
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
    marginBottom: 5,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  accordionTitle: {
    fontFamily: "TrajanPro",
    color: "#fff",
    fontSize: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  accordionContent: {
    paddingBottom: 15,
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
