import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, TextInput, ScrollView, Animated } from "react-native";
import { useCountry } from "../contexts/CountryContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import GoldRateBanner from "./GoldRateBanner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from '@expo/vector-icons';

const MAX_CONTENT_WIDTH = 1200;

interface HeaderProps {
  onGoHome?: () => void;
  onPressLogin?: () => void;
  onPressCart?: () => void;
  onPressOrders?: () => void;
  onPressWishlist?: () => void;
  onPressProfile?: () => void;
  onPressAdmin?: () => void;
  onPressVendor?: () => void;
  onPressMenu?: () => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  scrollY?: Animated.Value;
}

const Header: React.FC<HeaderProps> = ({ 
  onGoHome, 
  onPressLogin, 
  onPressCart, 
  onPressOrders, 
  onPressWishlist, 
  onPressProfile,
  onPressAdmin,
  onPressVendor,
  onPressMenu,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  scrollY
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, isAdmin, isVendor } = useAuth();
  const { cartCount } = useCart();
  const { countryCode } = useCountry();
  
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const isMobile = width < 768;
  
  // Base values
  const baseLogoSize = width > 768 ? 60 : (isIOS ? 45 : 38);
  const baseTitleSize = width > 768 ? 24 : (width < 380 ? 15 : 17);
  const letterSpacing = width > 768 ? 1.5 : 1;
  const iconSize = width > 768 ? 20 : 18;
  const navIconSize = width > 768 ? 16 : 14;
  
  const paddingHorz = isWeb 
    ? (width > 1400 ? 50 : 25)
    : (width < 380 ? 8 : 12);

  const iconMargin = width > 768 ? 20 : (width < 380 ? 10 : 12);

  // Animations
  const scrollOffset = scrollY || new Animated.Value(0);

  const headerHeight = scrollOffset.interpolate({
    inputRange: [0, 100],
    outputRange: [isMobile ? 65 : 90, isMobile ? 50 : 60],
    extrapolate: 'clamp',
  });

  const logoScale = scrollOffset.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.75],
    extrapolate: 'clamp',
  });

  const titleScale = scrollOffset.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.75],
    extrapolate: 'clamp',
  });

  const headerPadding = scrollOffset.interpolate({
    inputRange: [0, 100],
    outputRange: [isWeb ? 10 : 15, 5],
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

  return (
    <Animated.View style={styles.container}>
      <Animated.View style={[
        styles.header, 
        { 
          paddingHorizontal: paddingHorz,
          paddingTop: isWeb ? headerPadding : Math.max(insets.top, 5),
          paddingBottom: headerPadding,
          height: headerHeight,
        }
      ]}>
        <View style={styles.centerWrapper}>
          <TouchableOpacity 
            style={styles.brandContainer}
            onPress={onGoHome}
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

          {!isMobile ? (
            <View style={styles.countryDisplay}>
              <Text style={styles.countryText}>{countryCode === 'IN' ? 'INDIA' : 'USA'}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      <View style={styles.actionBar}>
        <View style={[
          styles.actionsContainer, 
          { 
            paddingHorizontal: paddingHorz,
            paddingVertical: isWeb ? 8 : 12 
          }
        ]}>
          <View style={styles.centerWrapper}>
            <View style={styles.navArrowsGroup}>
              <TouchableOpacity 
                style={[styles.navArrowItem, !canGoBack && { opacity: 0.3 }]} 
                onPress={onBack}
                disabled={!canGoBack}
              >
                <FontAwesome5 name="chevron-left" size={navIconSize} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.navArrowItem, !canGoForward && { opacity: 0.3 }]} 
                onPress={onForward}
                disabled={!canGoForward}
              >
                <FontAwesome5 name="chevron-right" size={navIconSize} color="#D4AF37" />
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRightGroup}>
              <View style={[styles.actionItem, { marginLeft: iconMargin }]}>
                <View style={styles.mobileFlagContainer}>
                  <Text style={styles.mobileCountryCode}>{countryCode === 'IN' ? 'INDIA' : 'USA'}</Text>
                </View>
              </View>

              {isMobile ? (
                <>
                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onGoHome}>
                    <FontAwesome5 name="home" size={iconSize} color="#D4AF37" />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressCart}>
                    <View>
                      <FontAwesome5 name="shopping-bag" size={iconSize} color="#D4AF37" />
                      {cartCount > 0 ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{cartCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressMenu}>
                    <FontAwesome5 name="bars" size={iconSize} color="#D4AF37" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onGoHome}>
                    <FontAwesome5 name="home" size={iconSize} color="#D4AF37" />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressWishlist}>
                    <FontAwesome5 name="heart" size={iconSize} color="#D4AF37" />
                  </TouchableOpacity>

                  {user ? (
                    <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressOrders}>
                      <FontAwesome5 name="history" size={iconSize} color="#D4AF37" />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressCart}>
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
                    <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressAdmin}>
                      <Text style={styles.adminBadge}>ADMIN</Text>
                    </TouchableOpacity>
                  ) : null}

                  {isVendor ? (
                    <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressVendor}>
                      <Text style={styles.vendorBadge}>PARTNER</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.authGroup}>
                    {user ? (
                      <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressProfile}>
                        <FontAwesome5 name="user-circle" size={iconSize} color="#D4AF37" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.actionItem, { marginLeft: iconMargin }]} onPress={onPressLogin}>
                        <FontAwesome5 name="sign-in-alt" size={iconSize} color="#D4AF37" />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </View>

      <Animated.View style={{ opacity: bannerOpacity, height: bannerHeight, overflow: 'hidden' }}>
        <GoldRateBanner />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#291c0e",
    zIndex: 100,
  },
  header: {
    paddingBottom: 15,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  centerWrapper: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  countryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  countryText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mobileFlagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mobileCountryCode: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
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
  actionBar: {
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  navArrowsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navArrowItem: {
    padding: 8,
    marginHorizontal: 2,
  },
  navSeparator: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    marginLeft: 10,
    marginRight: 5,
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
});

export default Header;
