import React, { useState, useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView } from "react-native";
import { Product, PRODUCTS } from "../data/products";
import { useCountry } from "../contexts/CountryContext";
import { formatPrice } from "../utils/currency";

interface ProductListProps {
  category: string;
  onSelectProduct: (product: Product) => void;
}

type SortOption = 
  | "popularity" 
  | "rating" 
  | "latest" 
  | "price_low" 
  | "price_high" 
  | "weight_low" 
  | "weight_high";

const ProductList: React.FC<ProductListProps> = ({ category, onSelectProduct }) => {
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: "Sort by popularity", value: "popularity" },
    { label: "Sort by average rating", value: "rating" },
    { label: "Sort by latest", value: "latest" },
    { label: "Sort by price: low to high", value: "price_low" },
    { label: "Sort by price: high to low", value: "price_high" },
    { label: "Sort by weight: low to high", value: "weight_low" },
    { label: "Sort by weight: high to low", value: "weight_high" },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    let result = category === "All" 
      ? [...PRODUCTS] 
      : PRODUCTS.filter(p => p.category === category);

    switch (sortBy) {
      case "popularity":
        result.sort((a, b) => b.popularity - a.popularity);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "latest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "weight_low":
        result.sort((a, b) => a.grossWeight - b.grossWeight);
        break;
      case "weight_high":
        result.sort((a, b) => b.grossWeight - a.grossWeight);
        break;
    }
    return result;
  }, [category, sortBy]);

  let numColumns = 2;
  if (width > 1400) numColumns = 6;
  else if (width > 1200) numColumns = 5;
  else if (width > 900) numColumns = 4;
  else if (width > 600) numColumns = 3;

  const spacing = 15;
  const padding = 20;
  const itemWidth = (width - (padding * 2) - (spacing * (numColumns - 1))) / numColumns;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{category} Collection</Text>
        
        <View style={styles.sortContainer}>
          <TouchableOpacity 
            style={styles.sortButton} 
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Text style={styles.sortButtonText}>
              {sortOptions.find(o => o.value === sortBy)?.label} ▾
            </Text>
          </TouchableOpacity>
          
          {showSortOptions && (
            <View style={styles.dropdown}>
              {sortOptions.map((option) => (
                <TouchableOpacity 
                  key={option.value}
                  style={[styles.dropdownOption, sortBy === option.value && styles.activeOption]}
                  onPress={() => {
                    setSortBy(option.value);
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

      <View style={styles.grid}>
        {filteredAndSortedProducts.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.productCard, { width: itemWidth }]}
            activeOpacity={0.8}
            onPress={() => onSelectProduct(item)}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productWeight}>{item.grossWeight.toFixed(2)}g | {item.purity}</Text>
              <Text style={styles.productPrice}>{formatPrice(item.price, countryCode)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {filteredAndSortedProducts.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found in this category.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#291c0e",
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    zIndex: 10,
  },
  title: {
    fontFamily: "TrajanPro",
    fontSize: 22,
    color: "#fff",
    textTransform: "uppercase",
    flex: 1,
  },
  sortContainer: {
    width: 220,
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
    width: "100%",
    backgroundColor: "#3d2b1a",
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  productCard: {
    backgroundColor: "#3d2b1a",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#4a3520",
  },
  productImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productWeight: {
    color: "#888",
    fontSize: 10,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  productPrice: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    fontStyle: "italic",
  },
});

export default ProductList;
