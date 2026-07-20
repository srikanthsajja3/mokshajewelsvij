import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, useWindowDimensions, ViewStyle, Platform, ActivityIndicator, TextInput, Alert, Animated, Modal, SafeAreaView } from "react-native";
import { Image } from "expo-image";
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import ImageViewer from 'react-native-image-zoom-viewer';
import Header from "../components/Header";
import Footer from "../components/Footer";
import OptimizedImage from "../components/OptimizedImage";
import ProductImageGallery from "../components/ProductImageGallery";
import { StoreAvailabilityModal } from "../components/StoreAvailabilityModal";
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
import { useGoldRate } from "../contexts/GoldRateContext";
import { fetchProductById } from "../data/products";

interface ProductDetailsScreenProps {
  scrollY?: Animated.Value;
}

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({ scrollY: scrollYProp }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetails'>>();
  const [product, setProduct] = useState<Product | null>(route.params?.product || null);
  const [fetchingProduct, setFetchingProduct] = useState(!route.params?.product && !!route.params?.id);
  const { setLoginVisible, scrollY: globalScrollY } = useUI();

  const localScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = scrollYProp || globalScrollY || localScrollY;

  const handleMainScroll = (event: any) => {
    // Manually set the value to avoid mapping issues on web
    scrollY.setValue(event.nativeEvent.contentOffset.y);
  };

  useEffect(() => {
    const loadProduct = async () => {
      const routeId = route.params?.id;
      if (routeId && (!product || product.id !== routeId)) {
        setFetchingProduct(true);
        try {
          const fetched = await fetchProductById(routeId);
          setProduct(fetched);
        } catch (err) {
          console.error("Error fetching product:", err);
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
  const [suiteItems, setSuiteItems] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [showAddedMsg, setShowAddedMsg] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  // Dynamic Gold Rate Purity & Pricing states
  const { rates, getLocalizedRate } = useGoldRate();
  const [selectedPurity, setSelectedPurity] = useState<string>("22K");
  const [engravingText, setEngravingText] = useState<string>("");
  const [priceAlertSubscribed, setPriceAlertSubscribed] = useState<boolean>(false);
  const [selectedSize, setSelectedSize] = useState<number>(7);
  const [isSizeFinderVisible, setIsSizeFinderVisible] = useState<boolean>(false);
  const [isStoreCheckVisible, setIsStoreCheckVisible] = useState<boolean>(false);
  const [isSuiteModalVisible, setIsSuiteModalVisible] = useState<boolean>(false);
  const [sizeFinderDiameter, setSizeFinderDiameter] = useState<number>(17.3); // Default size 7 has 17.3mm diameter
  const [addGiftWrapping, setAddGiftWrapping] = useState<boolean>(false);
  const [giftMessage, setGiftMessage] = useState<string>("");
  const [giftOptionsExpanded, setGiftOptionsExpanded] = useState<boolean>(false);

  const jewelryType = useMemo(() => {
    if (!product) return "";
    return (product.type || product.name || '').toLowerCase();
  }, [product]);

  const suiteText = useMemo(() => {
    if (!product) return { title: "Complete the Suite", subtitle: "Pair this masterpiece with coordinating items designed to match" };
    
    const currentLowerName = product.name.toLowerCase();
    const currentType = (product.type || "").toLowerCase();
    
    const isEarring = currentType.includes("earring") || currentLowerName.includes("earring") || currentLowerName.includes("studs");
    const isNecklace = currentType.includes("necklace") || currentLowerName.includes("necklace") || currentType.includes("pendant") || currentLowerName.includes("pendant");
    const isRing = currentType.includes("ring") || currentLowerName.includes("ring");
    const isBracelet = currentType.includes("bracelet") || currentLowerName.includes("bracelet") || currentType.includes("bangle") || currentLowerName.includes("bangle") || currentLowerName.includes("bangles");
    
    if (isEarring) {
      return {
        title: "Complete the Look",
        subtitle: "Pair these earrings with a coordinating necklace designed to match"
      };
    } else if (isNecklace) {
      return {
        title: "Complete the Look",
        subtitle: "Pair this necklace with coordinating earrings designed to match"
      };
    } else if (isRing) {
      return {
        title: "Complete the Suite",
        subtitle: "Pair this ring with coordinating bracelets designed to match"
      };
    } else if (isBracelet) {
      return {
        title: "Complete the Suite",
        subtitle: "Pair this bracelet with a coordinating ring designed to match"
      };
    }
    
    return {
      title: "Complete the Suite",
      subtitle: "Pair this masterpiece with coordinating items designed to match"
    };
  }, [product]);

  useEffect(() => {
    if (product) {
      let p = product.purity || "22K";
      p = p.replace(/\s+/g, "").toUpperCase();
      if (p.endsWith("KT")) p = p.slice(0, -2) + "K";
      setSelectedPurity(p);
    }
  }, [product]);

  const dynamicPriceInfo = useMemo(() => {
    if (!product || !selectedPurity) return null;
    
    const cleanedPurity = selectedPurity.replace(/\s+/g, "").toUpperCase();
    const targetRateObj = rates.find(r => r.purity.replace(/\s+/g, "").toUpperCase() === cleanedPurity || r.purity.replace(/\s+/g, "").toUpperCase() === cleanedPurity.replace("KT", "K"));
    
    // Fallback gold rates if fetch failed or loading
    const baseRatePerGram = targetRateObj ? targetRateObj.rate : (cleanedPurity.startsWith("18") ? 75 * 0.75 : 75 * 0.9167);
    
    const metalCost = product.goldWeight * baseRatePerGram;
    const vaMaking = product.priceBreakup?.vaMaking || 0;
    const stoneBeads = product.priceBreakup?.stoneBeads || 0;
    const tax = product.priceBreakup?.tax || 0;
    
    let total = metalCost + vaMaking + stoneBeads + tax;
    if (addGiftWrapping) {
      total += 10.00; // Gift wrap fee
    }
    
    return {
      metalCost,
      vaMaking,
      stoneBeads,
      tax,
      total
    };
  }, [product, selectedPurity, rates, addGiftWrapping]);

  const handlePriceAlertToggle = () => {
    setPriceAlertSubscribed(prev => !prev);
    Alert.alert(
      !priceAlertSubscribed ? "Alert Set" : "Alert Off",
      !priceAlertSubscribed 
        ? "We'll notify you if the price of this item drops based on live gold market changes!"
        : "You have unsubscribed from price drop notifications for this item."
    );
  };

  const handleShareRegistry = () => {
    Alert.alert(
      "Share Registry Item",
      "Product link copied! Share this with friends or family so they know what you'd like on your registry."
    );
  };

  const handleWhatsAppConsultation = () => {
    Alert.alert(
      "Live Jeweler Consultation",
      "Opening WhatsApp to connect you with our lead jewelry consultant..."
    );
  };

  const allImages = useMemo(() => {
    if (!product) return [];
    const images = [product.image];
    if (product.galleryUrls && Array.isArray(product.galleryUrls)) {
      images.push(...product.galleryUrls);
    }
    return images.filter(img => !!img);
  }, [product?.image, product?.galleryUrls]);

  const isLargeScreen = width > 700;

  const thumbnailWidth = 64;
  const thumbnailSpacing = 12;
  const mainImageWidth = isLargeScreen 
    ? (width * 0.5 - 40) - (allImages.length > 1 ? (thumbnailWidth + thumbnailSpacing) : 0)
    : (width - 40);

  const isARSupported = useMemo(() => {
    return !!product && !!product.image;
  }, [product]);
  
  const contentStyle: ViewStyle = isLargeScreen 
    ? { width: "100%", alignSelf: "flex-start", flexDirection: "row" as const } 
    : { width: "100%" };

  // Generate Image URLs for the ImageViewer
  const viewerImages = useMemo(() => {
    return allImages.map(url => ({ url }));
  }, [allImages]);

  useEffect(() => {
    // Safety check if product is null
    if (!product || !product.id || !product.category) return;

    const loadRecommendations = async () => {
      setLoadingRecs(true);
      try {
        const data = await fetchProductsFromSupabase("All");
        
        // Find explicitly linked matching products (both directions: direct and reverse)
        const explicitMatches = data.filter(p => {
          if (p.id === product.id) return false;
          const isDirectMatch = product.matchingProductId && p.id === product.matchingProductId;
          const isReverseMatch = p.matchingProductId && p.matchingProductId === product.id;
          return isDirectMatch || isReverseMatch;
        });

        const finalSuiteItems = explicitMatches;

        // Recommendations: same category products as fallback
        const categoryMates = data.filter(p => p.category === product.category && p.id !== product.id);
        
        // Merge suite items and category mates, avoiding duplicates
        const combined = [...finalSuiteItems];
        categoryMates.forEach(item => {
          if (!combined.some(c => c.id === item.id)) {
            combined.push(item);
          }
        });

        setRecommendations(combined.slice(0, 6));
        setSuiteItems(finalSuiteItems.slice(0, 4));
      } catch (err) {
        console.error("Error loading recommendations:", err);
      } finally {
        setLoadingRecs(false);
      }
    };

    loadRecommendations();
  }, [product?.id, product?.category, product?.matchingProductId]);

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
      if (!user?.id || !product?.id) {
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
    setIsSuiteModalVisible(false);
  }, [product?.id]);

  useEffect(() => {
    if (suiteItems && suiteItems.length > 0) {
      const timer = setTimeout(() => {
        setIsSuiteModalVisible(true);
      }, 7000); // 7 seconds delay
      return () => clearTimeout(timer);
    }
  }, [suiteItems]);

  const handleSubmitReview = async () => {
    if (!user) {
      setLoginVisible(true);
      return;
    }
    if (!product?.id) return;
    
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
    if (product) addToCart(product);
    if (!user) {
      setLoginVisible(true);
    } else {
      navigation.navigate('Cart');
    }
  };

  const handleAddToCart = () => {
    if (product) addToCart(product);
    setShowAddedMsg(true);
    setTimeout(() => setShowAddedMsg(false), 3000);
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      setLoginVisible(true);
      return;
    }
    if (!product?.id) return;
    
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const [activeSection, setActiveSection] = useState<string | null>("specs");
  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };
  const navigateToCategory = (cat: string) => navigation.navigate('Category', { category: cat });

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
              <ProductImageGallery
                allImages={allImages}
                mainImageWidth={mainImageWidth}
                isLargeScreen={isLargeScreen}
                isInWishlist={isInWishlist(product.id)}
                onWishlistToggle={handleWishlistToggle}
              />

              {/* Action Buttons under Image */}
              <View style={[styles.imageActions, { 
                marginLeft: isLargeScreen && allImages.length > 1 ? (thumbnailWidth + thumbnailSpacing) : 0,
                width: mainImageWidth,
              }]}>
                {isARSupported && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.arButton]} 
                    onPress={() => navigation.navigate('ARTryOn', { product })}
                  >
                    <View style={styles.arButtonContent}>
                      <FontAwesome5 name="camera" size={16} color="#291c0e" style={{ marginRight: 10 }} />
                      <Text style={styles.actionButtonText}>Virtual Try-On (AR)</Text>
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionButton} onPress={handleBuyNow}>
                  <Text style={styles.actionButtonText}>Buy Now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.addToCartButton]} onPress={handleAddToCart}>
                  <Text style={styles.addToCartButtonText}>Add to Bag</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.infoSection, { width: isLargeScreen ? "50%" : "100%" }]}>
              <Text style={styles.categoryBadge}>{product.category}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productCode}>Product Code: {product.productCode}</Text>
              
              {/* Dynamic Price Display, Split Payments, and Price Drop Alert */}
              <View style={styles.priceContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.price}>
                    {formatPrice(dynamicPriceInfo?.total || product.price, countryCode)}
                  </Text>
                  <View style={styles.splitPaymentContainer}>
                    <FontAwesome5 name="credit-card" size={10} color="#D4AF37" style={{ marginRight: 6 }} />
                    <Text style={styles.splitPaymentText}>
                      Or 3 splits of <Text style={styles.splitPaymentHighlight}>{formatPrice((dynamicPriceInfo?.total || product.price) / 3, countryCode)}/mo</Text>
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.priceAlertBtn, priceAlertSubscribed && styles.priceAlertBtnActive]} 
                  onPress={handlePriceAlertToggle}
                >
                  <FontAwesome5 
                    name="bell" 
                    size={12} 
                    color={priceAlertSubscribed ? "#291c0e" : "#D4AF37"} 
                    solid={priceAlertSubscribed}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.priceAlertText, priceAlertSubscribed && styles.priceAlertActiveText]}>
                    {priceAlertSubscribed ? "Alert On" : "Price Alert"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />

              {/* Product Configurations section */}
              <View style={styles.configContainer}>
                {/* 1. Gold Purity Swapper */}
                <View style={styles.configSection}>
                  <Text style={styles.configTitle}>Gold Purity</Text>
                  <View style={styles.purityRow}>
                    {['18K', '22K'].map((purity) => (
                      <TouchableOpacity
                        key={purity}
                        style={[styles.purityBadge, selectedPurity === purity && styles.activePurityBadge]}
                        onPress={() => setSelectedPurity(purity)}
                      >
                        <Text style={[styles.purityText, selectedPurity === purity && styles.activePurityText]}>
                          {purity} Gold
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 2. Size Selector & Interactive Finder */}
                {jewelryType.includes('ring') && (
                  <View style={styles.configSection}>
                    <View style={styles.sizeHeaderRow}>
                      <Text style={styles.configTitle}>Ring Size</Text>
                      <TouchableOpacity onPress={() => setIsSizeFinderVisible(true)}>
                        <Text style={styles.sizeFinderLink}>📐 Find My Size</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.sizeRow}>
                      {[6, 7, 8, 9, 10].map((sz) => (
                        <TouchableOpacity
                          key={sz}
                          style={[styles.sizeBadge, selectedSize === sz && styles.activeSizeBadge]}
                          onPress={() => setSelectedSize(sz)}
                        >
                          <Text style={[styles.sizeText, selectedSize === sz && styles.activeSizeText]}>
                            {sz}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* 3. Engraving Preview */}
                {(jewelryType.includes('ring') || jewelryType.includes('pendant') || jewelryType.includes('necklace')) && (
                  <View style={styles.configSection}>
                    <Text style={styles.configTitle}>Custom Engraving (Free)</Text>
                    <TextInput
                      style={styles.engravingInput}
                      placeholder="Type initials or a message to engrave..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      maxLength={15}
                      value={engravingText}
                      onChangeText={setEngravingText}
                    />
                    {engravingText.length > 0 && (
                      <View style={styles.engravingPreview}>
                        <Text style={styles.engravingPreviewLabel}>Laser Engraving Preview:</Text>
                        <View style={styles.ringPreviewBand}>
                          <Text style={styles.ringPreviewText}>{engravingText}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>

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
                  {/* Visual Stacked Bar Chart */}
                  <View style={styles.priceChartContainer}>
                    <View style={styles.chartStack}>
                      <View style={[styles.chartBar, { flex: Math.max(1, dynamicPriceInfo?.metalCost || 0), backgroundColor: '#D4AF37' }]} />
                      <View style={[styles.chartBar, { flex: Math.max(1, dynamicPriceInfo?.vaMaking || 0), backgroundColor: '#4a3520' }]} />
                      <View style={[styles.chartBar, { flex: Math.max(1, dynamicPriceInfo?.stoneBeads || 0), backgroundColor: '#ffffff' }]} />
                      <View style={[styles.chartBar, { flex: Math.max(1, dynamicPriceInfo?.tax || 0), backgroundColor: '#777777' }]} />
                    </View>
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#D4AF37' }]} />
                        <Text style={styles.legendText}>Gold: {formatPrice(dynamicPriceInfo?.metalCost || 0, countryCode)}</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4a3520' }]} />
                        <Text style={styles.legendText}>Making: {formatPrice(dynamicPriceInfo?.vaMaking || 0, countryCode)}</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#ffffff' }]} />
                        <Text style={styles.legendText}>Stones: {formatPrice(dynamicPriceInfo?.stoneBeads || 0, countryCode)}</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#777777' }]} />
                        <Text style={styles.legendText}>Tax: {formatPrice(dynamicPriceInfo?.tax || 0, countryCode)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.divider, { marginVertical: 15 }]} />

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Metal Cost ({selectedPurity})</Text>
                    <Text style={styles.priceValue}>{formatPrice(dynamicPriceInfo?.metalCost || 0, countryCode)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>VA & Making Charges</Text>
                    <Text style={styles.priceValue}>{formatPrice(dynamicPriceInfo?.vaMaking || 0, countryCode)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Gemstones & Beads</Text>
                    <Text style={styles.priceValue}>{formatPrice(dynamicPriceInfo?.stoneBeads || 0, countryCode)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tax & GST (3%)</Text>
                    <Text style={styles.priceValue}>{formatPrice(dynamicPriceInfo?.tax || 0, countryCode)}</Text>
                  </View>
                  {addGiftWrapping && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Luxury Wrapping Fee</Text>
                      <Text style={styles.priceValue}>{formatPrice(10.00, countryCode)}</Text>
                    </View>
                  )}
                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Price</Text>
                    <Text style={styles.totalValue}>{formatPrice(dynamicPriceInfo?.total || product.price, countryCode)}</Text>
                  </View>
                </AccordionSection>
              </View>

              <View style={styles.divider} />

              {/* Check Store Availability */}
              <TouchableOpacity 
                style={[styles.actionButton, styles.storeCheckButton]} 
                onPress={() => setIsStoreCheckVisible(true)}
              >
                <FontAwesome5 name="store" size={14} color="#D4AF37" style={{ marginRight: 10 }} />
                <Text style={styles.storeCheckButtonText}>Check Store Availability</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleWishlistToggle}>
                <Text style={styles.secondaryButtonText}>
                  {isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                </Text>
              </TouchableOpacity>

              {/* Gifting & Collaboration Card */}
              <View style={styles.giftCard}>
                <TouchableOpacity 
                  style={styles.giftCardHeader} 
                  onPress={() => setGiftOptionsExpanded(!giftOptionsExpanded)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome5 name="gift" size={14} color="#D4AF37" style={{ marginRight: 8 }} />
                    <Text style={styles.giftCardTitle}>Luxury Gift Packaging & Card (+ $10.00)</Text>
                  </View>
                  <FontAwesome5 
                    name={giftOptionsExpanded ? "chevron-up" : "chevron-down"} 
                    size={10} 
                    color="#D4AF37" 
                  />
                </TouchableOpacity>
                {giftOptionsExpanded && (
                  <View style={styles.giftCardContent}>
                    <TouchableOpacity 
                      style={styles.giftCheckboxRow}
                      onPress={() => setAddGiftWrapping(!addGiftWrapping)}
                    >
                      <View style={[styles.customCheckbox, addGiftWrapping && styles.customCheckboxChecked]}>
                        {addGiftWrapping && <FontAwesome5 name="check" size={8} color="#291c0e" />}
                      </View>
                      <Text style={styles.giftCheckboxText}>Add Premium Velvet Box & Gift Wrap</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.giftMsgLabel}>Add Handwritten Note (Optional):</Text>
                    <TextInput
                      style={styles.giftMsgInput}
                      placeholder="E.g. With love, today and always..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      multiline
                      numberOfLines={2}
                      value={giftMessage}
                      onChangeText={setGiftMessage}
                    />
                  </View>
                )}
              </View>

              {/* Engagement Controls */}
              <View style={styles.engagementRow}>
                <TouchableOpacity style={styles.engagementBtn} onPress={handleShareRegistry}>
                  <FontAwesome5 name="share-alt" size={12} color="#D4AF37" style={{ marginRight: 6 }} />
                  <Text style={styles.engagementBtnText}>Share Registry</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.engagementBtn, styles.whatsappConsultBtn]} onPress={handleWhatsAppConsultation}>
                  <FontAwesome5 name="whatsapp" size={12} color="#25D366" style={{ marginRight: 6 }} />
                  <Text style={[styles.engagementBtnText, { color: '#25D366' }]}>Live Jeweler</Text>
                </TouchableOpacity>
              </View>
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
              <View style={styles.recHeader}>
                <Text style={styles.recommendationTitle}>Recommended for You</Text>
                <TouchableOpacity onPress={() => navigateToCategory(product.category)}>
                  <Text style={styles.viewMoreHeader}>View All ❯</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recScrollContent}
              >
                {recommendations.slice(0, 6).map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.recommendationCard}
                    onPress={() => onSelectProduct(item)}
                    activeOpacity={0.8}
                  >
                    <OptimizedImage url={item.image} style={styles.recImage} shouldLoad={true} />
                    <View style={styles.recInfo}>
                      <Text style={styles.recName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.recPrice}>{formatPrice(item.price, countryCode)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* View More Card at the end of scroll */}
                <TouchableOpacity 
                  style={[styles.recommendationCard, styles.viewMoreCard]}
                  onPress={() => navigateToCategory(product.category)}
                  activeOpacity={0.8}
                >
                  <View style={styles.viewMoreContent}>
                    <View style={styles.viewMoreIcon}>
                      <FontAwesome5 name="arrow-right" size={16} color="#D4AF37" />
                    </View>
                    <Text style={styles.viewMoreText}>View More</Text>
                    <Text style={styles.viewMoreSub}>In {product.category}</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : null}
        </View>

        <Footer />
      </Animated.ScrollView>

      {/* Interactive Size Finder Modal */}
      <Modal
        visible={isSizeFinderVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSizeFinderVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.sizeFinderCard}>
            <View style={styles.sizeFinderHeader}>
              <Text style={styles.sizeFinderTitle}>Ring Size Finder</Text>
              <TouchableOpacity onPress={() => setIsSizeFinderVisible(false)}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.sizeFinderContent}>
              <Text style={styles.sizeFinderInstruction}>
                Place a ring you already own directly onto the circle below. Adjust the slider until the outer golden edge matches the inside of your ring perfectly.
              </Text>
              
              <View style={styles.circleContainer}>
                {/* Measuring Circle */}
                <View 
                  style={[
                    styles.measuringCircle, 
                    { 
                      width: sizeFinderDiameter * 6, // scaling factor
                      height: sizeFinderDiameter * 6,
                      borderRadius: (sizeFinderDiameter * 6) / 2
                    }
                  ]} 
                />
                <Text style={styles.diameterText}>{sizeFinderDiameter.toFixed(1)} mm</Text>
              </View>

              {/* Slider steps */}
              <View style={styles.sliderContainer}>
                <Text style={{ color: '#fff', fontSize: 12, marginBottom: 5 }}>Adjust Circle Size:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', marginRight: 10 }}>Min</Text>
                  
                  <TouchableOpacity 
                    style={styles.stepBtn}
                    onPress={() => setSizeFinderDiameter(prev => Math.max(14, prev - 0.2))}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.sliderBar}>
                    <View style={[styles.sliderFill, { width: `${((sizeFinderDiameter - 14) / 8) * 100}%` }]} />
                  </View>

                  <TouchableOpacity 
                    style={styles.stepBtn}
                    onPress={() => setSizeFinderDiameter(prev => Math.min(22, prev + 0.2))}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                  
                  <Text style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 10 }}>Max</Text>
                </View>
              </View>

              {/* Estimated Size Output */}
              <View style={styles.sizeFinderResult}>
                <Text style={styles.resultLabel}>Estimated Ring Size:</Text>
                <Text style={styles.resultValue}>
                  {sizeFinderDiameter < 15.0 ? "Size 4" :
                   sizeFinderDiameter < 15.7 ? "Size 5" :
                   sizeFinderDiameter < 16.5 ? "Size 6" :
                   sizeFinderDiameter < 17.3 ? "Size 7" :
                   sizeFinderDiameter < 18.2 ? "Size 8" :
                   sizeFinderDiameter < 19.0 ? "Size 9" :
                   sizeFinderDiameter < 19.8 ? "Size 10" :
                   sizeFinderDiameter < 20.6 ? "Size 11" :
                   "Size 12"}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.selectSizeBtn} 
                onPress={() => {
                  let est = 7;
                  if (sizeFinderDiameter < 15.0) est = 4;
                  else if (sizeFinderDiameter < 15.7) est = 5;
                  else if (sizeFinderDiameter < 16.5) est = 6;
                  else if (sizeFinderDiameter < 17.3) est = 7;
                  else if (sizeFinderDiameter < 18.2) est = 8;
                  else if (sizeFinderDiameter < 19.0) est = 9;
                  else if (sizeFinderDiameter < 19.8) est = 10;
                  else if (sizeFinderDiameter < 20.6) est = 11;
                  else est = 12;
                  setSelectedSize(est);
                  setIsSizeFinderVisible(false);
                }}
              >
                <Text style={styles.selectSizeBtnText}>Select This Size</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Store Availability Check Modal */}
      {product && (
        <StoreAvailabilityModal
          visible={isStoreCheckVisible}
          onClose={() => setIsStoreCheckVisible(false)}
          product={product}
          countryCode={countryCode}
          matchingProducts={suiteItems}
          onSelectProduct={onSelectProduct}
        />
      )}

      {/* Complete the Look / Suite Recommendations Bottom Right Popup with Blur */}
      {isSuiteModalVisible && suiteItems.length > 0 && (
        <Modal
          visible={isSuiteModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsSuiteModalVisible(false)}
        >
          <View style={styles.blurModalContainer}>
            {/* Fullscreen Blur backdrop */}
            {Platform.OS === 'web' ? (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(10px)' } as any]} />
            ) : (
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
            )}
            
            {/* Tap outside to close */}
            <TouchableOpacity 
              style={StyleSheet.absoluteFillObject} 
              activeOpacity={1} 
              onPress={() => setIsSuiteModalVisible(false)} 
            />

            {/* Bottom Right Card Wrapper */}
            <View style={styles.bottomRightPopupWrapper}>
              <View style={styles.bottomRightPopupCard}>
                <View style={styles.bottomRightPopupHeader}>
                  <View style={styles.bottomPopupTitleRow}>
                    <FontAwesome5 name="gem" size={12} color="#D4AF37" style={{ marginRight: 8 }} />
                    <Text style={styles.bottomRightPopupTitle}>{suiteText.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsSuiteModalVisible(false)} style={styles.bottomPopupCloseBtn}>
                    <FontAwesome5 name="times" size={14} color="#D4AF37" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.bottomRightPopupBody}>
                  <OptimizedImage url={suiteItems[0].image} style={styles.bottomRightPopupImage} shouldLoad={true} />
                  
                  <View style={styles.bottomRightPopupInfo}>
                    <Text style={styles.bottomRightPopupName}>{suiteItems[0].name}</Text>
                    <Text style={styles.bottomRightPopupMeta}>
                      {suiteItems[0].grossWeight.toFixed(2)}g | {suiteItems[0].purity} {suiteItems[0].metalColor}
                    </Text>
                    <Text style={styles.bottomRightPopupPrice}>{formatPrice(suiteItems[0].price, countryCode)}</Text>
                  </View>
                  
                  <View style={styles.bottomRightPopupActions}>
                    <TouchableOpacity 
                      style={styles.bottomRightPopupAddBtn}
                      onPress={() => {
                        addToCart(suiteItems[0]);
                        setIsSuiteModalVisible(false);
                        Alert.alert("Added Matching Piece", `${suiteItems[0].name} has been added to your bag.`);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.bottomRightPopupAddBtnText}>Add Matching Piece</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.bottomRightPopupDetailsBtn}
                      onPress={() => {
                        setIsSuiteModalVisible(false);
                        onSelectProduct(suiteItems[0]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.bottomRightPopupDetailsBtnText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 4,
    marginTop: 20,
  },
  backBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
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
  thumbnailColumn: {
    width: 64,
    marginRight: 12,
    alignItems: 'center',
  },
  thumbnailScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  thumbnailCard: {
    width: 64,
    height: 64,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    overflow: 'hidden',
    backgroundColor: '#201409',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    })
  },
  activeThumbnailCard: {
    borderColor: '#D4AF37',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  imageSection: {
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#1a120b",
    borderWidth: 1,
    borderColor: "#4a3520",
    position: "relative",
  },
  imageWrapper: {
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
    backgroundColor: "#1a120b",
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
    backgroundColor: "#1a120b", // Match the dark background
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
  storeCheckButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  storeCheckButtonText: {
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
    justifyContent: "flex-start",
    gap: 10,
  },
  recommendationCard: {
    width: 160,
    height: 220,
    backgroundColor: "#150d05",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: 8,
    overflow: "hidden",
  },
  recImage: {
    width: "100%",
    height: 150,
  },
  recInfo: {
    padding: 10,
    height: 68,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  recName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
  },
  recPrice: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Recommendation Carousel Styles
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewMoreHeader: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recScrollContent: {
    paddingRight: 20,
    paddingVertical: 10,
    gap: 15,
  },
  viewMoreCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewMoreContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  viewMoreIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewMoreText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  viewMoreSub: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
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
  },

  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "rgba(212,175,55,0.05)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
  },
  priceAlertBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  priceAlertBtnActive: {
    backgroundColor: "#D4AF37",
  },
  priceAlertText: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  priceAlertActiveText: {
    color: "#291c0e",
  },
  splitPaymentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  splitPaymentText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
  },
  splitPaymentHighlight: {
    color: "#D4AF37",
    fontWeight: "bold",
  },
  configContainer: {
    gap: 15,
  },
  configSection: {
    gap: 8,
  },
  configTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  purityRow: {
    flexDirection: "row",
    gap: 10,
  },
  purityBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  activePurityBadge: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  purityText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "bold",
  },
  activePurityText: {
    color: "#D4AF37",
  },
  sizeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sizeFinderLink: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  sizeRow: {
    flexDirection: "row",
    gap: 8,
  },
  sizeBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  activeSizeBadge: {
    borderColor: "#D4AF37",
    backgroundColor: "#D4AF37",
  },
  sizeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  activeSizeText: {
    color: "#291c0e",
  },
  engravingInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 13,
  },
  engravingPreview: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
    alignItems: "center",
  },
  engravingPreviewLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginBottom: 6,
  },
  ringPreviewBand: {
    borderWidth: 3,
    borderColor: "#D4AF37",
    borderStyle: "solid",
    paddingVertical: 6,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.05)",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: "center",
  },
  ringPreviewText: {
    color: "#D4AF37",
    fontStyle: "italic",
    fontSize: 13,
    letterSpacing: 1.5,
    textShadowColor: "rgba(212, 175, 55, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceChartContainer: {
    marginTop: 5,
    gap: 10,
  },
  chartStack: {
    height: 10,
    flexDirection: "row",
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chartBar: {
    height: "100%",
  },
  chartLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  giftCard: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.02)",
  },
  giftCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(212,175,55,0.04)",
  },
  giftCardTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  giftCardContent: {
    padding: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(212,175,55,0.1)",
  },
  giftCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  customCheckboxChecked: {
    backgroundColor: "#D4AF37",
  },
  giftCheckboxText: {
    color: "#fff",
    fontSize: 12,
  },
  giftMsgLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 4,
  },
  giftMsgInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 8,
    fontSize: 12,
    height: 50,
    textAlignVertical: "top",
  },
  engagementRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  engagementBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  engagementBtnText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
  },
  whatsappConsultBtn: {
    borderColor: "#25D366",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sizeFinderCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#291c0e",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    borderRadius: 12,
    overflow: "hidden",
  },
  sizeFinderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212,175,55,0.15)",
    backgroundColor: "rgba(212,175,55,0.04)",
  },
  sizeFinderTitle: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sizeFinderContent: {
    padding: 20,
    alignItems: "center",
    gap: 15,
  },
  sizeFinderInstruction: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  circleContainer: {
    width: 200,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  measuringCircle: {
    borderWidth: 3,
    borderColor: "#D4AF37",
    backgroundColor: "transparent",
  },
  diameterText: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 10,
  },
  sliderContainer: {
    width: "100%",
    marginTop: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.2)",
    borderWidth: 1,
    borderColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBtnText: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "bold",
  },
  sliderBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#D4AF37",
  },
  sizeFinderResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(212,175,55,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    width: "100%",
    justifyContent: "center",
  },
  resultLabel: {
    color: "#fff",
    fontSize: 13,
  },
  resultValue: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectSizeBtn: {
    backgroundColor: "#D4AF37",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  selectSizeBtnText: {
    color: "#291c0e",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Suite / Complete the look styles
  suiteSection: {
    marginTop: 20,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
  },
  suiteTitle: {
    fontFamily: "TrajanPro",
    fontSize: 16,
    color: "#D4AF37",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  suiteSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginBottom: 20,
  },
  suiteContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 20,
  },
  suiteCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: "#150d05",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    borderRadius: 8,
    padding: 12,
    justifyContent: "space-between",
  },
  suiteCardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  suiteImage: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: "#201409",
  },
  suiteCardInfo: {
    flex: 1,
    gap: 4,
  },
  suiteCardName: {
    fontFamily: "TrajanPro",
    color: "#fff",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  suiteCardMeta: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 10,
  },
  suiteCardPrice: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "bold",
  },
  suiteAddBtn: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  suiteAddBtnText: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addAllSuiteBtn: {
    backgroundColor: "#D4AF37",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addAllSuiteBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  blurModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  bottomRightPopupWrapper: {
    padding: Platform.OS === 'web' ? 30 : 20,
    width: "100%",
    maxWidth: 400,
    alignSelf: Platform.OS === 'web' ? 'flex-end' : 'center',
    zIndex: 10001,
  },
  bottomRightPopupCard: {
    backgroundColor: '#1d130a',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
    width: "100%",
  },
  bottomRightPopupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212,175,55,0.15)",
    paddingBottom: 10,
    marginBottom: 15,
  },
  bottomRightPopupTitle: {
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    color: "#D4AF37",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  bottomRightPopupBody: {
    gap: 15,
    alignItems: "center",
  },
  bottomRightPopupImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#201409",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
  bottomRightPopupInfo: {
    alignItems: "center",
    gap: 4,
    width: "100%",
  },
  bottomRightPopupName: {
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomRightPopupMeta: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 11,
    textAlign: "center",
  },
  bottomRightPopupPrice: {
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
  },
  bottomRightPopupActions: {
    width: "100%",
    gap: 8,
    marginTop: 5,
  },
  bottomRightPopupAddBtn: {
    backgroundColor: "#D4AF37",
    borderRadius: 20,
    paddingVertical: 10,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomRightPopupAddBtnText: {
    color: "#291c0e",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomRightPopupDetailsBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.5)",
    borderRadius: 20,
    paddingVertical: 10,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomRightPopupDetailsBtnText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomPopupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bottomPopupCloseBtn: {
    padding: 2,
  },
});

export default ProductDetailsScreen;
