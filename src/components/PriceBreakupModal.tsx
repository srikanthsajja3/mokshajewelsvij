import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Product } from '../data/products';
import { useCountry } from '../contexts/CountryContext';
import { useGoldRate } from '../contexts/GoldRateContext';
import { formatPrice } from '../utils/currency';
import { calculateApkEstimate, fetchServerApkEstimate, EstimationResult } from '../utils/apkEstimationEngine';

interface PriceBreakupModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
  selectedPurity?: string;
  addGiftWrapping?: boolean;
}

export const PriceBreakupModal: React.FC<PriceBreakupModalProps> = ({
  visible,
  onClose,
  product,
  selectedPurity = '22K',
  addGiftWrapping = false,
}) => {
  const { width } = useWindowDimensions();
  const { countryCode } = useCountry();
  const { rates } = useGoldRate();
  const [serverEst, setServerEst] = React.useState<EstimationResult | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    if (!product || !visible) return;

    fetchServerApkEstimate({
      productCode: product.productCode || product.sku || product.name,
      sku: product.sku || product.productCode,
      name: product.name,
      netWt: product.goldWeight || product.netWeight || 0,
      grossWt: product.grossWeight || product.goldWeight || 0,
      purity: selectedPurity || product.purity || '22K',
      wastagePct: product.wastage !== undefined ? product.wastage : 22,
      labourRateOverride: product.labourRate && product.labourRate > 0 ? product.labourRate : undefined,
      labourAmtOverride: product.labourAmt && product.labourAmt > 0 ? product.labourAmt : undefined,
      stones: product.stonesInDetail || []
    }).then(res => {
      if (isMounted && res) {
        setServerEst(res);
      }
    });

    return () => { isMounted = false; };
  }, [product, selectedPurity, visible]);

  if (!product) return null;

  // Clean Purity string (e.g. "22K" or "22 KT")
  const purityLabel = (selectedPurity || product.purity || '22 KT')
    .toUpperCase()
    .replace('KT', 'KT')
    .trim();

  const cleanedPurity = purityLabel.replace(/\s+/g, '').replace('KT', 'K');

  const targetRateObj = rates.find(
    (r) =>
      r.purity.replace(/\s+/g, '').toUpperCase() === cleanedPurity ||
      r.purity.replace(/\s+/g, '').toUpperCase() === cleanedPurity.replace('KT', 'K')
  );

  const baseRatePerGram = targetRateObj
    ? targetRateObj.rate
    : cleanedPurity.startsWith('18')
    ? 75 * 0.75
    : 75 * 0.9167;

  const fallbackEst: EstimationResult = useMemo(() => {
    const grossWeight = product?.grossWeight || product?.goldWeight || 0;
    const netWeight = product?.goldWeight || product?.netWeight || 0;
    const wastage = product?.wastage !== undefined ? product.wastage : 22;
    const billingWeight = netWeight * (1 + wastage / 100);
    const pb = product?.priceBreakup;
    const metalValUSD = pb?.metal || ((product?.price || 0) * 0.85);
    const labourValUSD = pb?.vaMaking || ((product?.price || 0) * 0.12);
    const stoneValUSD = pb?.stoneBeads || 0;
    const gstValUSD = pb?.tax || ((product?.price || 0) * 0.03);
    const totalUSD = (product?.price || 0);

    return {
      goldRate: billingWeight > 0 ? Math.round((metalValUSD * 83) / billingWeight) : 11398,
      billingWeight,
      goldValue: Math.round(metalValUSD * 83),
      stoneItems: [],
      totalStoneValue: Math.round(stoneValUSD * 83),
      totalDiamondCarats: product?.daiWeight || 0,
      certCharges: 0,
      labourCharges: Math.round(labourValUSD * 83),
      labourType: 'Weight Based',
      subTotal: Math.round((metalValUSD + labourValUSD + stoneValUSD) * 83),
      gstAmount: Math.round(gstValUSD * 83),
      totalEstimate: Math.round(totalUSD * 83),
      totalEstimateUSD: totalUSD
    };
  }, [product]);

  const est = serverEst || fallbackEst;

  const grossWeight = product.grossWeight || product.goldWeight || 0;
  const netWeight = product.goldWeight || product.netWeight || 0;
  const wastage = product.wastage !== undefined ? product.wastage : 22;

  const subtotal = est ? (countryCode === 'IN' ? est.subTotal : est.subTotal / 83) : 0;
  const gstTax = est ? (countryCode === 'IN' ? est.gstAmount : est.gstAmount / 83) : 0;
  const giftFee = addGiftWrapping ? (countryCode === 'IN' ? 830 : 10.0) : 0;
  const grandTotal = est ? (countryCode === 'IN' ? est.totalEstimate + giftFee : est.totalEstimateUSD + giftFee) : 0;

  const fmt = (val: number) => countryCode === 'IN' ? `₹${Math.round(val).toLocaleString('en-IN')}` : formatPrice(val, countryCode);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: Math.min(width - 32, 640) }]}>
          {/* Top Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>Detailed Price Breakup</Text>
              <Text style={styles.modalSubtitle}>{product.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <FontAwesome5 name="times" size={16} color="#D4AF37" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 1. PRODUCT DETAILS SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Product Details</Text>
              
              <View style={styles.skuRow}>
                <Text style={styles.specLabel}>SKU :</Text>
                <Text style={styles.specValue}>{product.productCode || product.sku || 'DPNT6'}</Text>
              </View>

              <View style={styles.detailsGrid}>
                {/* Left Column */}
                <View style={styles.gridCol}>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Gross Weight :</Text>
                    <Text style={styles.specValue}>{grossWeight.toFixed(3)} g</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Net Gold Wt :</Text>
                    <Text style={styles.specValue}>{netWeight.toFixed(3)} g</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Wastage % :</Text>
                    <Text style={styles.specValue}>+ {wastage}%</Text>
                  </View>
                </View>

                {/* Right Column */}
                <View style={styles.gridCol}>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Billing Weight :</Text>
                    <Text style={styles.specValue}>{est.billingWeight.toFixed(3)} g</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Gold Purity :</Text>
                    <Text style={styles.specValue}>{selectedPurity || product.purity}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Gold Rate :</Text>
                    <Text style={styles.specValue}>₹{est.goldRate.toLocaleString('en-IN')}/g</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 2. ESTIMATOR BREAKDOWN TABLE SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Bill Estimator Particulars</Text>
              
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { flex: 2 }]}>Particulars</Text>
                  <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Ct / Wt</Text>
                  <Text style={[styles.thCell, { flex: 1.5, textAlign: 'right' }]}>Rate (₹)</Text>
                  <Text style={[styles.thCell, { flex: 2, textAlign: 'right' }]}>Amount (₹)</Text>
                </View>

                {/* Row 1: Gold Value */}
                <View style={styles.tableBodyRow}>
                  <Text style={[styles.tdCell, { flex: 2, fontWeight: '600', color: '#fff' }]}>
                    Gold ({netWeight}g + {wastage}% Wst)
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>
                    {est.billingWeight.toFixed(3)}g
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'right' }]}>
                    ₹{est.goldRate.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.tdCell, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: '#D4AF37' }]}>
                    {countryCode === 'IN' ? `₹${est.goldValue.toLocaleString('en-IN')}` : formatPrice(est.goldValue / 83, countryCode)}
                  </Text>
                </View>

                {/* Row 2: Itemized Stones */}
                {est.stoneItems.map((st, sIdx) => (
                  <View key={sIdx} style={styles.tableBodyRow}>
                    <Text style={[styles.tdCell, { flex: 2, fontWeight: '600', color: '#fff' }]}>
                      {st.name} {st.discount > 0 ? `(-₹${st.discount} Disc)` : ''}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>
                      {st.weight > 0 ? `${st.weight} ct` : `${st.pcs} pcs`}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'right', color: '#ccc' }]}>
                      ₹{st.finalRate.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.tdCell, { flex: 2, textAlign: 'right', fontWeight: '600', color: '#fff' }]}>
                      {countryCode === 'IN' ? `₹${st.amount.toLocaleString('en-IN')}` : formatPrice(st.amount / 83, countryCode)}
                    </Text>
                  </View>
                ))}

                {/* Row 3: Certification Charges */}
                {est.certCharges > 0 && (
                  <View style={styles.tableBodyRow}>
                    <Text style={[styles.tdCell, { flex: 2, fontWeight: '600', color: '#fff' }]}>
                      Certification
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right' }]}>
                      {est.totalDiamondCarats.toFixed(2)} ct
                    </Text>
                    <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'right', color: '#ccc' }]}>₹950</Text>
                    <Text style={[styles.tdCell, { flex: 2, textAlign: 'right', fontWeight: '600', color: '#fff' }]}>
                      {countryCode === 'IN' ? `₹${est.certCharges.toLocaleString('en-IN')}` : formatPrice(est.certCharges / 83, countryCode)}
                    </Text>
                  </View>
                )}

                {/* Row 4: Labour Charges */}
                <View style={styles.tableBodyRow}>
                  <Text style={[styles.tdCell, { flex: 2, fontWeight: '600', color: '#fff' }]}>
                    Labour Charges ({est.labourType})
                  </Text>
                  <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right', color: '#888' }]}>{netWeight.toFixed(3)}g</Text>
                  <Text style={[styles.tdCell, { flex: 1.5, textAlign: 'right', color: '#888' }]}>-</Text>
                  <Text style={[styles.tdCell, { flex: 2, textAlign: 'right', fontWeight: '600', color: '#fff' }]}>
                    {countryCode === 'IN' ? `₹${est.labourCharges.toLocaleString('en-IN')}` : formatPrice(est.labourCharges / 83, countryCode)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 3. TOTALS BREAKDOWN SECTION */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sub-Total Value</Text>
                <Text style={styles.totalValue}>
                  {countryCode === 'IN' ? `₹${est.subTotal.toLocaleString('en-IN')}` : formatPrice(est.subTotal / 83, countryCode)}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST (3%)</Text>
                <Text style={styles.totalValue}>
                  {countryCode === 'IN' ? `₹${est.gstAmount.toLocaleString('en-IN')}` : formatPrice(est.gstAmount / 83, countryCode)}
                </Text>
              </View>

              {addGiftWrapping && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Luxury Packaging</Text>
                  <Text style={styles.totalValue}>{fmt(giftFee)}</Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Product total</Text>
                <Text style={styles.totalValue}>{fmt(grandTotal)}</Text>
              </View>

              <View style={[styles.totalRow, styles.grandTotalHighlight]}>
                <Text style={styles.grandTotalLabel}>Grand total</Text>
                <Text style={styles.grandTotalValue}>{fmt(grandTotal)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeModalBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#291c0e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4AF37',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3520',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'TrajanPro' : 'serif',
    fontSize: 20,
    color: '#D4AF37',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3d2b1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a3520',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'TrajanPro' : 'serif',
    marginBottom: 12,
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  gridCol: {
    flex: 1,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  specLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  specValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  tableContainer: {
    backgroundColor: '#382614',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a3520',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#4a3520',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#5c432a',
  },
  thCell: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tdCell: {
    color: '#ddd',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#4a3520',
    marginVertical: 12,
  },
  totalsContainer: {
    backgroundColor: '#382614',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4a3520',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  totalValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  grandTotalHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    marginTop: 8,
    paddingTop: 10,
  },
  grandTotalLabel: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'TrajanPro' : 'serif',
  },
  grandTotalValue: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#4a3520',
    backgroundColor: '#291c0e',
  },
  closeModalBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
