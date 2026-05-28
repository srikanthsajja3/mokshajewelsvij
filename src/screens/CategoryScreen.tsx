import React, { useRef, useState } from "react";
import { StyleSheet, View, Animated, useWindowDimensions } from "react-native";
import Header from "../components/Header";
import CategoryBar, { SortOption } from "../components/CategoryBar";
import ProductList from "../components/ProductList";
import FilterModal from "../components/FilterModal";
import Footer from "../components/Footer";
import { Product, ProductFilters } from "../data/products";

import { useNavigation, useRoute, RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

interface CategoryScreenProps {
  scrollY?: Animated.Value;
}

const CategoryScreen: React.FC<CategoryScreenProps> = ({ scrollY: scrollYProp }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Category'>>();
  const category = route.params?.category || "All";
  
  const localScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = scrollYProp || localScrollY;
  
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});

  const onSelectCategory = (cat: string) => navigation.navigate('Category', { category: cat });
  const onSelectProduct = (product: Product) => navigation.navigate('ProductDetails', { id: product.id });

  const activeFilterCount = (
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0) +
    (filters.purity?.length || 0) +
    (filters.metalColor?.length || 0)
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        ref={scrollRef} 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
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
          onPressFilter={() => setIsFilterVisible(true)}
          activeFilterCount={activeFilterCount}
        />
        
        <View style={styles.mainArea}>
          <ProductList 
            category={category} 
            onSelectProduct={onSelectProduct} 
            sortBy={sortBy}
            searchQuery={""} 
            filters={filters}
          />
        </View>

        <Footer />
      </Animated.ScrollView>

      <FilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        filters={filters}
        onApply={(f) => {
          setFilters(f);
          setIsFilterVisible(false);
        }}
        onClear={() => {
          setFilters({});
          setIsFilterVisible(false);
        }}
      />
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
    justifyContent: "flex-start",
  },
  fullWidth: {
    width: "100%",
  },
  mainArea: {
    flex: 1,
  }
});

export default CategoryScreen;
