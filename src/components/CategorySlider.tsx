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
    name: "Haram",
    label: "Haram",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Path d="M25,20 C32,60 68,60 75,20" stroke="#D4AF37" strokeWidth="3" />
        <Path d="M18,20 C28,85 72,85 82,20" stroke="#D4AF37" strokeWidth="4.5" strokeLinecap="round" />
        <Path d="M40,65 L60,65 L64,75 L50,88 L36,75 Z" fill="#D4AF37" stroke="#D4AF37" strokeWidth="2" />
        <Circle cx="50" cy="73" r="3.5" fill="#291c0e" />
        <Circle cx="50" cy="92" r="2.5" fill="#D4AF37" />
        <Circle cx="44" cy="85" r="2" fill="#D4AF37" />
        <Circle cx="56" cy="85" r="2" fill="#D4AF37" />
      </Svg>
    )
  },
  {
    name: "Chain",
    label: "Chain",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Path d="M15,85 L25,75 M22,78 L32,68 M29,71 L39,61 M36,64 L46,54 M43,57 L53,47 M50,50 L60,40 M57,43 L67,33 M64,36 L74,26 M71,29 L81,19" stroke="#D4AF37" strokeWidth="5.5" strokeLinecap="round" />
        <Path d="M18,82 A6,4 45 1 0 25,75 A6,4 45 1 0 18,82 Z" stroke="#291c0e" strokeWidth="1.5" />
        <Path d="M32,68 A6,4 45 1 0 39,61 A6,4 45 1 0 32,68 Z" stroke="#291c0e" strokeWidth="1.5" />
        <Path d="M46,54 A6,4 45 1 0 53,47 A6,4 45 1 0 46,54 Z" stroke="#291c0e" strokeWidth="1.5" />
        <Path d="M60,40 A6,4 45 1 0 67,33 A6,4 45 1 0 60,40 Z" stroke="#291c0e" strokeWidth="1.5" />
        <Path d="M74,26 A6,4 45 1 0 81,19 A6,4 45 1 0 74,26 Z" stroke="#291c0e" strokeWidth="1.5" />
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
    name: "Mangalsutra",
    label: "Mangalsutra Chains",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Path d="M20,25 C30,60 70,60 80,25" stroke="#D4AF37" strokeWidth="3" />
        <Path d="M20,25 C30,60 70,60 80,25" stroke="#000" strokeWidth="4" strokeDasharray="3,10" strokeLinecap="round" />
        <Circle cx="44" cy="55" r="6" fill="#D4AF37" stroke="#000" strokeWidth="1" />
        <Circle cx="56" cy="55" r="6" fill="#D4AF37" stroke="#000" strokeWidth="1" />
        <Circle cx="44" cy="65" r="2.2" fill="#D4AF37" />
        <Circle cx="56" cy="65" r="2.2" fill="#D4AF37" />
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
    name: "Vaddanam",
    label: "Vaddanam",
    renderSvg: () => (
      <Svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        <Path d="M10,40 C35,28 65,28 90,40" stroke="#D4AF37" strokeWidth="5.5" strokeLinecap="round" />
        <Path d="M15,45 C35,36 65,36 85,45" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="3,5" />
        <Path d="M40,32 L60,32 L65,48 L50,62 L35,48 Z" fill="#D4AF37" />
        <Circle cx="50" cy="42" r="3" fill="#B22222" />
        <Path d="M50,62 L48,70 L50,74 L52,70 Z" fill="#D4AF37" />
        <Path d="M42,54 L40,62 L42,66 Z" fill="#D4AF37" />
        <Path d="M58,54 L56,62 L58,66 Z" fill="#D4AF37" />
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
        paddingTop: 12,
        paddingBottom: 22, 
        backgroundColor: "#1a1209",
        borderBottomWidth: 0
      }
    ]}>
      {!hideTitle && <Text style={styles.title}>Browse By Category</Text>}
      
      <View style={styles.sliderWrapper}>
        {Platform.OS === 'web' && width >= 768 && (
          <TouchableOpacity 
            style={[styles.arrowButton, styles.arrowLeft, hideTitle && { top: '50%', marginTop: -16 }]} 
            onPress={scrollLeft}
            activeOpacity={0.7}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            contentPadding !== undefined && { paddingHorizontal: contentPadding },
            isCentered && { justifyContent: 'center' }
          ]}
          style={Platform.OS === 'web' ? { overflow: 'hidden', zIndex: 50, position: 'relative', width: '100%', height: 125 } : undefined}
          snapToInterval={120} // 105px circle container + 15px spacing
          decelerationRate="fast"
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
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryItem,
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
                  isActive && styles.activeCircleFrame
                ]}>
                  {cat.renderSvg()}
                </View>
                <Text style={[
                  styles.categoryLabel,
                  isActive && styles.activeCategoryLabel
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {Platform.OS === 'web' && width >= 768 && (
          <TouchableOpacity 
            style={[styles.arrowButton, styles.arrowRight, hideTitle && { top: '50%', marginTop: -16 }]} 
            onPress={scrollRight}
            activeOpacity={0.7}
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        )}
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
    paddingVertical: 25,
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
    fontSize: 18,
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 20,
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
    paddingHorizontal: Platform.OS === 'web' ? 40 : 15,
    gap: 15,
    paddingBottom: 5,
    flexGrow: 1,
  },
  categoryItem: {
    alignItems: "center",
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
          transform: "translateY(-3px)",
          boxShadow: "0 6px 20px rgba(212,175,55,0.25)",
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
