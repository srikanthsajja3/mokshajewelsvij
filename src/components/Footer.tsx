import React from "react";
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Footer = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const paddingHorz = width > 1200 ? width * 0.1 : 25;
  const paddingVert = width > 768 ? 60 : 40;
  const fontSizeLink = width > 768 ? 16 : 13;
  const brandTitleSize = width > 768 ? 28 : 22;

  return (
    <View style={[
      styles.footer, 
      { 
        paddingHorizontal: paddingHorz, 
        paddingTop: paddingVert,
        paddingBottom: paddingVert + insets.bottom 
      }
    ]}>
      <View style={styles.topSection}>
        <Text style={[styles.brandTitle, { fontSize: brandTitleSize }]}>MOKSHA JEWELS</Text>
        <Text style={styles.brandSubtitle}>Fine Jewelry & Timeless Designs</Text>
      </View>
      
      <View style={styles.linksContainer}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>SHOP</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>All Jewelry</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>New Arrivals</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>SUPPORT</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Contact Us</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Shipping</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>LEGAL</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Terms</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Privacy</Text>
        </View>
      </View>

      <View style={styles.addressSection}>
        <Text style={styles.addressText}>60-9-1/A, Polyclinic Rd, Vijayawada, AP 520010</Text>
        <TouchableOpacity 
          onPress={() => {
            const url = "https://www.google.com/maps/dir//MOKSHA+JEWELS,+60-9-1%2FA,+Polyclinic+Rd,+Kedareswarapeta,+Siddhartha+Nagar,+Vijayawada,+Andhra+Pradesh+520010/";
            if (Platform.OS === 'web') window.open(url, '_blank');
            else import('expo-linking').then(L => L.openURL(url));
          }}
        >
          <Text style={styles.directionsLink}>GET DIRECTIONS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.copyright}>© 2026 MOKSHA JEWELS. All Rights Reserved.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#1a1008",
    marginTop: 20,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  brandTitle: {
    color: "#D4AF37",
    fontFamily: "TrajanPro",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  brandSubtitle: {
    color: "#888",
    fontSize: 10,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  columnTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 1,
  },
  link: {
    color: "#ccc",
    marginBottom: 8,
  },
  addressSection: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  addressText: {
    color: "#D4AF37",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "TrajanPro",
    marginBottom: 15,
    lineHeight: 20,
  },
  directionsLink: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 4,
    letterSpacing: 1,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.1)",
    paddingTop: 25,
    alignItems: "center",
  },
  copyright: {
    color: "#555",
    fontSize: 10,
  },
});

export default Footer;
