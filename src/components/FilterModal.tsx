import React, { useState, useMemo, useEffect } from 'react';
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
import { useCountry } from '../contexts/CountryContext';

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
  const { countryCode } = useCountry();
  const isLargeScreen = width > 768;
  const exchangeRate = 83; // 1 USD = 83 INR

  // Sync local filters state with prop updates
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const toggleSelection = (key: keyof ProductFilters, value: string) => {
    setLocalFilters(prev => {
      const current = (prev[key] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const handlePriceChange = (key: 'minPrice' | 'maxPrice', text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    const converted = isNaN(val) ? undefined : val / (countryCode === 'IN' ? exchangeRate : 1);
    setLocalFilters(prev => ({
      ...prev,
      [key]: converted
    }));
  };

  // Preset Filters
  const presets = useMemo(() => {
    return countryCode === 'IN' ? [
      { label: 'Under ₹25k', min: undefined, max: 25000 / 83 },
      { label: '₹25k - ₹50k', min: 25000 / 83, max: 50000 / 83 },
      { label: '₹50k - ₹1L', min: 50000 / 83, max: 100000 / 83 },
      { label: '₹1L & Above', min: 100000 / 83, max: undefined }
    ] : [
      { label: 'Under $500', min: undefined, max: 500 },
      { label: '$500 - $1,000', min: 500, max: 1000 },
      { label: '$1,000 - $2,500', min: 1000, max: 2500 },
      { label: '$2,500 & Above', min: 2500, max: undefined }
    ];
  }, [countryCode]);

  const isPresetActive = (preset: any) => {
    const minMatch = preset.min === undefined 
      ? localFilters.minPrice === undefined 
      : Math.abs((localFilters.minPrice || 0) - preset.min) < 2;
    const maxMatch = preset.max === undefined 
      ? localFilters.maxPrice === undefined 
      : Math.abs((localFilters.maxPrice || 0) - preset.max) < 2;
    return minMatch && maxMatch;
  };

  const selectPreset = (preset: any) => {
    if (isPresetActive(preset)) {
      // Toggle off
      setLocalFilters(prev => ({
        ...prev,
        minPrice: undefined,
        maxPrice: undefined
      }));
    } else {
      setLocalFilters(prev => ({
        ...prev,
        minPrice: preset.min,
        maxPrice: preset.max
      }));
    }
  };

  // Localized displayed text inputs
  const minDisp = localFilters.minPrice 
    ? Math.round(localFilters.minPrice * (countryCode === 'IN' ? exchangeRate : 1)).toString() 
    : '';

  const maxDisp = localFilters.maxPrice 
    ? Math.round(localFilters.maxPrice * (countryCode === 'IN' ? exchangeRate : 1)).toString() 
    : '';

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
            {/* Price Presets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Ranges</Text>
              <View style={styles.chipRow}>
                {presets.map((preset, index) => {
                  const active = isPresetActive(preset);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.chip, active && styles.activeChip]}
                      onPress={() => selectPreset(preset)}
                    >
                      <Text style={[styles.chipText, active && styles.activeChipText]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Custom Price Range ({countryCode === 'IN' ? 'INR' : 'USD'})
              </Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={minDisp}
                  onChangeText={(val) => handlePriceChange('minPrice', val)}
                />
                <Text style={styles.priceSeparator}>to</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={maxDisp}
                  onChangeText={(val) => handlePriceChange('maxPrice', val)}
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
