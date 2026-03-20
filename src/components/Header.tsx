import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { useCountry } from "../contexts/CountryContext";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import GoldRateBanner from "./GoldRateBanner";

interface HeaderProps {
  onPressLogo?: () => void;
  onPressLogin?: () => void;
  onPressCart?: () => void;
  onPressOrders?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPressLogo, onPressLogin, onPressCart, onPressOrders }) => {
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  
  // Adjusted logo sizes for mobile safety
  const logoSize = width > 768 ? 110 : (isIOS ? 55 : 45);
  
  // Dynamic title size - more conservative for mobile
  const titleSize = width > 768 ? 40 : (width < 380 ? 18 : 20);
  const letterSpacing = width > 768 ? 3 : 1;
  
  const paddingHorz = isWeb 
    ? (width > 1400 ? 40 : 20)
    : 15;

  return (
    <View style={styles.container}>
      {/* Main Header Area - Brand Aligned Left */}
      <View style={[styles.header, { paddingHorizontal: paddingHorz }]}>
        <TouchableOpacity 
          style={styles.brandContainer}
          onPress={onPressLogo}
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

      {/* Action Bar (Below Header) - All Actions Aligned Right (No Icons) */}
      <View style={[styles.actionBar, { paddingHorizontal: paddingHorz }]}>
        <View style={styles.actionsRightGroup}>
          {/* Home Button */}
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={onPressLogo}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>HOME</Text>
          </TouchableOpacity>

          {/* Orders Section (If logged in) */}
          {user && (
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={onPressOrders}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>ORDERS</Text>
            </TouchableOpacity>
          )}

          {/* Bag Section */}
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={onPressCart}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>
              {cartCount === 0 ? "BAG" : `BAG (${cartCount})`}
            </Text>
          </TouchableOpacity>

          {/* Login/Account Section */}
          <View style={styles.authGroup}>
            {user ? (
              <TouchableOpacity style={styles.actionItem} onPress={signOut}>
                <Text style={styles.actionText}>LOGOUT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionItem} onPress={onPressLogin}>
                <Text style={styles.actionText}>LOGIN</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Gold Rate Banner */}
      <GoldRateBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#291c0e",
  },
  header: {
    // Standard safe padding for iOS
    paddingTop: Platform.OS === "ios" ? 50 : 15, 
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    overflow: "hidden", // Prevent text from bleeding out
  },
  logo: {
    marginRight: 12,
  },
  title: {
    fontFamily: "TrajanPro",
    color: "#D4AF37",
    textTransform: "uppercase",
    fontWeight: "600",
    flexShrink: 1, // Allow text to shrink to fit screen
  },
  actionBar: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
  },
  actionsRightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionItem: {
    paddingVertical: 4,
    marginLeft: 18, 
  },
  actionText: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.2,
  },
  authGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    alignItems: "flex-end",
  },
  userEmail: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    maxWidth: 70,
  },
  logoutText: {
    color: "#D4AF37",
    fontSize: 8,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});

export default Header;
