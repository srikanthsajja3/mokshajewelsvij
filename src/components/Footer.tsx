import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";

const Footer = () => {
  const { width } = useWindowDimensions();
  
  const paddingHorz = width > 1200 ? width * 0.1 : 25;
  const paddingVert = width > 768 ? 60 : 40;
  const fontSizeLink = width > 768 ? 16 : 13;
  const brandTitleSize = width > 768 ? 28 : 22;

  return (
    <View style={[styles.footer, { paddingHorizontal: paddingHorz, paddingVertical: paddingVert }]}>
      <View style={styles.topSection}>
        <Text style={[styles.brandTitle, { fontSize: brandTitleSize }]}>MOKSHA JEWELS</Text>
        <Text style={styles.brandSubtitle}>Fine Jewelry & Timeless Designs</Text>
      </View>
      
      <View style={[styles.linksContainer, { flexDirection: width > 480 ? "row" : "column" }]}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>SHOP</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>All Jewelry</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>New Arrivals</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Best Sellers</Text>
        </View>
        <View style={[styles.column, { marginTop: width > 480 ? 0 : 25 }]}>
          <Text style={styles.columnTitle}>SUPPORT</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Contact Us</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Shipping</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Returns</Text>
        </View>
        <View style={[styles.column, { marginTop: width > 480 ? 0 : 25 }]}>
          <Text style={styles.columnTitle}>LEGAL</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Terms of Service</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Privacy Policy</Text>
          <Text style={[styles.link, { fontSize: fontSizeLink }]}>Cookie Policy</Text>
        </View>
      </View>

      <View style={styles.socials}>
        <View style={styles.socialIcon} />
        <View style={styles.socialIcon} />
        <View style={styles.socialIcon} />
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.copyright}>� 2026 MOKSHA JEWELS. All Rights Reserved.</Text>
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
    justifyContent: "space-between",
    marginBottom: 40,
    gap: 20,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    color: "#888",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 1,
  },
  link: {
    color: "#ccc",
    marginBottom: 10,
  },
  socials: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
    gap: 20,
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3d2b1a",
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: "#3d2b1a",
    paddingTop: 25,
    alignItems: "center",
  },
  copyright: {
    color: "#777",
    fontSize: 11,
  },
});

export default Footer;
