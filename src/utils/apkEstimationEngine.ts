/**
 * APK Estimation Calculation Engine
 * Replicates the exact calculation rules from Moksha Jewels Inventory APK (EstimationScreen.tsx)
 */

export interface MasterRates {
  gold_24kt: number;
  gold_22kt: number;
  gold_18kt: number;
  gold_22kt_multiplier: number;
  gold_18kt_multiplier: number;
  default_labor_regular: number;
  default_labor_diamond: number;
  special_d_tier1_weight: number;
  special_d_tier1_labor: number;
  special_d_tier2_weight: number;
  special_d_tier2_labor: number;
  diamond_rd_rate: number;
  diamond_stb_rate: number;
  diamond_pear_rate: number;
  stone_rate: number;
  default_beads_rate: number;
  emerald_ruby_discount: number;
  cert_rate_per_ct: number;
  tax_gst_pct: number;
  default_wastage_pct: number;
  admin_wastage_limit: number;
}

export const DEFAULT_MASTER_RATES: MasterRates = {
  gold_24kt: 15197.00,
  gold_22kt: 13981.00,
  gold_18kt: 11398.00,
  gold_22kt_multiplier: 0.92,
  gold_18kt_multiplier: 0.75,
  default_labor_regular: 550.00,
  default_labor_diamond: 1200.00,
  special_d_tier1_weight: 5.20,
  special_d_tier1_labor: 10000.00,
  special_d_tier2_weight: 8.00,
  special_d_tier2_labor: 12000.00,
  diamond_rd_rate: 65000.00,
  diamond_stb_rate: 62000.00,
  diamond_pear_rate: 68000.00,
  stone_rate: 3500.00,
  default_beads_rate: 850.00,
  emerald_ruby_discount: 1000.00,
  cert_rate_per_ct: 950.00,
  tax_gst_pct: 3.00,
  default_wastage_pct: 22.00,
  admin_wastage_limit: 18.00,
};

export interface StoneItem {
  id?: string;
  name: string;
  weight?: number | string;
  pcs?: number | string;
  rate?: number | string;
  category?: string;
}

export interface EstimationInput {
  productCode?: string;
  sku?: string;
  name?: string;
  netWt: number;
  grossWt?: number;
  purity: string; // '24K' | '22K' | '18K'
  wastagePct?: number;
  labourRateOverride?: number;
  labourAmtOverride?: number;
  stones?: StoneItem[];
  purchaseCost?: number; // Cost Price
}

export interface EstimationResult {
  goldRate: number;
  billingWeight: number;
  goldValue: number;
  stoneItems: Array<{
    name: string;
    weight: number;
    pcs: number;
    baseRate: number;
    discount: number;
    finalRate: number;
    amount: number;
  }>;
  totalStoneValue: number;
  totalDiamondCarats: number;
  certCharges: number;
  labourCharges: number;
  labourType: 'Tier Override' | 'Fixed Override' | 'Weight Based';
  subTotal: number;
  gstAmount: number;
  totalEstimate: number; // INR
  totalEstimateUSD: number;
  // Admin Profit Analysis
  purchaseCost?: number;
  estimatedProfit?: number;
  profitMarginPct?: number;
  isLoss?: boolean;
}

