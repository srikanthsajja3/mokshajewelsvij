import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { FontAwesome5 } from '@expo/vector-icons';

const CATEGORIES = ["All", "Gold", "Diamonds", "Polki", "Kundan"];
const SUB_CATEGORIES = ["All Items", "Hangings", "Bajubands", "Ear Rings", "Necklaces", "Rings", "Bangles", "Chains"];

export type SortOption = 
  | "popularity" 
  | "rating" 
  | "latest" 
  | "price_low" 
  | "price_high" 
  | "weight_low" 
  | "weight_high";

export const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Popularity", value: "popularity" },
  { label: "Rating", value: "rating" },
  { label: "Latest", value: "latest" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
  { label: "Weight: Low to High", value: "weight_low" },
  { label: "Weight: High to Low", value: "weight_high" },
];

interface CategoryBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  activeSubCategory?: string;
  onSelectSubCategory?: (subCategory: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onPressFilter: () => void;
  activeFilterCount: number;
}

const MAX_CONTENT_WIDTH = Platform.OS === 'web' ? '98%' : 1200;

const CategoryBar: React.FC<CategoryBarProps> = ({ 
  activeCategory, 
  onSelectCategory,
  activeSubCategory = "All Items",
  onSelectSubCategory,
  sortBy,
  onSortChange,
  onPressFilter,
  activeFilterCount
}) => {
  const { width } = useWindowDimensions();
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showSubCategoryOptions, setShowSubCategoryOptions] = useState(false);
  const isMobile = width < 768;

  const closeAll = () => {
    setShowSortOptions(false);
    setShowCategoryOptions(false);
    setShowSubCategoryOptions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.centerWrapper}>
          {/* Left: Collections & SubFilters */}
          <View style={styles.leftGroup}>
            <View style={styles.dropdownSection}>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => {
                  const current = showCategoryOptions;
                  closeAll();
                  setShowCategoryOptions(!current);
                }}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {isMobile ? activeCategory : `Collection: ${activeCategory}`} ▾
                </Text>
              </TouchableOpacity>

              {showCategoryOptions && (
                <View style={[styles.dropdown, { left: 0 }]}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity 
                      key={cat}
                      style={[styles.dropdownOption, activeCategory === cat && styles.activeOption]}
                      onPress={() => {
                        onSelectCategory(cat);
                        closeAll();
                      }}
                    >
                      <Text style={[styles.optionText, activeCategory === cat && styles.activeOptionText]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.dropdownSection, { marginLeft: isMobile ? 5 : 10 }]}>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => {
                  const current = showSubCategoryOptions;
                  closeAll();
                  setShowSubCategoryOptions(!current);
                }}
              >
                <Text style={styles.dropdownButtonText} numberOfLines={1}>
                  {isMobile ? activeSubCategory : `Type: ${activeSubCategory}`} ▾
                </Text>
              </TouchableOpacity>

              {showSubCategoryOptions && (
                <View style={[styles.dropdown, { left: 0 }]}>
                  {SUB_CATEGORIES.map((sub) => (
                    <TouchableOpacity 
                      key={sub}
                      style={[styles.dropdownOption, activeSubCategory === sub && styles.activeOption]}
                      onPress={() => {
                        onSelectSubCategory?.(sub);
                        closeAll();
                      }}
                    >
                      <Text style={[styles.optionText, activeSubCategory === sub && styles.activeOptionText]}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Right: Filter & Sort */}
          <View style={styles.rightGroup}>
            <TouchableOpacity 
              style={[styles.actionButton, activeFilterCount > 0 && styles.activeActionButton]} 
              onPress={onPressFilter}
            >
              <FontAwesome5 name="filter" size={isMobile ? 10 : 12} color={activeFilterCount > 0 ? "#000" : "#D4AF37"} />
              {!isMobile && (
                <Text style={[styles.actionButtonText, activeFilterCount > 0 && styles.activeActionButtonText]}>
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dropdownSection}>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => {
                  const current = showSortOptions;
                  closeAll();
                  setShowSortOptions(!current);
                }}
              >
                <Text style={styles.dropdownButtonText}>
                  {isMobile ? "Sort" : `Sort: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`} ▾
                </Text>
              </TouchableOpacity>

              {showSortOptions && (
                <View style={[styles.dropdown, { right: 0 }]}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity 
                      key={option.value}
                      style={[styles.dropdownOption, sortBy === option.value && styles.activeOption]}
                      onPress={() => {
                        onSortChange(option.value);
                        closeAll();
                      }}
                    >
                      <Text style={[styles.optionText, sortBy === option.value && styles.activeOptionText]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#291c0e",
    borderBottomWidth: 1,
    borderBottomColor: "#4a3520",
    zIndex: 1000,
    ...Platform.select({
      web: { position: 'sticky' as any, top: 0 },
      ios: { zIndex: 1000 },
      android: { elevation: 10 }
    })
  },
  innerContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  centerWrapper: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownSection: {
    position: "relative",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#3d2b1a",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  dropdownButtonText: {
    color: "#D4AF37",
    fontSize: Platform.OS === 'web' ? 12 : 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#3d2b1a",
    gap: 8,
  },
  activeActionButton: {
    backgroundColor: "#D4AF37",
    borderColor: "#D4AF37",
  },
  actionButtonText: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "600",
  },
  activeActionButtonText: {
    color: "#000",
  },
  dropdown: {
    position: "absolute",
    top: 45,
    width: 180,
    backgroundColor: "#3d2b1a",
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
      }
    }),
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.1)",
  },
  activeOption: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  optionText: {
    color: "#ccc",
    fontSize: 12,
  },
  activeOptionText: {
    color: "#D4AF37",
    fontWeight: "bold",
  },
});

export default CategoryBar;
