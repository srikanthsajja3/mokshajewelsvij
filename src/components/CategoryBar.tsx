import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

const CATEGORIES = ["All", "Rings", "Necklaces", "Earrings", "Bracelets", "Bangles", "Pendants", "Sets"];

interface CategoryBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ activeCategory, onSelectCategory }) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    backgroundColor: "#291c0e",
    borderBottomWidth: 1,
    borderBottomColor: "#4a3520",
  },
  scroll: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 15,
    borderRadius: 20,
    backgroundColor: "#3d2b1a",
    borderWidth: 1,
    borderColor: "#4a3520",
  },
  activeItem: {
    backgroundColor: "#D4AF37", // Gold for active category
    borderColor: "#D4AF37",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D4AF37",
  },
  activeText: {
    color: "#291c0e", // Dark text on gold background
  },
});

export default CategoryBar;
