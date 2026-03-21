import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ScrollView } from "react-native";

const CATEGORIES = ["Gold", "Diamonds"];

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
}

const CategoryBar: React.FC<CategoryBarProps> = ({ 
  activeCategory, 
  onSelectCategory,
  sortBy,
  onSortChange
}) => {
  const { width } = useWindowDimensions();
  const [showSortOptions, setShowSortOptions] = useState(false);
  const isMobile = width < 600;

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Categories Section */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesSection}
        >
          {CATEGORIES.map((cat, idx) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.categoryItem, isActive && styles.activeItem]} 
                onPress={() => onSelectCategory(cat)}
              >
                <Text style={[styles.categoryText, isActive && styles.activeText]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort Section */}
        <View style={styles.sortSection}>
          <TouchableOpacity 
            style={styles.sortButton} 
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Text style={styles.sortButtonText}>
              {isMobile ? "Sort ▾" : `Sort: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label} ▾`}
            </Text>
          </TouchableOpacity>

          {showSortOptions && (
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
          )}
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
    zIndex: 1000, // Ensure dropdown is on top
    ...Platform.select({
      ios: { zIndex: 1000 },
      android: { elevation: 10 }
    })
  },
  innerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
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
    paddingHorizontal: 15,
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  activeText: {
    color: "#D4AF37",
  },
  sortSection: {
    position: "relative",
  },
  sortButton: {
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: "#3d2b1a",
  },
  sortButtonText: {
    color: "#D4AF37",
    fontSize: 12,
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
