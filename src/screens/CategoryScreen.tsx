import React, { useRef } from "react";
import { StyleSheet, View, ScrollView, useWindowDimensions } from "react-native";
import Header from "../components/Header";
import CategoryBar from "../components/CategoryBar";
import ProductList from "../components/ProductList";
import Footer from "../components/Footer";
import { Product } from "../data/products";

interface CategoryScreenProps {
  category: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (product: Product) => void;
  onGoHome: () => void;
  onPressLogin: () => void;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({ category, onSelectCategory, onSelectProduct, onGoHome, onPressLogin }) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <Header onPressLogo={onGoHome} onPressLogin={onPressLogin} />

      <ScrollView 
        ref={scrollRef} 
        stickyHeaderIndices={[0]} 
        showsVerticalScrollIndicator={false} // Hiding the scrollbar
        contentContainerStyle={styles.scrollContent}
      >
        <CategoryBar 
          activeCategory={category} 
          onSelectCategory={(cat) => {
            onSelectCategory(cat);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }} 
        />
        
        <View style={styles.fullWidth}>
          <View style={styles.mainArea}>
            <ProductList category={category} onSelectProduct={onSelectProduct} />
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
  }
});

export default CategoryScreen;
