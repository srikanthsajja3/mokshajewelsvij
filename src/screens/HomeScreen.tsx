import React, { useRef } from "react";
import { StyleSheet, View, useWindowDimensions, Text, TouchableOpacity, Animated, Platform } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import Header from "../components/Header";
import ImageScroller from "../components/ImageScroller";
import Footer from "../components/Footer";

import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

import { useUI } from "../contexts/UIContext";

interface HomeScreenProps {
  scrollY?: Animated.Value;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ scrollY: scrollYProp }) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { scrollY: globalScrollY } = useUI();
  
  const localScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = scrollYProp || globalScrollY || localScrollY;

  const navigateToCategory = (cat: string) => navigation.navigate('Category', { category: cat });
  const navigateToProduct = (product: any) => navigation.navigate('ProductDetails', { id: product.id });
  
  const isMobile = width < 768;

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <ImageScroller />
          
          <View style={styles.mainArea}>
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Crafted for Eternity</Text>
              <Text style={styles.sectionSubtitle}>Discover our latest masterpieces handcrafted with passion.</Text>
              
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => navigateToCategory("Gold")}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreButtonText}>View All Products</Text>
              </TouchableOpacity>
            </View>

            {/* Pillars Section */}
            <View style={styles.pillarsContainer}>
              <View style={styles.pillars}>
                <View style={styles.pillarItem}>
                  <FontAwesome5 name="gem" size={18} color="#D4AF37" style={styles.pillarIcon} />
                  <Text style={styles.pillarTitle}>100% Purity</Text>
                  <Text style={styles.pillarText} numberOfLines={2}>BIS Gold & Diamonds</Text>
                </View>
                <View style={styles.pillarItem}>
                  <FontAwesome5 name="magic" size={18} color="#D4AF37" style={styles.pillarIcon} />
                  <Text style={styles.pillarTitle}>Unique Design</Text>
                  <Text style={styles.pillarText} numberOfLines={2}>Bridal Boutique</Text>
                </View>
                <View style={styles.pillarItem}>
                  <FontAwesome5 name="medal" size={18} color="#D4AF37" style={styles.pillarIcon} />
                  <Text style={styles.pillarTitle}>Legacy</Text>
                  <Text style={styles.pillarText} numberOfLines={2}>Crafting Elegance</Text>
                </View>
              </View>
            </View>

            {/* About Section */}
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Premier Jewelry Store in Vijayawada</Text>
              <Text style={styles.aboutText}>
                Explore our exclusive collections of 100% BIS Hallmarked 22k Gold ornaments, 
                IGI/GIA Certified shaped Diamonds, handcrafted Kundan, and traditional Polki. 
                From signature divine masterworks to heavy bridal chokers, we offer unique boutique designs for every occasion.
              </Text>
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    paddingVertical: 40,
  },
  featuredSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 60,
  },
  sectionTitle: {
    fontFamily: "TrajanPro",
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 4,
  },
  exploreButtonText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  pillarsContainer: {
    paddingVertical: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
    backgroundColor: "rgba(0,0,0,0.2)",
    marginBottom: 60,
  },
  pillars: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    flexWrap: "nowrap", // Ensure they stay in one line
    paddingHorizontal: 10,
  },
  pillarItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  pillarIcon: {
    marginBottom: 15,
  },
  pillarTitle: {
    fontFamily: "TrajanPro",
    fontSize: 12,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },
  pillarText: {
    fontSize: 10,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 14,
  },
  aboutSection: {
    paddingHorizontal: 30,
    alignItems: "center",
    marginBottom: 60,
  },
  aboutTitle: {
    fontFamily: "TrajanPro",
    fontSize: 20,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
  },
  aboutText: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 800,
    fontStyle: "italic",
  },
});

export default HomeScreen;
