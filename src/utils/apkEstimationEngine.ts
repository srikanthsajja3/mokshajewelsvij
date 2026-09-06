/**
 * APK Estimation Calculation Engine
 * Replicates the exact calculation rules from Moksha Jewels Inventory APK (EstimationScreen.tsx)
 */

import { supabase } from '../../supabase';

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
}

export function calculateApkEstimate(): EstimationResult {
  console.warn(
    'calculateApkEstimate: Client-side calculation is disabled. Use `fetchServerApkEstimate` to get server-authoritative calculations from Supabase RPC.'
  );
  return {
    goldRate: 0,
    billingWeight: 0,
    goldValue: 0,
    stoneItems: [],
    totalStoneValue: 0,
    totalDiamondCarats: 0,
    certCharges: 0,
    labourCharges: 0,
    labourType: 'Weight Based',
    subTotal: 0,
    gstAmount: 0,
    totalEstimate: 0,
    totalEstimateUSD: 0,
  };
}

/**
 * Server-Authoritative Calculation Engine
 * Fetches authoritative price estimate from Supabase RPC backend (`calculate_product_estimate_json`).
 * Zero business/financial math takes place on the client side.
 */
export async function fetchServerApkEstimate(
  input: EstimationInput
): Promise<EstimationResult> {
  try {
    const { data, error } = await supabase.rpc('calculate_product_estimate_json', {
      p_input: input,
    });

    if (error) {
      console.error('fetchServerApkEstimate: Server RPC error:', error.message);
      throw new Error(`Server calculation failed: ${error.message}`);
    }

    if (data && typeof data === 'object') {
      return data as EstimationResult;
    }
  } catch (err) {
    console.error('fetchServerApkEstimate: Failed to connect to server RPC:', err);
    throw err;
  }

  throw new Error('Server calculation returned empty response');
}


