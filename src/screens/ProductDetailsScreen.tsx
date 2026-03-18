import React, { useRef } from "react";
import { StyleSheet, View, ScrollView, Text, Image, TouchableOpacity, useWindowDimensions, ViewStyle, Platform } from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Product, PRODUCTS } from "../data/products";
import { useCountry } from "../contexts/CountryContext";
import { formatPrice } from "../utils/currency";

interface ProductDetailsScreenProps {
  product: Product;
  onGoHome: () => void;
  onBack: () => void;
}

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({ product, onGoHome, onBack }) => {
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const scrollRef = useRef<ScrollView>(null);

  const isLargeScreen = width > 768;
  
  const contentStyle: ViewStyle = isLargeScreen 
    ? { width: "100%", alignSelf: "flex-start", flexDirection: "row" as const } 
    : { width: "100%" };

  // Get recommendations (products in same category, excluding current)
  const recommendations = PRODUCTS
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleRecommendationPress = (p: Product) => {
    // We need to navigate to the new product
    // The parent App handles state, but for this simple implementation:
    onBack(); // Go back
    setTimeout(() => {
        // This is a bit of a hack since we don't have a direct "change product" prop here
        // In a real app with a router, this would just be navigate(p.id)
    }, 0);
  };

  return (
    <View style={styles.container}>
      <Header onPressLogo={onGoHome} />

      <ScrollView 
        ref={scrollRef} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainContent, contentStyle]}>
          <View style={[styles.imageColumn, { width: isLargeScreen ? "50%" : "100%" }]}>
            <View style={styles.imageSection}>
              <Image source={{ uri: product.image }} style={styles.mainImage} />
            </View>
          </View>

          <View style={[styles.infoSection, { width: isLargeScreen ? "50%" : "100%" }]}>
            <Text style={styles.categoryBadge}>{product.category}</Text>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCode}>Product Code: {product.productCode}</Text>
            <Text style={styles.price}>{formatPrice(product.price, countryCode)}</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metal Details</Text>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Gross Weight:</Text>
                <Text style={styles.specValue}>{product.grossWeight.toFixed(3)} gram</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Metal Color:</Text>
                <Text style={styles.specValue}>{product.metalColor}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Gold Weight:</Text>
                <Text style={styles.specValue}>{product.goldWeight.toFixed(3)} gram - {product.purity}</Text>
              </View>
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

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Buy Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onBack}>
              <Text style={styles.secondaryButtonText}>Back to Collections</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationTitle}>Recommended for You</Text>
            <View style={styles.recommendationGrid}>
              {recommendations.map((item) => (
                <View key={item.id} style={styles.recommendationCard}>
                  <Image source={{ uri: item.image }} style={styles.recImage} />
                  <View style={styles.recInfo}>
                    <Text style={styles.recName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.recPrice}>{formatPrice(item.price, countryCode)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
  }
});

export default ProductDetailsScreen;
