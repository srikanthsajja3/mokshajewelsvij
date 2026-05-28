import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ScrollView } from "react-native";

import { FontAwesome5 } from '@expo/vector-icons';

const CATEGORIES = ["All", "Gold", "Diamonds", "Polki", "Kundan"];

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
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onPressFilter: () => void;
  activeFilterCount: number;
}

const MAX_CONTENT_WIDTH = Platform.OS === 'web' ? '95%' : 1200;
const MAX_PX_WIDTH = 2500;

const CategoryBar: React.FC<CategoryBarProps> = ({ 
  activeCategory, 
  onSelectCategory,
  sortBy,
  onSortChange,
  onPressFilter,
  activeFilterCount
}) => {
  const { width } = useWindowDimensions();
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const isMobile = width < 600;

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.centerWrapper}>
          {/* Categories Section */}
          <View style={styles.dropdownSection}>
            <TouchableOpacity 
              style={styles.dropdownButton} 
              onPress={() => {
                setShowCategoryOptions(!showCategoryOptions);
                setShowSortOptions(false);
              }}
            >
              <Text style={styles.dropdownButtonText}>
                {isMobile ? `${activeCategory} ▾` : `Category: ${activeCategory} ▾`}
              </Text>
            </TouchableOpacity>

            {showCategoryOptions ? (
              <View style={[styles.dropdown, { left: 0, right: 'auto' }]}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity 
                    key={cat}
                    style={[styles.dropdownOption, activeCategory === cat && styles.activeOption]}
                    onPress={() => {
                      onSelectCategory(cat);
                      setShowCategoryOptions(false);
                    }}
                  >
                    <Text style={[styles.optionText, activeCategory === cat && styles.activeOptionText]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {/* Actions Section (Filter + Sort) */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={[styles.actionButton, activeFilterCount > 0 && styles.activeActionButton]} 
              onPress={onPressFilter}
            >
              <FontAwesome5 name="filter" size={12} color={activeFilterCount > 0 ? "#000" : "#D4AF37"} style={{ marginRight: 8 }} />
              <Text style={[styles.actionButtonText, activeFilterCount > 0 && styles.activeActionButtonText]}>
                {isMobile ? "Filter" : `Filter${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
              </Text>
            </TouchableOpacity>

            <View style={styles.dropdownSection}>
              <TouchableOpacity 
                style={styles.dropdownButton} 
                onPress={() => {
                  setShowSortOptions(!showSortOptions);
                  setShowCategoryOptions(false);
                }}
              >
                <Text style={styles.dropdownButtonText}>
                  {isMobile ? "Sort ▾" : `Sort: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label} ▾`}
                </Text>
              </TouchableOpacity>

              {showSortOptions ? (
                <View style={styles.dropdown}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity 
                      key={option.value}
                      style={[styles.dropdownOption, sortBy === option.value && styles.activeOption]}
                      onPress={() => {
                        onSortChange(option.value);
                        setShowSortOptions(false);
                      }}
                    >
                      <Text style={[styles.optionText, sortBy === option.value && styles.activeOptionText]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
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
      ios: { zIndex: 1000 },
      android: { elevation: 10 }
    })
  },
  innerContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  centerWrapper: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoriesScroll: {
    flex: 1,
    marginRight: 10,
  },
  categoriesSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    borderRadius: 4,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeItem: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  activeText: {
    color: "#D4AF37",
  },
  actionsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: "#3d2b1a",
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
  dropdownSection: {
    position: "relative",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: "#3d2b1a",
  },
  dropdownButtonText: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "600",
  },
  dropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 180,
    backgroundColor: "#3d2b1a",
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.1)",
  },
  activeOption: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  optionText: {
    color: "#aaa",
    fontSize: 12,
  },
  activeOptionText: {
    color: "#D4AF37",
    fontWeight: "bold",
  },
});

export default CategoryBar;
