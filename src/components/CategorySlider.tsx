import React, { useRef, useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  useWindowDimensions,
  Modal
} from "react-native";
import Svg, { 
  Path, 
  Circle, 
  Rect, 
  Ellipse, 
  G, 
  Line 
} from "react-native-svg";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

// Category definitions with their corresponding SVG renderers
const CATEGORIES = [
  {
    name: "Necklace",
    label: "Necklace",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Path d="M20,30 C35,70 65,70 80,30" stroke="#D4AF37" strokeWidth="4.5" strokeLinecap="round" />
        <Path d="M28,35 C38,65 62,65 72,35" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="1,4" strokeLinecap="round" />
        <Circle cx="50" cy="65" r="5" fill="#D4AF37" />
        <Circle cx="38" cy="56" r="3.5" fill="#D4AF37" />
        <Circle cx="62" cy="56" r="3.5" fill="#D4AF37" />
        <Circle cx="28" cy="45" r="2.5" fill="#D4AF37" />
        <Circle cx="72" cy="45" r="2.5" fill="#D4AF37" />
        <Path d="M50,70 L47,78 L50,83 L53,78 Z" fill="#D4AF37" />
      </Svg>
    )
  },
  {
    name: "Earrings",
    label: "Earrings",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <G transform="translate(-10, 0)">
          <Circle cx="35" cy="25" r="4.5" fill="#D4AF37" />
          <Path d="M35,29 L35,40" stroke="#D4AF37" strokeWidth="2.5" />
          <Path d="M23,40 L47,40 C47,52 23,52 23,40 Z" fill="#D4AF37" />
          <Circle cx="26" cy="54" r="1.5" fill="#D4AF37" />
          <Circle cx="31" cy="56" r="1.5" fill="#D4AF37" />
          <Circle cx="35" cy="57" r="1.5" fill="#D4AF37" />
          <Circle cx="39" cy="56" r="1.5" fill="#D4AF37" />
          <Circle cx="44" cy="54" r="1.5" fill="#D4AF37" />
        </G>
        <G transform="translate(10, 0)">
          <Circle cx="65" cy="25" r="4.5" fill="#D4AF37" />
          <Path d="M65,29 L65,40" stroke="#D4AF37" strokeWidth="2.5" />
          <Path d="M53,40 L77,40 C77,52 53,52 53,40 Z" fill="#D4AF37" />
          <Circle cx="56" cy="54" r="1.5" fill="#D4AF37" />
          <Circle cx="61" cy="56" r="1.5" fill="#D4AF37" />
          <Circle cx="65" cy="57" r="1.5" fill="#D4AF37" />
          <Circle cx="69" cy="56" r="1.5" fill="#D4AF37" />
          <Circle cx="74" cy="54" r="1.5" fill="#D4AF37" />
        </G>
      </Svg>
    )
  },
  {
    name: "Lockets",
    label: "Lockets / Pendents",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Circle cx="50" cy="20" r="6" stroke="#D4AF37" strokeWidth="3" />
        <Rect x="48" y="26" width="4" height="10" fill="#D4AF37" />
        <Path d="M50,34 C68,48 72,78 50,88 C28,78 32,48 50,34 Z" fill="#D4AF37" />
        <Path d="M50,44 C60,54 62,72 50,78 C38,72 40,54 50,44 Z" fill="#291c0e" />
        <Circle cx="50" cy="62" r="4" fill="#D4AF37" />
      </Svg>
    )
  },
  {
    name: "Rings",
    label: "Rings",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Circle cx="50" cy="58" r="22" stroke="#D4AF37" strokeWidth="4.5" />
        <Path d="M38,36 L62,36 L56,43 L44,43 Z" fill="#D4AF37" />
        <Path d="M50,16 L65,28 L57,36 L43,36 L35,28 Z" fill="#fff" stroke="#D4AF37" strokeWidth="2" />
        <Path d="M50,16 L50,36 M35,28 L50,36 M65,28 L50,36" stroke="#D4AF37" strokeWidth="1.5" />
      </Svg>
    )
  },
  {
    name: "Bracelet",
    label: "Bracelet",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Path d="M15,50 Q50,35 85,50" stroke="#D4AF37" strokeWidth="4.5" strokeLinecap="round" />
        <Path d="M40,43 C33,35 33,52 48,45 C63,38 63,55 56,47" stroke="#D4AF37" strokeWidth="2.5" fill="none" />
        <Circle cx="48" cy="56" r="3.5" fill="#D4AF37" />
        <Circle cx="48" cy="63" r="2.2" fill="#D4AF37" />
        <Circle cx="25" cy="45" r="2" fill="#fff" />
        <Circle cx="75" cy="45" r="2" fill="#fff" />
      </Svg>
    )
  },
  {
    name: "Bangles",
    label: "Bangles",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Ellipse cx="40" cy="55" rx="20" ry="10" stroke="#D4AF37" strokeWidth="3" transform="rotate(-15 40 55)" />
        <Ellipse cx="50" cy="48" rx="20" ry="10" stroke="#D4AF37" strokeWidth="4.5" transform="rotate(-15 50 48)" />
        <Ellipse cx="60" cy="41" rx="20" ry="10" stroke="#D4AF37" strokeWidth="3" transform="rotate(-15 60 41)" strokeDasharray="4,2" />
        <Circle cx="50" cy="38" r="2.5" fill="#fff" />
        <Circle cx="38" cy="45" r="2" fill="#B22222" />
        <Circle cx="62" cy="51" r="2" fill="#B22222" />
      </Svg>
    )
  },
  {
    name: "Other",
    label: "Other",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Path d="M25,25 L75,75 M35,25 L65,85" stroke="#D4AF37" strokeWidth="2.5" />
        <Circle cx="50" cy="50" r="12" fill="#D4AF37" />
        <Circle cx="50" cy="50" r="6" fill="#fff" />
        <Circle cx="50" cy="34" r="3.5" fill="#D4AF37" />
        <Circle cx="50" cy="66" r="3.5" fill="#D4AF37" />
        <Circle cx="34" cy="50" r="3.5" fill="#D4AF37" />
        <Circle cx="66" cy="50" r="3.5" fill="#D4AF37" />
        <Circle cx="39" cy="39" r="3" fill="#D4AF37" />
        <Circle cx="61" cy="61" r="3" fill="#D4AF37" />
        <Circle cx="39" cy="61" r="3" fill="#D4AF37" />
        <Circle cx="61" cy="39" r="3" fill="#D4AF37" />
      </Svg>
    )
  }
];

