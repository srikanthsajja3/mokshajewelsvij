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
  onPressWishlist: () => void;
  onPressProfile: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

const CategoryScreen: React.FC<CategoryScreenProps> = (props) => {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popularity");

  return (
    <View style={styles.container}>
      <Header {...props} />

      <ScrollView 
        ref={scrollRef} 
        stickyHeaderIndices={[0]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CategoryBar 
          activeCategory={props.category} 
          onSelectCategory={(cat) => {
            props.onSelectCategory(cat);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          }} 
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        <View style={styles.fullWidth}>
          <View style={styles.mainArea}>
            <ProductList 
              category={props.category} 
              onSelectProduct={props.onSelectProduct} 
              sortBy={sortBy}
              searchQuery={props.searchQuery}
              onPressLogin={props.onPressLogin}
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
