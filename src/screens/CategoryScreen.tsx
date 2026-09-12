import React, { useRef, useState } from "react";
import { StyleSheet, View, Animated, useWindowDimensions, Text, Platform, ScrollView, TouchableOpacity } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';
import Header from "../components/Header";
import { SortOption } from "../components/CategoryBar";
import ProductList from "../components/ProductList";
import CategorySlider from "../components/CategorySlider";
import CollectionToolbar from "../components/CollectionToolbar";
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
  const { scrollY: globalScrollY, searchQuery, setSearchQuery } = useUI();
  const category = route.params?.category || "All";
  const [subCategory, setSubCategory] = useState(route.params?.subCategory || "All Items");
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pageMargin = isMobile ? 16 : Math.round(width * 0.10);
  const gridPadding = pageMargin;
  const paddingHorz = pageMargin;

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

  const onSelectProduct = (product: Product) => {
    setSearchQuery("");
    navigation.navigate('ProductDetails', { id: product.id });
  };

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
    let displayLabel = subCategory;
    if (subCategory.includes(':')) {
      const parts = subCategory.split(':');
      displayLabel = `${parts[0]} - ${parts[1]}`;
    }
    chips.push({
      id: 'subcategory',
      label: displayLabel,
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

  const [userColumns, setUserColumns] = useState<number>(4);

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
                  <FontAwesome5 name="times" size={9} color="#D4AF37" style={styles.filterChipClose} />
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
          searchQuery={searchQuery} 
          filters={effectiveFilters}
          userColumns={userColumns}
          horizontalMargin={pageMargin}
          ListHeaderComponent={(count: number) => (
            <View style={Platform.OS === 'web' ? { zIndex: 9999, position: 'relative', overflow: 'visible' } : undefined}>
              <CategorySlider 
                hideTitle={true} 
                activeSubCategory={subCategory} 
                onSelectSubCategory={setSubCategory} 
                contentPadding={gridPadding}
              />
              <View style={{ paddingHorizontal: pageMargin }}>
                <CollectionToolbar
                  productCount={count}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onPressFilter={() => setIsFilterVisible(true)}
                  activeFilterCount={activeFilterCount}
                  currentColumns={userColumns || 4}
                  onColumnsChange={setUserColumns}
                />
              </View>
            </View>
          )}
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
    paddingVertical: 4,
  },
  activeFiltersScroll: {
    alignItems: 'center',
    gap: 6,
  },
  activeFiltersText: {
    color: '#888',
    fontSize: 10,
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
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    gap: 4,
  },
  filterChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  filterChipClose: {
    marginLeft: 2,
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  clearAllFiltersText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  categoriesSelectorContainer: {
    backgroundColor: "#1a1209",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
    width: "100%",
  },
  categoriesScrollContent: {
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        flexWrap: 'nowrap',
      },
      default: {}
    })
  },
  categoryBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#201409',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    })
  },
  activeCategoryBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  categoryBadgeText: {
    color: 'rgba(212, 175, 55, 0.6)',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
  },
  activeCategoryBadgeText: {
    color: '#D4AF37',
  },
  hoverCategoryBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  hoverCategoryBadgeText: {
    color: '#D4AF37',
  },
});

export default CategoryScreen;
