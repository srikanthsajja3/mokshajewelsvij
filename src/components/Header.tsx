import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, TextInput, ScrollView } from "react-native";
import { useCountry } from "../contexts/CountryContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import GoldRateBanner from "./GoldRateBanner";

import { useSafeAreaInsets } from "react-native-safe-area-context";

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
}

import { FontAwesome5 } from '@expo/vector-icons';

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
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, isAdmin, isVendor } = useAuth();
  const { cartCount } = useCart();
  const { countryCode } = useCountry();
  
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const isMobile = width < 768;
  
  const logoSize = width > 768 ? 80 : (isIOS ? 50 : 40);
  const titleSize = width > 768 ? 28 : (width < 380 ? 16 : 18);
  const letterSpacing = width > 768 ? 2 : 1;
  const iconSize = width > 768 ? 22 : 18;
  const navIconSize = width > 768 ? 18 : 14;
  
  const paddingHorz = isWeb 
    ? (width > 1400 ? 60 : 30)
    : (width < 380 ? 10 : 15);

  const iconMargin = width > 768 ? 25 : (width < 380 ? 12 : 15);

  return (
    <View style={styles.container}>
      <View style={[
        styles.header, 
        { 
          paddingHorizontal: paddingHorz,
          paddingTop: isWeb ? 10 : Math.max(insets.top, 15),
          paddingBottom: isWeb ? 10 : 15,
        }
      ]}>
        <TouchableOpacity 
          style={[styles.brandContainer, width > 768 && { flex: 1 }]}
          onPress={onGoHome}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/logo.jpg")}
            style={[styles.logo, { width: logoSize, height: logoSize, borderRadius: 8 }]}
          />
          <Text 
            numberOfLines={1} 
            adjustsFontSizeToFit 
            style={[styles.title, { fontSize: titleSize, letterSpacing: letterSpacing }]}
          >
            MOKSHA JEWELS
          </Text>
        </TouchableOpacity>

        {!isMobile ? (
          <View style={styles.countryDisplay}>
            <Text style={styles.countryText}>{countryCode === 'IN' ? 'INDIA' : 'USA'}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionBar}>
        <View style={[
          styles.actionsContainer, 
          { 
            paddingHorizontal: paddingHorz,
            paddingVertical: isWeb ? 8 : 12 
          }
        ]}>
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

      <GoldRateBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#291c0e",
    zIndex: 100,
  },
  header: {
    paddingBottom: 15,
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
