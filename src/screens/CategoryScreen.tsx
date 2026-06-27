import React, { useRef, useState } from "react";
import { StyleSheet, View, Animated, useWindowDimensions, Text, Platform, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import Header from "../components/Header";
import { SortOption } from "../components/CategoryBar";
import ProductList from "../components/ProductList";
import FilterModal from "../components/FilterModal";
import Footer from "../components/Footer";
import { Product, ProductFilters } from "../data/products";

import { useNavigation, useRoute, RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

import { useUI } from "../contexts/UIContext";

interface CategoryScreenProps {
  scrollY?: Animated.Value;
}

const CATEGORIES = ["All", "Gold", "Diamonds", "Polki", "Kundan"];

const CategoryScreen: React.FC<CategoryScreenProps> = ({ scrollY: scrollYProp }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Category'>>();
  const { scrollY: globalScrollY } = useUI();
  const category = route.params?.category || "All";
  const [subCategory, setSubCategory] = useState(route.params?.subCategory || "All Items");
  const { width } = useWindowDimensions();
  
  const localScrollY = useRef(new Animated.Value(0)).current;
  const scrollY = scrollYProp || globalScrollY || localScrollY;
  
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    minPrice: route.params?.minPrice,
    maxPrice: route.params?.maxPrice,
  });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

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

  const CategoriesSelectorBar = () => {
    return (
      <View style={styles.categoriesSelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoriesScrollContent, { paddingHorizontal: paddingHorz }]}
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat;
            const isHovered = hoveredCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBadge, 
                  isActive && styles.activeCategoryBadge,
                  Platform.OS === 'web' && isHovered && styles.hoverCategoryBadge
                ]}
                onPress={() => onSelectCategory(cat)}
                activeOpacity={0.7}
                // @ts-ignore
                onMouseEnter={() => setHoveredCategory(cat)}
                // @ts-ignore
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Text style={[
                  styles.categoryBadgeText, 
                  isActive && styles.activeCategoryBadgeText,
                  Platform.OS === 'web' && isHovered && styles.hoverCategoryBadgeText
                ]}>
                  {cat}
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
          ListHeaderComponent={<CategoriesSelectorBar />}
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
  categoriesSelectorContainer: {
    backgroundColor: "#1a1209",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.08)",
    paddingVertical: 12,
    width: "100%",
  },
  categoriesScrollContent: {
    gap: 8,
    flexDirection: 'row',
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
  categoryBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    backgroundColor: '#201409',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    })
  },
  activeCategoryBadge: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  categoryBadgeText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
  },
  activeCategoryBadgeText: {
    color: '#D4AF37',
  },
  hoverCategoryBadge: {
    borderColor: 'rgba(212, 175, 55, 0.6)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  hoverCategoryBadgeText: {
    color: '#D4AF37',
  },
});

export default CategoryScreen;
