import React, { useRef, useState } from "react";
import { StyleSheet, View, Animated, useWindowDimensions, Text, Platform, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import Header from "../components/Header";
import { SortOption } from "../components/CategoryBar";
import ProductList from "../components/ProductList";
import OptimizedImage from "../components/OptimizedImage";
import FilterModal from "../components/FilterModal";
import Footer from "../components/Footer";
import { Product, ProductFilters } from "../data/products";

import { useNavigation, useRoute, RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

import { useUI } from "../contexts/UIContext";

interface CategoryScreenProps {
  scrollY?: Animated.Value;
}

const CURATED_SUBCATEGORIES = [
  {
    title: "RING",
    value: "Rings",
    image: "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/LATEST-RINGS.jpeg"
  },
  {
    title: "BRACELET",
    value: "Bangles",
    image: "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/TRENDY_BRACELETS.jpg"
  },
  {
    title: "EARRINGS",
    value: "Ear Rings",
    image: "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/EARRINGS.jpeg"
  },
  {
    title: "CHAINS",
    value: "Chains",
    image: "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/ALL-DAY_CHAINS.jpeg"
  },
  {
    title: "NECKLACE SET",
    value: "Necklaces",
    image: "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/TREND_NECKLACES.jpg"
  },
  {
    title: "POOJA ARTICLES",
    value: "Pooja Articles",
    image: "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/POOJA_ARTICLES.jpg"
  },
  {
    title: "LONG HARAM",
    value: "Haram",
    image: "https://cdnmedia-breeze.vaibhavjewellers.com/media/wysiwyg/Haram.jpg"
  }
];

const CategoryScreen: React.FC<CategoryScreenProps> = ({ scrollY: scrollYProp }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Category'>>();
  const { scrollY: globalScrollY } = useUI();
  const category = route.params?.category || "All";
  const [subCategory, setSubCategory] = useState(route.params?.subCategory || "All Items");
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 1024 && Platform.OS === 'web';
  
  const localScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = scrollYProp || globalScrollY || localScrollY;
  
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    minPrice: route.params?.minPrice,
    maxPrice: route.params?.maxPrice,
  });

  React.useEffect(() => {
    setFilters({
      minPrice: route.params?.minPrice,
      maxPrice: route.params?.maxPrice,
    });
    setSubCategory(route.params?.subCategory || "All Items");
  }, [route.params?.minPrice, route.params?.maxPrice, route.params?.subCategory]);

  const paddingHorz = Platform.OS === 'web'
    ? (width > 1400 ? 30 : 15)
    : (width < 380 ? 8 : 12);

  const CuratedCategoriesRow = () => {
    return (
      <View style={styles.curatedWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.curatedScrollContent, { paddingHorizontal: paddingHorz }]}
        >
          {CURATED_SUBCATEGORIES.map((item, index) => {
            const isActive = subCategory === item.value;
            return (
              <TouchableOpacity
                key={index}
                style={styles.curatedCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (isActive) {
                    setSubCategory("All Items");
                  } else {
                    setSubCategory(item.value);
                  }
                }}
              >
                <View style={[
                  styles.curatedImageContainer,
                  isActive && styles.activeCuratedImageContainer
                ]}>
                  <OptimizedImage
                    url={item.image}
                    style={styles.curatedImage}
                    contentFit="cover"
                    shouldLoad={true}
                  />
                </View>
                <Text style={[
                  styles.curatedLabel,
                  isActive && styles.activeCuratedLabel
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const onSelectCategory = (cat: string) => {
    navigation.navigate('Category', { category: cat });
    setSubCategory("All Items"); // Reset sub-category when main category changes
  };
  
  const onSelectProduct = (product: Product) => navigation.navigate('ProductDetails', { id: product.id });

  const effectiveFilters = {
    ...filters,
    subCategory: subCategory !== "All Items" ? subCategory : undefined
  };

  const activeFilterCount = (
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0) +
    (filters.purity?.length || 0) +
    (filters.metalColor?.length || 0)
  );


  const handleRemovePurity = (p: string) => {
    setFilters(prev => ({
      ...prev,
      purity: prev.purity?.filter(item => item !== p)
    }));
  };

  const handleRemoveColor = (c: string) => {
    setFilters(prev => ({
      ...prev,
      metalColor: prev.metalColor?.filter(item => item !== c)
    }));
  };

  const handleRemovePrice = (type: 'min' | 'max' | 'both') => {
    setFilters(prev => {
      const copy = { ...prev };
      if (type === 'min' || type === 'both') delete copy.minPrice;
      if (type === 'max' || type === 'both') delete copy.maxPrice;
      return copy;
    });
  };

  const handleRemoveSubCategory = () => {
    setSubCategory("All Items");
  };

  const handleClearAll = () => {
    setFilters({});
    setSubCategory("All Items");
  };

  const hasActiveFilters = activeFilterCount > 0 || subCategory !== "All Items";

  const chips = [];

  // Subcategory chip
  if (subCategory !== "All Items") {
    chips.push({
      id: 'subcategory',
      label: subCategory,
      onPress: handleRemoveSubCategory,
    });
  }

  // Price range chip
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
    chips.push({
      id: 'price-both',
      label: `$${filters.minPrice} - $${filters.maxPrice}`,
      onPress: () => handleRemovePrice('both'),
    });
  } else if (filters.minPrice !== undefined) {
    chips.push({
      id: 'price-min',
      label: `>= $${filters.minPrice}`,
      onPress: () => handleRemovePrice('min'),
    });
  } else if (filters.maxPrice !== undefined) {
    chips.push({
      id: 'price-max',
      label: `<= $${filters.maxPrice}`,
      onPress: () => handleRemovePrice('max'),
    });
  }

  // Purity chips
  if (filters.purity && filters.purity.length > 0) {
    filters.purity.forEach(p => {
      chips.push({
        id: `purity-${p}`,
        label: p,
        onPress: () => handleRemovePurity(p),
      });
    });
  }

  // Color chips
  if (filters.metalColor && filters.metalColor.length > 0) {
    filters.metalColor.forEach(c => {
      chips.push({
        id: `color-${c}`,
        label: c,
        onPress: () => handleRemoveColor(c),
      });
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.staticHeaderContainer}>
        {hasActiveFilters && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.activeFiltersScroll, { paddingHorizontal: paddingHorz }]}
            >
              <Text style={styles.activeFiltersText}>Filters:</Text>
              {chips.map(chip => (
                <TouchableOpacity 
                  key={chip.id} 
                  style={styles.filterChip} 
                  onPress={chip.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterChipText}>{chip.label}</Text>
                  <FontAwesome5 name="times" size={10} color="#D4AF37" style={styles.filterChipClose} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.clearAllFiltersBtn}
                onPress={handleClearAll}
                activeOpacity={0.7}
              >
                <Text style={styles.clearAllFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <ProductList 
          category={category} 
          onSelectProduct={onSelectProduct} 
          sortBy={sortBy}
          searchQuery={""} 
          filters={effectiveFilters}
          ListHeaderComponent={<CuratedCategoriesRow />}
          onClearFilters={handleClearAll}
          hasSidebar={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      </View>

      <FilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        filters={filters}
        onApply={(f) => {
          setFilters(f);
          setIsFilterVisible(false);
        }}
        onClear={handleClearAll}
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
  },
  heroContainer: {
    width: '100%',
    backgroundColor: '#1a1209',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 2500,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sidebarContainer: {
    width: 260,
    marginRight: 24,
  },
  gridContainer: {
    flex: 1,
  },
  sidebar: {
    backgroundColor: '#1a1209',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    padding: 20,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 80,
        maxHeight: 'calc(100vh - 120px)',
      }
    } as any)
  },
  sidebarTitle: {
    fontFamily: 'TrajanPro',
    color: '#D4AF37',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    paddingBottom: 8,
  },
  sidebarSection: {
    marginBottom: 24,
  },
  sidebarSectionTitle: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sidebarPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarPriceInput: {
    flex: 1,
    backgroundColor: '#291c0e',
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 4,
    padding: 8,
    color: '#fff',
    fontSize: 12,
    minWidth: 0,
  },
  sidebarPriceSeparator: {
    color: '#666',
    fontSize: 11,
  },
  sidebarCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sidebarCheckbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sidebarCheckboxChecked: {
    backgroundColor: '#D4AF37',
  },
  sidebarCheckboxLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  sidebarCheckboxLabelActive: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  sidebarClearBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  sidebarClearBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  staticHeaderContainer: {
    width: '100%',
    zIndex: 1000,
    backgroundColor: '#1a1209',
  },
  activeFiltersContainer: {
    backgroundColor: '#150e06',
    borderBottomWidth: 1,
    borderColor: '#3d2b1a',
    paddingVertical: 8,
  },
  activeFiltersScroll: {
    alignItems: 'center',
    gap: 8,
  },
  activeFiltersText: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginRight: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  filterChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  filterChipClose: {
    marginLeft: 2,
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearAllFiltersText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  curatedWrapper: {
    backgroundColor: "#1a1209",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.08)",
    paddingVertical: 18,
    width: "100%",
  },
  curatedScrollContent: {
    gap: 16,
    alignItems: 'center',
    ...Platform.select({
      web: {
        justifyContent: 'center',
        flexWrap: 'nowrap',
        width: '100%',
      },
      default: {}
    })
  },
  curatedCard: {
    alignItems: "center",
    width: 80,
  },
  curatedImageContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.15)",
    overflow: "hidden",
    backgroundColor: "#150d05",
    marginBottom: 8,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }
    })
  },
  activeCuratedImageContainer: {
    borderColor: "#D4AF37",
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  curatedImage: {
    width: "100%",
    height: "100%",
  },
  curatedLabel: {
    color: "#888",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
  },
  activeCuratedLabel: {
    color: "#D4AF37",
    fontWeight: "bold",
  },
});

export default CategoryScreen;