export function calculateApkEstimate(
  input: EstimationInput,
  masterRates: MasterRates = DEFAULT_MASTER_RATES
): EstimationResult {
  const code = (input.productCode || input.sku || input.name || '').trim().toUpperCase();
  const purity = (input.purity || '22K').toUpperCase();

  // 1. Gold Rate Selection
  let goldRate = masterRates.gold_22kt;
  if (purity.includes('24')) {
    goldRate = masterRates.gold_24kt;
  } else if (purity.includes('18')) {
    goldRate = masterRates.gold_18kt;
  }

  // 2. Billing Weight & Gold Value
  const netWt = Math.max(0, input.netWt || 0);
  const wastagePct = input.wastagePct !== undefined ? input.wastagePct : masterRates.default_wastage_pct;
  const billingWeight = netWt * (1 + wastagePct / 100);
  const goldValue = Math.round(billingWeight * goldRate * 100) / 100;

  // 3. Stone Rates & Calculations
  const isDiamondProduct = code.startsWith('D');
  let totalStoneValue = 0;
  let totalDiamondCarats = 0;

  const processedStones = (input.stones || []).map((st) => {
    const name = (st.name || 'Stone').toUpperCase();
    const wt = parseFloat(st.weight?.toString() || '0') || 0;
    const pcs = parseInt(st.pcs?.toString() || '0') || 1;
    let baseRate = parseFloat(st.rate?.toString() || '0') || 0;

    // Fallback rate if 0
    if (baseRate === 0) {
      if (name.includes('DIAMOND') || name.includes('VVS') || name.includes('EF') || name.includes('RD')) {
        baseRate = masterRates.diamond_rd_rate;
      } else if (name.includes('PEAR')) {
        baseRate = masterRates.diamond_pear_rate;
      } else if (name.includes('STB') || name.includes('BAGUETTE')) {
        baseRate = masterRates.diamond_stb_rate;
      } else if (name.includes('BEAD') || name.includes('PEARL') || name.includes('BLACKBEAD')) {
        baseRate = masterRates.default_beads_rate;
      } else {
        baseRate = masterRates.stone_rate;
      }
    }

    // Emerald & Ruby Discount Rule for non-diamond products
    let discount = 0;
    if (!isDiamondProduct && (name.includes('EMERALD') || name.includes('RUBY'))) {
      discount = masterRates.emerald_ruby_discount;
    }

    const finalRate = Math.max(0, baseRate - discount);
    const amount = wt > 0 ? Math.round(wt * finalRate) : Math.round(pcs * finalRate);

    // Track total diamond carats for certification charges
    if (name.includes('DIAMOND') || name.includes('VVS') || name.includes('EF') || name.includes('RD') || name.includes('SHAPE')) {
      totalDiamondCarats += wt;
    }

    totalStoneValue += amount;

    return {
      name: st.name,
      weight: wt,
      pcs,
      baseRate,
      discount,
      finalRate,
      amount,
    };
  });

  // 4. Diamond Certification Charges
  let certCharges = 0;
  if (totalDiamondCarats > 0) {
    certCharges = Math.max(
      totalDiamondCarats * masterRates.cert_rate_per_ct,
      masterRates.cert_rate_per_ct
    );
  }

  // 5. Labour / Making Charges
  let labourCharges = 0;
  let labourType: 'Tier Override' | 'Fixed Override' | 'Weight Based' = 'Weight Based';

  if (input.labourAmtOverride && input.labourAmtOverride > 0) {
    labourCharges = input.labourAmtOverride;
    labourType = 'Fixed Override';
  } else if (code.startsWith('D')) {
    // Special D Tier Overrides
    if (netWt <= masterRates.special_d_tier1_weight) {
      labourCharges = masterRates.special_d_tier1_labor; // ₹10,000
      labourType = 'Tier Override';
    } else if (netWt < masterRates.special_d_tier2_weight) {
      labourCharges = masterRates.special_d_tier2_labor; // ₹12,000
      labourType = 'Tier Override';
    } else {
      const rate = input.labourRateOverride || masterRates.default_labor_diamond;
      labourCharges = Math.round(netWt * rate);
      labourType = 'Weight Based';
    }
  } else if (code.startsWith('G')) {
    // Special G Tier Overrides
    if (netWt < 5.0) {
      labourCharges = 4000;
      labourType = 'Tier Override';
    } else if (netWt <= 8.0) {
      labourCharges = 8000;
      labourType = 'Tier Override';
    } else {
      const rate = input.labourRateOverride || masterRates.default_labor_regular;
      labourCharges = Math.round(netWt * rate);
      labourType = 'Weight Based';
    }
  } else {
    const rate = input.labourRateOverride || masterRates.default_labor_regular;
    labourCharges = Math.round(netWt * rate);
    labourType = 'Weight Based';
  }

  // 6. Subtotal & GST Grand Total
  const subTotal = goldValue + totalStoneValue + labourCharges + certCharges;
  const gstAmount = Math.round(subTotal * (masterRates.tax_gst_pct / 100));
  const totalEstimate = subTotal + gstAmount;
  const totalEstimateUSD = Math.round((totalEstimate / 83) * 100) / 100;

  // 7. Admin Profit / Loss Analysis
  let estimatedProfit: number | undefined = undefined;
  let profitMarginPct: number | undefined = undefined;
  let isLoss: boolean | undefined = undefined;

  if (input.purchaseCost && input.purchaseCost > 0) {
    estimatedProfit = totalEstimate - input.purchaseCost;
    profitMarginPct = Math.round((estimatedProfit / input.purchaseCost) * 10000) / 100;
    isLoss = estimatedProfit < 0;
  }

  return {
    goldRate,
    billingWeight,
    goldValue,
    stoneItems: processedStones,
    totalStoneValue,
    totalDiamondCarats,
    certCharges,
    labourCharges,
    labourType,
    subTotal,
    gstAmount,
    totalEstimate,
    totalEstimateUSD,
    purchaseCost: input.purchaseCost,
    estimatedProfit,
    profitMarginPct,
    isLoss,
  };
}
