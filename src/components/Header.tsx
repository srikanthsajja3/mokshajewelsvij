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
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, isAdmin, isVendor } = useAuth();
  const { cartCount } = useCart();
  
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  
  const logoSize = width > 768 ? 120 : (isIOS ? 50 : 40);
  const titleSize = width > 768 ? 48 : (width < 380 ? 16 : 18);
  const letterSpacing = width > 768 ? 8 : 1;
  const iconSize = width > 768 ? 24 : 18;
  
  const paddingHorz = isWeb 
    ? (width > 1400 ? 60 : 30)
    : 15;

  return (
    <View style={styles.container}>
      <View style={[
        styles.header, 
        { 
          paddingHorizontal: paddingHorz,
          paddingTop: Math.max(insets.top, 15),
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
      </View>

      <View style={styles.actionBar}>
        <View style={[styles.actionsRightGroup, { paddingHorizontal: paddingHorz }]}>
          <TouchableOpacity style={styles.actionItem} onPress={onGoHome}>
            <FontAwesome5 name="home" size={iconSize} color="#D4AF37" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={onPressWishlist}>
            <FontAwesome5 name="heart" size={iconSize} color="#D4AF37" />
          </TouchableOpacity>

          {user && (
            <TouchableOpacity style={styles.actionItem} onPress={onPressOrders}>
              <FontAwesome5 name="history" size={iconSize} color="#D4AF37" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionItem} onPress={onPressCart}>
            <View>
              <FontAwesome5 name="shopping-bag" size={iconSize} color="#D4AF37" />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.actionItem} onPress={onPressAdmin}>
              <Text style={styles.adminBadge}>ADMIN</Text>
            </TouchableOpacity>
          )}

          {isVendor && (
            <TouchableOpacity style={styles.actionItem} onPress={onPressVendor}>
              <Text style={styles.vendorBadge}>PARTNER</Text>
            </TouchableOpacity>
          )}

          <View style={styles.authGroup}>
            {user ? (
              <TouchableOpacity style={styles.actionItem} onPress={onPressProfile}>
                <FontAwesome5 name="user-circle" size={iconSize} color="#D4AF37" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionItem} onPress={onPressLogin}>
                <FontAwesome5 name="sign-in-alt" size={iconSize} color="#D4AF37" />
              </TouchableOpacity>
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
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
  actionsRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: 'flex-end',
  },
  actionItem: {
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    marginLeft: 25,
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
