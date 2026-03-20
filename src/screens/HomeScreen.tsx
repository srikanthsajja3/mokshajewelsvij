import React, { useRef } from "react";
import { StyleSheet, View, ScrollView, useWindowDimensions, Text, TouchableOpacity, ImageBackground } from "react-native";
import Header from "../components/Header";
import ImageScroller from "../components/ImageScroller";
import Footer from "../components/Footer";

interface HomeScreenProps {
  onSelectCategory: (category: string) => void;
  onGoHome: () => void;
  onPressLogin: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectCategory, onGoHome, onPressLogin }) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const isLargeScreen = width > 768;

  return (
    <View style={styles.container}>
      <Header onPressLogo={onGoHome} onPressLogin={onPressLogin} />

      <ScrollView 
        ref={scrollRef} 
        stickyHeaderIndices={[1]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.fullWidth}>
          <ImageScroller />
          
          
          
          <View style={styles.mainArea}>
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Crafted for Eternity</Text>
              <Text style={styles.sectionSubtitle}>Discover our latest masterpieces handcrafted with passion.</Text>
              
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => onSelectCategory("All")}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreButtonText}>View All Products</Text>
              </TouchableOpacity>
            </View>

            {/* Visual Promo Banner */}
            
          </View>

          <Footer />
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
  },
  fullWidth: {
    width: "100%",
  },
  mainArea: {
    flex: 1,
    paddingVertical: 40,
  },
  featuredSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
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
  promoContainer: {
    width: "100%",
    overflow: "hidden",
  },
  promoImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  promoOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  promoText: {
    fontFamily: "TrajanPro",
    color: "#fff",
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
  },
  promoLink: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  }
});

export default HomeScreen;
