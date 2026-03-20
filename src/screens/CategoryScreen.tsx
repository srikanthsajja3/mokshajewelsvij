import React, { useRef, useState } from "react";
import { StyleSheet, View, ScrollView, useWindowDimensions } from "react-native";
import Header from "../components/Header";
import CategoryBar, { SortOption } from "../components/CategoryBar";
import ProductList from "../components/ProductList";
import Footer from "../components/Footer";
import { Product } from "../data/products";

interface CategoryScreenProps {
  category: string;
  onSelectCategory: (cat: string) => void;
  onSelectProduct: (product: Product) => void;
  onGoHome: () => void;
  onPressLogin: () => void;
  onPressCart: () => void;
  onPressOrders: () => void;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({ 
  category, 
  onSelectCategory, 
  onSelectProduct, 
  onGoHome, 
  onPressLogin, 
  onPressCart,
  onPressOrders
}) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popularity");

  return (
    <View style={styles.container}>
      <Header 
        onPressLogo={onGoHome} 
        onPressLogin={onPressLogin} 
        onPressCart={onPressCart} 
        onPressOrders={onPressOrders}
      />

      <ScrollView 
        ref={scrollRef} 
        stickyHeaderIndices={[0]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CategoryBar 
          activeCategory={category} 
          onSelectCategory={(cat) => {
            onSelectCategory(cat);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }} 
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        <View style={styles.fullWidth}>
          <View style={styles.mainArea}>
            <ProductList 
              category={category} 
              onSelectProduct={onSelectProduct} 
              sortBy={sortBy}
            />
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
