import React, { useState, useRef } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, TextInput, ScrollView, Animated, Alert } from "react-native";
import { useCountry } from "../contexts/CountryContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import GoldRateBanner from "./GoldRateBanner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from '@expo/vector-icons';

import { useNavigation, useRoute, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

import { useUI } from "../contexts/UIContext";

const MAX_CONTENT_WIDTH = Platform.OS === 'web' ? '98%' : 1200;
const MAX_PX_WIDTH = 2500;

interface HeaderProps {
  scrollY?: Animated.Value;
  searchQuery: string;
  onSearch: (query: string) => void;
  isHome?: boolean;
  onPressMenu?: () => void;
}

interface MegaMenuColumn {
  title: string;
  items: {
    label: string;
    icon?: string;
    subItems?: string[];
    priceRange?: { min: number; max: number };
  }[];
}

// Gold Category Submenus
const GOLD_COLUMNS: MegaMenuColumn[] = [
  {
    title: "Women",
    items: [
      { label: "Bangles", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/G-Bangles.png" },
      { label: "HARAMS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/G-Haram.png" },
      { label: "VADDANAM", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-vaddanam-icon.png" },
      { label: "LOCKET", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-locket-icon.png" },
      { label: "VANKI", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-vanky-icon.png" },
      { 
        label: "CHAINS", 
        icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-women-chains-icon.png",
        subItems: ["SIMPLE CHAINS", "ROPE CHAINS", "THALI CHAINS", "FANCY CHAINS", "DAILYWEAR CHAINS"]
      },
      { 
        label: "RINGS", 
        icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-ladies-ring-icon.png",
        subItems: ["ENGAGEMENT RINGS", "PLAIN RINGS", "GEMSTONE", "FLORAL RINGS", "BUTTERFLY RINGS", "COUPLE RINGS", "SOLITAIRE RINGS", "FANCY RINGS"]
      },
      { label: "MAANG TIKKA", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/mangtikka_icon.png" }
    ]
  },
  {
    title: "", // Women Part 2
    items: [
      { 
        label: "NECKLACE", 
        icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-necklace-icon.png",
        subItems: ["ANTIQUE NECKLACE", "PACHI NECKLACE", "TEMPLE NECKLACE", "LONG NECKLACE", "SHORT NECKLACE", "PEARLS NECKLACE", "RUBY NECKLACE"]
      },
      { 
        label: "Earrings", 
        icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-earrings-icon-.png",
        subItems: ["SUI DHAGA", "HUGGIES", "CHANDBALI", "HANGINGS", "HOOPS", "DANGLES", "STUDS", "JHUMKAS"]
      },
      { label: "PENDANTS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-pendant-icon.png" },
      { label: "MANGALSUTRA", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-mangalsutra-icon.png" },
      { label: "CHOKERS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold_choker-icon.png" },
      { label: "BRACELETS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-bracelet-icon.png" },
      { label: "ACCESSORIES", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/women-accessories-icon.png" },
      { label: "GOLD IDOLS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-idols-icon.png" }
    ]
  },
  {
    title: "Men",
    items: [
      { 
        label: "RINGS", 
        icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-man-ring-icon.png",
        subItems: ["ENGAGEMENT RINGS"]
      },
      { label: "BRACELETS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-men-_bracelet-icon.png" },
      { label: "CHAINS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-men-chains-icon.png" },
      { label: "ACCESSORIES", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-men-accessories-icon.png" }
    ]
  },
  {
    title: "Kids",
    items: [
      { label: "BANGLES", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-baby-bangles-icon.png" },
      { label: "BRACELETS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-baby-bracelets-icon.png" },
      { label: "MAANG TIKKA", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/gold-baby-maang-tikka.png" },
      { label: "RINGS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/kids-ring-icon.png" },
      { label: "ACCESSORIES", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/kids-accessories-icon.png" }
    ]
  },
  {
    title: "SHOP BY PRICE",
    items: [
      { label: "UNDER 10K", priceRange: { min: 0, max: 10000 } },
      { label: "10K TO 20K", priceRange: { min: 10000, max: 20000 } },
      { label: "20K TO 30K", priceRange: { min: 20000, max: 30000 } },
      { label: "ABOVE 30K", priceRange: { min: 30000, max: 1000000 } }
    ]
  }
];

// Diamonds Category Submenus
const DIAMOND_COLUMNS: MegaMenuColumn[] = [
  {
    title: "Women",
    items: [
      { label: "Bangles", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-bangles-iocn.png" },
      { 
        label: "Earrings", 
        icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-earrings-icon.png",
        subItems: ["JHUMKAS", "HANGINGS", "STUDS", "SUIDHAGA", "DROPS"]
      },
      { label: "MANGALSUTRA", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-mangalsutra-icon.png" },
      { label: "NOSEPINS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-nosepin-icon.png" },
      { label: "PENDANT SETS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-pendant-sets-icon.png" },
      { label: "VADDANAM", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-vaddanam-icon.png" }
    ]
  },
  {
    title: "", // Women Part 2
    items: [
      { label: "Bracelets", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-bracelets-icon.png" },
      { label: "NECKLACE", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-necklace-icon.png" },
      { label: "PENDANTS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-pendants-icon.png" },
      { 
        label: "Rings", 
        icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/diamond-rings-icon.png",
        subItems: ["ENGAGEMENT RINGS", "FANCY RINGS", "SWITCH RINGS", "NAVRATNA RINGS", "STACKABLE RINGS", "SILVIGO COLLECTIONS", "SOLITAIRE RINGS", "COUPLE RINGS"]
      }
    ]
  },
  {
    title: "SHOP BY PRICE",
    items: [
      { label: "UNDER 10K", priceRange: { min: 0, max: 10000 } },
      { label: "10K TO 20K", priceRange: { min: 10000, max: 20000 } },
      { label: "20K TO 30K", priceRange: { min: 20000, max: 30000 } },
      { label: "ABOVE 30K", priceRange: { min: 30000, max: 1000000 } }
    ]
  }
];

// Silver Category Submenus
const SILVER_COLUMNS: MegaMenuColumn[] = [
  {
    title: "SHOP BY CATEGORY",
    items: [
      { label: "SILVER GIFTS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/Silver-article.png" },
      { label: "DINNER SETS, GLASSES & TUMBLERS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/dinnerset1.png" }
    ]
  },
  {
    title: "", // Category Part 2
    items: [
      { label: "POOJA ARTICLES", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/silver-pooja.png" },
      { label: "JEWELLERY", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/silver-jewellery.jpg" },
      { label: "SILVER COINS", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/silver-coin.png" }
    ]
  },
  {
    title: "SHOP BY PRICE",
    items: [
      { label: "UNDER 10K", priceRange: { min: 0, max: 10000 } },
      { label: "10K TO 20K", priceRange: { min: 10000, max: 20000 } },
      { label: "20K TO 30K", priceRange: { min: 20000, max: 30000 } },
      { label: "ABOVE 30K", priceRange: { min: 30000, max: 1000000 } }
    ]
  }
];

// New Arrivals Category Submenus
const NEW_ARRIVALS_COLUMNS: MegaMenuColumn[] = [
  {
    title: "SHOP BY COLLECTION",
    items: [
      { label: "BUTTERFLY", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/butterfly.png" },
      { label: "GLAM & GLITZ", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/glam.png" },
      { label: "SILVIGO", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/silvigo.png" }
    ]
  },
  {
    title: "", // Collection Part 2
    items: [
      { label: "FLORAL", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/floral.png" },
      { label: "V Kids", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/tara.png" },
      { label: "TRINITY", icon: "https://cdnmedia-breeze.vaibhavjewellers.com/media/.renditions/wysiwyg/trinity.jpg" }
    ]
  }
];

const Header: React.FC<HeaderProps> = ({ 
  scrollY,
  searchQuery,
  onSearch,
  isHome: isHomeProp,
  onPressMenu
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, isAdmin, isVendor } = useAuth();
  const { cartCount } = useCart();
  const { countryCode } = useCountry();
  const { setLoginVisible } = useUI();
  const [searchVisible, setSearchVisible] = useState(false);
  const searchAnim = React.useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeHoverMenu, setActiveHoverMenu] = useState<string | null>(null);
  
  const isHome = !!isHomeProp;
  
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const isMobile = width < 1024; // Align with CategoryBar's width breakpoint for desktop tabs

  const navigateToHome = () => navigation.navigate('Home');
  const navigateToLogin = () => setLoginVisible(true);
  const navigateToCart = () => navigation.navigate('Cart');
  
  const navigateToOrders = () => {
    if (user) navigation.navigate('Orders');
    else setLoginVisible(true);
  };
  
  const navigateToWishlist = () => {
    if (user) navigation.navigate('Wishlist');
    else setLoginVisible(true);
  };
  
  const navigateToProfile = () => {
    if (user) navigation.navigate('Profile');
    else setLoginVisible(true);
  };
  
  const navigateToAdmin = () => isAdmin ? navigation.navigate('AdminDashboard') : null;
  const navigateToVendor = () => isVendor ? navigation.navigate('VendorDashboard') : null;

  const toggleSearch = () => {
    const toValue = searchVisible ? 0 : 1;
    Animated.spring(searchAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40
    }).start();
    setSearchVisible(!searchVisible);
  };

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  
  // Base values
  const baseLogoSize = width > 768 ? 60 : (isIOS ? 45 : 38);
  const baseTitleSize = width > 768 ? 24 : (width < 380 ? 15 : 17);
  const letterSpacing = width > 768 ? 1.5 : 1;
  const iconSize = width > 768 ? 20 : 18;
  const navIconSize = width > 768 ? 16 : 14;
  
  const paddingHorz = isWeb 
    ? (width > 1400 ? 30 : 15)
    : (width < 380 ? 8 : 12);

  const iconMargin = width > 768 ? 12 : (width < 380 ? 6 : 8);

  // Animations & Static Sizes
  const scrollOffset = scrollY || new Animated.Value(0);

  // Logo Scale: Consistent 0.75 scale across all pages for brand consistency
  const logoScale = 0.75;

  // Header Height: Unified height across all pages for a consistent navigation experience
  const baseHeaderHeight = isMobile ? 75 : 60;
  
  const headerHeight = isWeb ? baseHeaderHeight : (baseHeaderHeight + insets.top);

  const headerPadding = scrollOffset.interpolate({
    inputRange: [0, 100],
    outputRange: [isWeb ? 8 : 12, 4],
    extrapolate: 'clamp',
  });

  const bannerOpacity = scrollOffset.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const bannerHeight = scrollOffset.interpolate({
    inputRange: [0, 50],
    outputRange: [40, 0],
    extrapolate: 'clamp',
  });

  const handleNavPress = (category: string, subCategory?: string, minPrice?: number, maxPrice?: number) => {
    setActiveHoverMenu(null);
    navigation.navigate('Category', {
      category,
      subCategory,
      minPrice,
      maxPrice
    });
  };

  const renderMegaMenu = (menuType: 'Gold' | 'Diamonds' | 'New Arrivals') => {
    let columns: MegaMenuColumn[] = [];
    let bannerUrl = "";
    let categoryName = "";
    
    if (menuType === 'Gold') {
      columns = GOLD_COLUMNS;
      bannerUrl = "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/gold-banner-mega-menu.jpg";
      categoryName = "Gold";
    } else if (menuType === 'Diamonds') {
      columns = DIAMOND_COLUMNS;
      bannerUrl = "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/diamond-banner-mega-menu.jpg";
      categoryName = "Diamonds";
    } else if (menuType === 'New Arrivals') {
      columns = NEW_ARRIVALS_COLUMNS;
      bannerUrl = "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/trinity-banner-mega-menu.gif";
      categoryName = "All"; 
    }

    return (
      <View style={styles.megaMenuPanel}>
        <View style={styles.megaMenuColsContainer}>
          {columns.map((col, idx) => (
            <View key={idx} style={styles.megaMenuCol}>
              {col.title ? (
                <Text style={styles.megaMenuColTitle}>{col.title}</Text>
              ) : (
                <View style={{ height: 26 }} />
              )}
              
              <View style={styles.megaMenuSubList}>
                {col.items.map((item, itemIdx) => (
                  <View key={itemIdx}>
                    <TouchableOpacity
                      style={styles.megaMenuItemRow}
                      onPress={() => {
                        if (item.priceRange) {
                          handleNavPress(categoryName, undefined, item.priceRange.min, item.priceRange.max);
                        } else {
                          handleNavPress(categoryName, item.label);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {item.icon ? (
                        <Image source={{ uri: item.icon }} style={styles.megaMenuIcon} />
                      ) : null}
                      <Text style={styles.megaMenuItemText}>{item.label}</Text>
                    </TouchableOpacity>
                    
                    {item.subItems && item.subItems.length > 0 ? (
                      <View style={styles.megaMenuNestedList}>
                        {item.subItems.map((sub, subIdx) => (
                          <TouchableOpacity
                            key={subIdx}
                            style={styles.megaMenuNestedLink}
                            onPress={() => handleNavPress(categoryName, sub)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.megaMenuNestedText}>• {sub}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        
        {bannerUrl ? (
          <View style={styles.megaMenuBannerContainer}>
            <Image source={{ uri: bannerUrl }} style={styles.megaMenuBanner} />
          </View>
        ) : null}
      </View>
    );
  };

  const renderNavMenuCenter = () => {
    const tabs: { label: string; hasDropdown: boolean; menuType?: 'Gold' | 'Diamonds' | 'New Arrivals'; action?: () => void }[] = [
      { label: "Gold", hasDropdown: true, menuType: "Gold" },
      { label: "Diamonds", hasDropdown: true, menuType: "Diamonds" },
      { 
        label: "Video Shopping", 
        hasDropdown: false, 
        action: () => {
          Alert.alert(
            "Video Shopping",
            "Connecting you with our store representative for a live video consultation. Please ensure your camera and microphone are ready."
          );
        }
      },
      { 
        label: "Try On", 
        hasDropdown: false, 
        action: () => {
          navigation.navigate("Category", { category: "All" });
          setTimeout(() => {
            Alert.alert(
              "Virtual Try-On",
              "Browse our collections and select any item with the 'Try On' badge to experience virtual jewelry matching in real-time."
            );
          }, 300);
        }
      },
      { label: "New Arrivals", hasDropdown: true, menuType: "New Arrivals" },
    ];

    return (
      <View style={styles.navMenuCenter}>
        {tabs.map((tab, idx) => {
          const isActive = activeHoverMenu === tab.menuType;
          return (
            <View
              key={idx}
              // @ts-ignore
              onMouseEnter={() => {
                if (tab.hasDropdown && tab.menuType) {
                  setActiveHoverMenu(tab.menuType);
                } else {
                  setActiveHoverMenu(null);
                }
              }}
              style={styles.navTabContainer}
            >
              <TouchableOpacity
                style={styles.navTabItem}
                onPress={() => {
                  if (tab.action) {
                    tab.action();
                  } else if (tab.menuType) {
                    handleNavPress(tab.menuType === "Diamonds" ? "Diamonds" : tab.menuType);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.navTabText, isActive && styles.navTabActiveText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={[
        styles.header, 
        { 
          paddingHorizontal: paddingHorz,
          paddingTop: isWeb ? headerPadding : Math.max(insets.top, 5),
          paddingBottom: headerPadding,
          minHeight: headerHeight,
        }
      ]}>
        <View 
          style={styles.centerWrapper}
          // @ts-ignore
          onMouseLeave={() => setActiveHoverMenu(null)}
        >
          <TouchableOpacity 
            style={styles.brandContainer}
            onPress={navigateToHome}
            activeOpacity={0.7}
          >
            <Animated.View style={{ 
              flexDirection: 'row',
              alignItems: 'center',
              // @ts-ignore - transformOrigin is supported in modern RN (0.73+) and Web
              transformOrigin: 'left center',
              transform: [
                { scale: logoScale },
              ]
            }}>
              <Image
                source={require("../../assets/logo.jpg")}
                style={[styles.logo, { width: baseLogoSize, height: baseLogoSize, borderRadius: 8 }]}
              />
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                style={[styles.title, { fontSize: baseTitleSize, letterSpacing: letterSpacing }]}
              >
                MOKSHA JEWELS
              </Text>
            </Animated.View>
          </TouchableOpacity>

          {!isMobile && isWeb && renderNavMenuCenter()}

          <View style={styles.actionsRightGroup}>
            <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={toggleSearch}>
              <FontAwesome5 name="search" size={iconSize} color={searchVisible ? "#fff" : "#D4AF37"} />
            </TouchableOpacity>

            {isMobile ? (
              <>
                <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToOrders}>
                  <View>
                    <FontAwesome5 name="bell" size={iconSize} color="#D4AF37" />
                    <View style={styles.dotBadge} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressMenu}>
                  <FontAwesome5 name="bars" size={iconSize} color="#D4AF37" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToWishlist}>
                  <FontAwesome5 name="heart" size={iconSize} color="#D4AF37" />
                </TouchableOpacity>

                {user ? (
                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToOrders}>
                    <FontAwesome5 name="history" size={iconSize} color="#D4AF37" />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToCart}>
                  <View>
                    <FontAwesome5 name="shopping-bag" size={iconSize} color="#D4AF37" />
                    {cartCount > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cartCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>

                {isAdmin ? (
                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToAdmin}>
                    <Text style={styles.adminBadge}>ADMIN</Text>
                  </TouchableOpacity>
                ) : null}

                {isVendor ? (
                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToVendor}>
                    <Text style={styles.vendorBadge}>PARTNER</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.authGroup}>
                  {user ? (
                    <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToProfile}>
                      <FontAwesome5 name="user-circle" size={iconSize} color="#D4AF37" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={navigateToLogin}>
                      <FontAwesome5 name="sign-in-alt" size={iconSize} color="#D4AF37" />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Absolute overlay rendered directly under centerWrapper */}
          {!isMobile && isWeb && activeHoverMenu && renderMegaMenu(activeHoverMenu as any)}
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: searchOpacity, height: searchHeight, overflow: 'hidden', backgroundColor: '#1a1008', borderBottomWidth: searchVisible ? 1 : 0, borderBottomColor: '#D4AF37' }}>
        <View style={[styles.centerWrapper, { height: '100%', paddingHorizontal: paddingHorz }]}>
          <View style={styles.searchBarContainer}>
            <FontAwesome5 name="search" size={14} color="#888" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search masterpieces, collections, codes..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={onSearch}
              autoFocus={searchVisible}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => onSearch("")}>
                <FontAwesome5 name="times-circle" size={16} color="#888" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Animated.View>

      {isHome && (
        <Animated.View style={{ opacity: bannerOpacity, height: bannerHeight, overflow: 'hidden' }}>
          <GoldRateBanner />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#291c0e",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
    zIndex: 100,
  },
  header: {
    paddingBottom: 15,
    overflow: 'visible', // Adjusted from 'hidden' to render overlays without clipping
    justifyContent: 'center',
  },
  centerWrapper: {
    maxWidth: MAX_PX_WIDTH,
    width: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative", // Needed for absolute positioning of child overlays
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    height: '100%',
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  logo: {
    marginRight: 12,
  },
  title: {
    fontFamily: "TrajanPro",
    color: "#D4AF37",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  actionsRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionItem: {
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  dotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    borderWidth: 1.5,
    borderColor: '#291c0e',
  },
  adminBadge: {
    color: '#fff', 
    backgroundColor: '#D4AF37', 
    paddingHorizontal: 8, 
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    overflow: 'hidden'
  },
  vendorBadge: {
    color: '#D4AF37', 
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8, 
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  authGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Centered navigation tabs on desktop
  navMenuCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
    marginHorizontal: 20,
  },
  navTabContainer: {
    justifyContent: "center",
    height: "100%",
  },
  navTabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navTabText: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    letterSpacing: 1.2,
    textTransform: "uppercase",
    ...Platform.select({
      web: {
        transition: 'color 0.2s ease',
      }
    })
  },
  navTabActiveText: {
    color: "#D4AF37",
  },
  // Mega Menu Panel Dropdown Style
  megaMenuPanel: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#1c1209",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.65)",
      }
    })
  },
  megaMenuColsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  megaMenuCol: {
    flex: 1,
    minWidth: 140,
  },
  megaMenuColTitle: {
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
    paddingBottom: 6,
    marginBottom: 12,
  },
  megaMenuSubList: {
    gap: 6,
  },
  megaMenuItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  megaMenuItemText: {
    color: "#dcdcdc",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  megaMenuIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 10,
    resizeMode: "contain",
  },
  megaMenuNestedList: {
    paddingLeft: 28,
    marginTop: 2,
    marginBottom: 6,
    gap: 4,
  },
  megaMenuNestedLink: {
    paddingVertical: 2,
  },
  megaMenuNestedText: {
    color: "#999",
    fontSize: 10,
    fontWeight: "400",
    textTransform: "uppercase",
  },
  megaMenuBannerContainer: {
    width: 240,
    marginLeft: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  megaMenuBanner: {
    width: "100%",
    height: 280,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    resizeMode: "cover",
  },
});

export default Header;
