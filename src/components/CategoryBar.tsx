import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, ScrollView } from "react-native";
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
  const isMobile = width < 1024;

  const paddingHorz = Platform.OS === 'web'
    ? (width > 1400 ? 30 : 15)
    : (width < 380 ? 8 : 12);

  const closeAll = () => {
    setShowSortOptions(false);
    setShowCategoryOptions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={[styles.topRow, { paddingLeft: paddingHorz, paddingRight: paddingHorz }]}>
          {/* Main Collection - Row of tabs on Desktop, Dropdown on Mobile */}
          {!isMobile ? (
            <View style={styles.categoriesTabRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  style={[styles.categoryTab, activeCategory === cat && styles.activeCategoryTab]}
                  onPress={() => {
                    onSelectCategory(cat);
                    closeAll();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryTabText, activeCategory === cat && styles.activeCategoryTabText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
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
                  {activeCategory} Collection ▾
                </Text>
              </TouchableOpacity>

              {showCategoryOptions && (
                <>
                  <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={closeAll} 
                  />
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
                </>
              )}
            </View>
          )}

          {/* Right: Filter & Sort */}
          <View style={styles.rightGroup}>
            <TouchableOpacity 
              style={[styles.actionButton, activeFilterCount > 0 && styles.activeActionButton]} 
              onPress={onPressFilter}
            >
              <FontAwesome5 name="filter" size={isMobile ? 10 : 12} color={activeFilterCount > 0 ? "#000" : "#D4AF37"} />
              <Text style={[styles.actionButtonText, activeFilterCount > 0 && styles.activeActionButtonText]}>
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
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
                  {isMobile ? "Sort ▾" : `Sort: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label} ▾`}
                </Text>
              </TouchableOpacity>

              {showSortOptions && (
                <>
                  <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={closeAll} 
                  />
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
                </>
              )}
            </View>
          </View>
        </View>

        {/* Scrollable Sub-Category Pills */}
        <View style={styles.subCategoryRow}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.pillScrollContent, { paddingLeft: paddingHorz, paddingRight: paddingHorz, minWidth: '100%', justifyContent: isMobile ? 'flex-start' : 'space-between' }]}
          >
            {SUB_CATEGORIES.map((sub) => (
              <TouchableOpacity 
                key={sub}
                style={[styles.pill, activeSubCategory === sub && styles.activePill]}
                onPress={() => onSelectSubCategory?.(sub)}
              >
                <Text style={[styles.pillText, activeSubCategory === sub && styles.activePillText]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1209", // Darker background to separate from product list
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
    paddingVertical: 10,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    zIndex: 10,
    ...Platform.select({
      ios: { zIndex: 10 },
      android: { elevation: 10 },
      web: { zIndex: 10 }
    })
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subCategoryRow: {
    zIndex: 1,
    ...Platform.select({
      ios: { zIndex: 1 },
      android: { elevation: 1 },
      web: { zIndex: 1 }
    })
  },
  pillScrollContent: {
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#291c0e",
    borderWidth: 1,
    borderColor: "#4a3520",
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderColor: "#D4AF37",
  },
  pillText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  activePillText: {
    color: "#D4AF37",
  },
  dropdownSection: {
    position: "relative",
    zIndex: 2000,
  },
  dropdownButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownButtonText: {
    color: "#D4AF37",
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#291c0e",
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
  backdrop: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      default: {
        position: 'absolute',
        top: -2000,
        left: -2000,
        right: -2000,
        bottom: -2000,
      }
    }),
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
  dropdown: {
    position: "absolute",
    top: 40,
    width: 200,
    backgroundColor: "#291c0e",
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 8,
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 9999,
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
  categoriesTabRow: {
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
  },
  categoryTab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeCategoryTab: {
    borderBottomColor: "#D4AF37",
  },
  categoryTabText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  activeCategoryTabText: {
    color: "#D4AF37",
  },
});

export default CategoryBar;
