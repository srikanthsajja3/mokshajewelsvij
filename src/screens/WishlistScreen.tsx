import React, { useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Animated } from "react-native";
import Footer from "../components/Footer";
import ProductList from "../components/ProductList";
import { useWishlist } from "../contexts/WishlistContext";
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useUI } from '../contexts/UIContext';

interface WishlistScreenProps {
  scrollY?: Animated.Value;
  searchQuery?: string;
}

const WishlistScreen: React.FC<WishlistScreenProps> = ({ scrollY: scrollYProp, searchQuery }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { setLoginVisible, scrollY: globalScrollY } = useUI();
  const { wishlist, isLoading: wishlistLoading } = useWishlist();

  const localScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = scrollYProp || globalScrollY || localScrollY;

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.title}>Your Wishlist</Text>
      <Text style={styles.subtitle}>Reserved masterpieces waiting for you.</Text>
    </View>
  );

  if (!wishlistLoading && wishlist.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your wishlist is empty.</Text>
          <TouchableOpacity style={styles.exploreButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.exploreButtonText}>Explore Collections</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProductList 
        category="Wishlist" 
        onSelectProduct={(product) => navigation.navigate('ProductDetails', { id: product.id })} 
        sortBy="popularity"
        searchQuery={searchQuery}
        onPressLogin={() => setLoginVisible(true)}
        ListHeaderComponent={<ListHeader />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#291c0e",
  },
  headerSection: {
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
  },
  title: {
    fontFamily: "TrajanPro",
    fontSize: 28,
    color: "#D4AF37",
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 18,
    marginBottom: 30,
  },
  exploreButton: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 4,
  },
  exploreButtonText: {
    color: "#D4AF37",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  }
});

export default WishlistScreen;