const CATEGORY_OPTIONS: Record<string, string[]> = {
  "Necklace": ["Necklace Short/Medium", "Necklace Set"],
  "Earrings": ["Studs", "Jumkies", "Fancy"],
  "Lockets": ["Unisex"],
  "Rings": ["Men", "Women"],
  "Bracelet": ["Plain", "Stones"],
  "Bangles": ["Plain", "Stones"],
  "Other": ["Coins", "Bhajubandh / Vanki", "Watch", "Tikka / Matti"],
};

const HoverOptionItem = ({ option, onPress }: { option: string; onPress: () => void }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity
      style={[
        styles.hoverDropdownOption,
        hovered && { backgroundColor: "rgba(212, 175, 55, 0.15)" }
      ]}
      onPress={onPress}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      // @ts-ignore
      onMouseLeave={() => setHovered(false)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.hoverDropdownOptionText,
        hovered && { color: "#D4AF37" }
      ]}>
        {option}
      </Text>
    </TouchableOpacity>
  );
};

interface CategorySliderProps {
  activeSubCategory?: string;
  onSelectSubCategory?: (subCategoryName: string) => void;
  hideTitle?: boolean;
  contentPadding?: number;
}

export const CategorySlider: React.FC<CategorySliderProps> = ({
  activeSubCategory,
  onSelectSubCategory,
  hideTitle = false,
  contentPadding
}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mobileModalVisible, setMobileModalVisible] = useState(false);
  const [mobileModalCategory, setMobileModalCategory] = useState<string | null>(null);

  const scrollX = useRef(0);
  const timeoutRef = useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnterCategory = (catName: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredCategory(catName);
  };

  const handleMouseLeaveCategory = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 100);
  };

  const handleMouseEnterDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeaveDropdown = () => {
    setHoveredCategory(null);
  };

  const handleSelectSubOption = (catName: string, option: string) => {
    setHoveredCategory(null);
    let filterVal = option;
    if (option === "Bhajubandh / Vanki") filterVal = "Bhajubandh";
    if (option === "Tikka / Matti") filterVal = "Tikka";

    const formattedVal = `${catName}:${filterVal}`;
    if (onSelectSubCategory) {
      onSelectSubCategory(formattedVal);
    } else {
      navigation.navigate("Category", { 
        category: "All", 
        subCategory: formattedVal 
      });
    }
  };

  const handleSelectCategory = (catName: string) => {
    const hasOptions = CATEGORY_OPTIONS[catName] && CATEGORY_OPTIONS[catName].length > 0;
    const isMobileDevice = Platform.OS !== 'web' || width < 1024;

    if (hasOptions && isMobileDevice) {
      setMobileModalCategory(catName);
      setMobileModalVisible(true);
    } else {
      if (onSelectSubCategory) {
        onSelectSubCategory(catName);
      } else {
        // Navigate to the Category screen, showing All collections filtered by this sub-category
        navigation.navigate("Category", { 
          category: "All", 
          subCategory: catName 
        });
      }
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      const targetX = Math.max(0, scrollX.current - 360);
      scrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const targetX = scrollX.current + 360;
      scrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  };

  const totalItemsWidth = CATEGORIES.length * 120 - 15;
  const viewportWidth = width;
  const isCentered = viewportWidth > totalItemsWidth;

  const hoveredIndex = hoveredCategory ? CATEGORIES.findIndex(c => c.name === hoveredCategory) : -1;
  let dropdownLeft = 0;
  if (hoveredIndex !== -1) {
    if (isCentered) {
      const startOffset = (viewportWidth - totalItemsWidth) / 2;
      dropdownLeft = startOffset + hoveredIndex * 120 - 12.5;
    } else {
      const leftPad = contentPadding !== undefined ? contentPadding : (Platform.OS === 'web' ? 40 : 15);
      dropdownLeft = leftPad + hoveredIndex * 120 - scrollX.current - 12.5;
    }
  }

  return (
    <View style={[
      styles.container, 
      hideTitle && { 
        paddingTop: width < 768 ? 2 : 4,
        paddingBottom: width < 768 ? 2 : 4, 
        backgroundColor: "#1a1209",
        borderBottomWidth: 0
      }
    ]}>
      {!hideTitle && <Text style={styles.title}>Browse By Category</Text>}
      
      <View style={styles.sliderWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isCentered && { justifyContent: 'center' }
          ]}
          style={Platform.OS === 'web' ? { overflowX: 'auto', overflowY: 'hidden', zIndex: 50, position: 'relative', width: '100%', minHeight: width < 380 ? 65 : (width < 768 ? 75 : 85) } as any : undefined}
          scrollEventThrottle={16}
          onScroll={(event) => {
            scrollX.current = event.nativeEvent.contentOffset.x;
            if (hoveredCategory) {
              setHoveredCategory(null);
            }
          }}
        >
          {CATEGORIES.map((cat, index) => {
            const rawActive = activeSubCategory ? activeSubCategory.split(':')[0].toLowerCase() : '';
            const isOtherOptionActive = cat.name === 'Other' && 
              ['coins', 'bhajubandh', 'watch', 'tikka', 'other'].includes(rawActive);
            const isActive = rawActive === cat.name.toLowerCase() || 
                             rawActive === cat.label.toLowerCase() ||
                             isOtherOptionActive ||
                             (cat.name === 'Lockets' && rawActive === 'lockets / pendents');
            const isHovered = hoveredCategory === cat.name;

            const isSmallMobile = width < 380;
            const itemWidth = isSmallMobile ? 62 : (width < 768 ? 70 : 85);
            const circleSize = isSmallMobile ? 38 : (width < 768 ? 44 : 52);
            const iconScale = isSmallMobile ? 0.55 : (width < 768 ? 0.65 : 0.75);
            const labelFontSize = isSmallMobile ? 8.5 : (width < 768 ? 9.5 : 10);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryItem,
                  { width: itemWidth },
                  Platform.OS === 'web' && isHovered && { zIndex: 200 }
                ]}
                onPress={() => handleSelectCategory(cat.name)}
                activeOpacity={0.8}
                // @ts-ignore
                onMouseEnter={() => handleMouseEnterCategory(cat.name)}
                // @ts-ignore
                onMouseLeave={handleMouseLeaveCategory}
              >
                <View style={[
                  styles.circleFrame,
                  { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
                  isActive && styles.activeCircleFrame
                ]}>
                  <View style={{ transform: [{ scale: iconScale }] }}>
                    {cat.renderSvg()}
                  </View>
                </View>
                <Text 
                  style={[
                    styles.categoryLabel,
                    { fontSize: labelFontSize },
                    isActive && styles.activeCategoryLabel
                  ]}
                  numberOfLines={2}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Hover Dropdown Rendered Outside ScrollView */}
        {Platform.OS === 'web' && hoveredCategory && CATEGORY_OPTIONS[hoveredCategory] && (
          <View 
            style={[styles.hoverDropdown, { left: dropdownLeft }]}
            // @ts-ignore
            onMouseEnter={handleMouseEnterDropdown}
            // @ts-ignore
            onMouseLeave={handleMouseLeaveDropdown}
          >
            {CATEGORY_OPTIONS[hoveredCategory].map((opt) => (
              <HoverOptionItem
                key={opt}
                option={opt}
                onPress={() => handleSelectSubOption(hoveredCategory, opt)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Mobile Options Modal */}
      {mobileModalVisible && mobileModalCategory && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={mobileModalVisible}
          onRequestClose={() => setMobileModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setMobileModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{mobileModalCategory} Options</Text>
              
              <TouchableOpacity
                style={styles.modalOptionButton}
                onPress={() => {
                  setMobileModalVisible(false);
                  if (onSelectSubCategory) {
                    onSelectSubCategory(mobileModalCategory);
                  } else {
                    navigation.navigate("Category", { 
                      category: "All", 
                      subCategory: mobileModalCategory 
                    });
                  }
                }}
              >
                <Text style={styles.modalOptionText}>All {mobileModalCategory}</Text>
              </TouchableOpacity>

              {CATEGORY_OPTIONS[mobileModalCategory].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalOptionButton}
                  onPress={() => {
                    setMobileModalVisible(false);
                    handleSelectSubOption(mobileModalCategory, opt);
                  }}
                >
                  <Text style={styles.modalOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.modalOptionButton, styles.modalCloseButton]}
                onPress={() => setMobileModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: "#1e1308",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
    zIndex: 9999,
    alignItems: "center",
    width: "100%",
    ...Platform.select({
      web: { 
        overflow: 'visible',
        position: 'relative' as any,
        zIndex: 9999
      }
    })
  },
  title: {
    fontFamily: "TrajanPro",
    fontSize: 16,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 2,
  },
  sliderWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    width: "100%",
    ...Platform.select({
      web: { 
        overflow: 'visible',
        zIndex: 9999
      }
    }) as any
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 8,
    paddingVertical: 8,
    alignItems: 'center',
    flexGrow: 1,
  },
  categoryItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 105,
    position: "relative",
    zIndex: 10,
    ...Platform.select({
      web: { 
        overflow: 'visible',
        zIndex: 10
      }
    })
  },
  hoverDropdown: {
    position: "absolute",
    top: 95,
    width: 130,
    backgroundColor: "#1a1007",
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderRadius: 4,
    paddingVertical: 4,
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: "0 6px 15px rgba(0,0,0,0.6)",
      }
    }) as any,
  },
  hoverDropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      }
    }) as any,
  },
  hoverDropdownOptionText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    ...Platform.select({
      web: {
        transition: "color 0.2s ease",
      }
    }) as any,
  },
  circleFrame: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#291c0e",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    ...Platform.select({
      web: {
        transition: "all 0.3s ease",
        boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
        cursor: "pointer",
        ":hover": {
          borderColor: "#D4AF37",
          boxShadow: "0 0 15px rgba(212,175,55,0.4)",
        }
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
      }
    }) as any,
  },
  categoryLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  arrowButton: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(41, 28, 14, 0.9)",
    borderWidth: 1,
    borderColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    ...Platform.select({
      web: {
        transition: "all 0.2s ease",
        cursor: "pointer",
        ":hover": {
          backgroundColor: "#D4AF37",
          borderColor: "#D4AF37",
        }
      }
    }) as any,
  },
  arrowLeft: {
    left: 10,
  },
  arrowRight: {
    right: 10,
  },
  arrowText: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
    textAlign: "center",
    marginTop: -2,
  },
  activeCircleFrame: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    ...Platform.select({
      web: {
        boxShadow: "0 0 15px rgba(212, 175, 55, 0.35)",
      }
    }) as any,
  },
  activeCategoryLabel: {
    color: "#D4AF37",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: "#1e1308",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    borderRadius: 8,
    padding: 20,
    alignItems: "stretch",
  },
  modalTitle: {
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    fontSize: 18,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalOptionButton: {
    backgroundColor: "#291c0e",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: 4,
    paddingVertical: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
  },
  modalCloseButton: {
    backgroundColor: "transparent",
    borderColor: "#ff4444",
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: "#ff4444",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default CategorySlider;
