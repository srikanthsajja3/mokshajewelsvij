import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Platform,
  useWindowDimensions
} from 'react-native';
import { ProductFilters } from '../data/products';
import { FontAwesome5 } from '@expo/vector-icons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClear: () => void;
}

const PURITIES = ["18 KT", "22 KT", "24 KT"];
const COLORS = ["Yellow Gold", "White Gold", "Rose Gold"];

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onClear
}) => {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const toggleSelection = (key: keyof ProductFilters, value: string) => {
    setLocalFilters(prev => {
      const current = (prev[key] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const updatePrice = (key: 'minPrice' | 'maxPrice', value: string) => {
    const num = parseFloat(value);
    setLocalFilters(prev => ({
      ...prev,
      [key]: isNaN(num) ? undefined : num
    }));
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={isLargeScreen ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, isLargeScreen && styles.overlayLarge]}>
        <View style={[styles.modalContainer, isLargeScreen && styles.modalContainerLarge]}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter & Refine</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome5 name="times" size={18} color="#D4AF37" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range (USD)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={localFilters.minPrice?.toString()}
                  onChangeText={(val) => updatePrice('minPrice', val)}
                />
                <Text style={styles.priceSeparator}>to</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={localFilters.maxPrice?.toString()}
                  onChangeText={(val) => updatePrice('maxPrice', val)}
                />
              </View>
            </View>

            {/* Purity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gold Purity</Text>
              <View style={styles.chipRow}>
                {PURITIES.map(p => {
                  const isSelected = localFilters.purity?.includes(p);
                  return (
                    <TouchableOpacity 
                      key={p} 
                      style={[styles.chip, isSelected && styles.activeChip]}
                      onPress={() => toggleSelection('purity', p)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Metal Color */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metal Color</Text>
              <View style={styles.chipRow}>
                {COLORS.map(c => {
                  const isSelected = localFilters.metalColor?.includes(c);
                  return (
                    <TouchableOpacity 
                      key={c} 
                      style={[styles.chip, isSelected && styles.activeChip]}
                      onPress={() => toggleSelection('metalColor', c)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.activeChipText]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={() => { setLocalFilters({}); onClear(); }}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(localFilters)}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  overlayLarge: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#291c0e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalContainerLarge: {
    width: 500,
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 20,
    color: '#D4AF37',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#3d2b1a',
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minWidth: 0,
  },
  priceSeparator: {
    color: '#666',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4a3520',
    backgroundColor: 'transparent',
  },
  activeChip: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  chipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#D4AF37',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.1)',
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a3520',
  },
  clearBtnText: {
    color: '#888',
    fontWeight: 'bold',
  },
  applyBtn: {
    flex: 2,
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default FilterModal;
