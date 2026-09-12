import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, useWindowDimensions, Modal, Dimensions } from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SortOption, SORT_OPTIONS } from './CategoryBar';

interface CollectionToolbarProps {
  productCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onPressFilter: () => void;
  activeFilterCount: number;
  currentColumns?: number;
  onColumnsChange?: (cols: number) => void;
}

export const CollectionToolbar: React.FC<CollectionToolbarProps> = ({
  productCount,
  sortBy,
  onSortChange,
  onPressFilter,
  activeFilterCount,
  currentColumns = 5,
  onColumnsChange,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1200;

  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({ top: 120, right: 15 });
  const sortBtnRef = useRef<View>(null);

  const handleOpenSort = () => {
    if (sortBtnRef.current) {
      if (Platform.OS === 'web') {
        // @ts-ignore
        const rect = sortBtnRef.current.getBoundingClientRect?.();
        if (rect) {
          setDropdownPos({
            top: rect.bottom + 4,
            right: Math.max(10, window.innerWidth - rect.right),
          });
        }
      } else {
        sortBtnRef.current.measureInWindow((x: number, y: number, btnWidth: number, height: number) => {
          const screenWidth = Dimensions.get('window').width;
          setDropdownPos({
            top: y + height + 4,
            right: Math.max(10, screenWidth - (x + btnWidth)),
          });
        });
      }
    }
    setShowSortDropdown(true);
  };

  const selectedSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Featured';

  return (
    <View style={styles.toolbarContainer}>
      {/* Left: Filter Toggle Button */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.activeFilterButton]}
          onPress={onPressFilter}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="options-outline" 
            size={16} 
            color={activeFilterCount > 0 ? '#1A1209' : '#D4AF37'} 
          />
          <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.activeFilterButtonText]}>
            Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right: Sort By Dropdown & Product Counter */}
      <View style={styles.rightSection}>
        {/* Sort Selector */}
        <View style={styles.sortWrapper}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          
          <TouchableOpacity
            ref={sortBtnRef}
            style={styles.sortSelectorBox}
            onPress={handleOpenSort}
            activeOpacity={0.8}
          >
            <Text style={styles.sortSelectorText} numberOfLines={1}>
              {selectedSortLabel}
            </Text>
            <FontAwesome5 
              name={showSortDropdown ? "chevron-up" : "chevron-down"} 
              size={10} 
              color="#D4AF37" 
              style={{ marginLeft: 6 }} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Window Modal Overlay for Sort Options Dropdown */}
      {showSortDropdown && (
        <Modal
          transparent={true}
          visible={showSortDropdown}
          animationType="fade"
          onRequestClose={() => setShowSortDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowSortDropdown(false)}
          >
            <View 
              style={[
                styles.sortDropdownMenuModal, 
                { top: dropdownPos.top, right: dropdownPos.right }
              ]}
            >
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortDropdownItem,
                    sortBy === option.value && styles.activeSortDropdownItem,
                  ]}
                  onPress={() => {
                    onSortChange(option.value);
                    setShowSortDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortItemText,
                      sortBy === option.value && styles.activeSortItemText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1309',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 4,
    zIndex: 900,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      },
    } as any),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'transparent',
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  filterButtonText: {
    color: '#D4AF37',
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
  },
  activeFilterButtonText: {
    color: '#1A1209',
  },
  viewGridSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  viewGridBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
  },
  activeViewGridBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1000,
  },
  sortLabel: {
    color: '#888',
    fontSize: 10.5,
    marginRight: 6,
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  sortSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortSelectorText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    position: 'relative',
  },
  sortDropdownMenuModal: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#1E150B',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 6,
    zIndex: 999999,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 30px rgba(0,0,0,0.85)',
      },
      default: {
        elevation: 999999,
      }
    }),
    overflow: 'hidden',
  },
  sortDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
  },
  activeSortDropdownItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  sortItemText: {
    color: '#ccc',
    fontSize: 11,
  },
  activeSortItemText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  productCountBadge: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(212, 175, 55, 0.2)',
    paddingLeft: 10,
  },
  productCountText: {
    color: '#aaa',
    fontSize: 10.5,
    fontWeight: '600',
  },
});

export default CollectionToolbar;
