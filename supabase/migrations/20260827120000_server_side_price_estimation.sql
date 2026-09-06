-- Migration: Server-Side Rate Calculation & Bill Estimator Function
-- Date: 2026-08-27

CREATE OR REPLACE FUNCTION public.calculate_product_estimate_json(p_input JSONB)
RETURNS JSONB AS $$
DECLARE
  v_code TEXT;
  v_purity TEXT;
  v_net_wt NUMERIC;
  v_wastage_pct NUMERIC;
  v_labour_rate_override NUMERIC;
  v_labour_amt_override NUMERIC;
  v_purchase_cost NUMERIC;

  v_gold_rate NUMERIC;
  v_billing_weight NUMERIC;
  v_gold_value NUMERIC;

  v_is_diamond_product BOOLEAN;
  v_total_stone_val NUMERIC := 0;
  v_total_diamond_carats NUMERIC := 0;
  v_processed_stones JSONB := '[]'::jsonb;

  v_stone_elem JSONB;
  v_st_name TEXT;
  v_st_wt NUMERIC;
  v_st_pcs INT;
  v_st_base_rate NUMERIC;
  v_st_discount NUMERIC;
  v_st_final_rate NUMERIC;
  v_st_amt NUMERIC;

  v_cert_charges NUMERIC := 0;
  v_labour_charges NUMERIC := 0;
  v_labour_type TEXT := 'Weight Based';

  v_sub_total NUMERIC;
  v_gst_amt NUMERIC;
  v_total_est NUMERIC;
  v_total_est_usd NUMERIC;

  v_est_profit NUMERIC;
  v_profit_margin_pct NUMERIC;
  v_is_loss BOOLEAN;

  v_master_gold_24k NUMERIC := 15197.00;
  v_master_gold_22k NUMERIC := 13981.00;
  v_master_gold_18k NUMERIC := 11398.00;
BEGIN
  -- Retrieve live gold rates from DB if available
  SELECT COALESCE(
    (SELECT rate_per_gram_usd FROM public.gold_rates WHERE purity IN ('24K', '24 KT', '24') ORDER BY updated_at DESC LIMIT 1),
    15197.00
  ) INTO v_master_gold_24k;

  SELECT COALESCE(
    (SELECT rate_per_gram_usd FROM public.gold_rates WHERE purity IN ('22K', '22 KT', '22') ORDER BY updated_at DESC LIMIT 1),
    v_master_gold_24k * 0.9167
  ) INTO v_master_gold_22k;

  SELECT COALESCE(
    (SELECT rate_per_gram_usd FROM public.gold_rates WHERE purity IN ('18K', '18 KT', '18') ORDER BY updated_at DESC LIMIT 1),
    v_master_gold_24k * 0.75
  ) INTO v_master_gold_18k;

  -- Read inputs
  v_code := UPPER(TRIM(COALESCE(p_input->>'productCode', p_input->>'sku', p_input->>'name', '')));
  v_purity := UPPER(TRIM(COALESCE(p_input->>'purity', '22K')));
  v_net_wt := GREATEST(0, COALESCE(public.safe_cast_numeric(p_input->>'netWt'), 0));
  v_wastage_pct := COALESCE(public.safe_cast_numeric(p_input->>'wastagePct'), 22.0);
  v_labour_rate_override := public.safe_cast_numeric(p_input->>'labourRateOverride');
  v_labour_amt_override := public.safe_cast_numeric(p_input->>'labourAmtOverride');
  v_purchase_cost := public.safe_cast_numeric(p_input->>'purchaseCost');

  -- 1. Gold Rate Selection
  IF v_purity LIKE '%24%' THEN
    v_gold_rate := v_master_gold_24k;
  ELSIF v_purity LIKE '%18%' THEN
    v_gold_rate := v_master_gold_18k;
  ELSE
    v_gold_rate := v_master_gold_22k;
  END IF;

  -- 2. Billing Weight & Gold Value
  v_billing_weight := v_net_wt * (1.0 + (v_wastage_pct / 100.0));
  v_gold_value := ROUND(v_billing_weight * v_gold_rate, 2);

  -- 3. Stone Calculations
  v_is_diamond_product := v_code LIKE 'D%';

  IF p_input->'stones' IS NOT NULL AND jsonb_typeof(p_input->'stones') = 'array' THEN
    FOR v_stone_elem IN SELECT * FROM jsonb_array_elements(p_input->'stones')
    LOOP
      v_st_name := UPPER(COALESCE(v_stone_elem->>'name', 'Stone'));
      v_st_wt := COALESCE(public.safe_cast_numeric(v_stone_elem->>'weight'), 0);
      v_st_pcs := GREATEST(1, COALESCE((v_stone_elem->>'pcs')::int, 1));
      v_st_base_rate := COALESCE(public.safe_cast_numeric(v_stone_elem->>'rate'), 0);

      IF v_st_base_rate = 0 THEN
        IF v_st_name LIKE '%DIAMOND%' OR v_st_name LIKE '%VVS%' OR v_st_name LIKE '%EF%' OR v_st_name LIKE '%RD%' THEN
          v_st_base_rate := 65000.00;
        ELSIF v_st_name LIKE '%PEAR%' THEN
          v_st_base_rate := 68000.00;
        ELSIF v_st_name LIKE '%STB%' OR v_st_name LIKE '%BAGUETTE%' THEN
          v_st_base_rate := 62000.00;
        ELSIF v_st_name LIKE '%BEAD%' OR v_st_name LIKE '%PEARL%' OR v_st_name LIKE '%BLACKBEAD%' THEN
          v_st_base_rate := 850.00;
        ELSE
          v_st_base_rate := 3500.00;
        END IF;
      END IF;

      v_st_discount := 0;
      IF NOT v_is_diamond_product AND (v_st_name LIKE '%EMERALD%' OR v_st_name LIKE '%RUBY%') THEN
        v_st_discount := 1000.00;
      END IF;

      v_st_final_rate := GREATEST(0, v_st_base_rate - v_st_discount);
      IF v_st_wt > 0 THEN
        v_st_amt := ROUND(v_st_wt * v_st_final_rate);
      ELSE
        v_st_amt := ROUND(v_st_pcs * v_st_final_rate);
      END IF;

      IF v_st_name LIKE '%DIAMOND%' OR v_st_name LIKE '%VVS%' OR v_st_name LIKE '%EF%' OR v_st_name LIKE '%RD%' OR v_st_name LIKE '%SHAPE%' THEN
        v_total_diamond_carats := v_total_diamond_carats + v_st_wt;
      END IF;

      v_total_stone_val := v_total_stone_val + v_st_amt;

      v_processed_stones := v_processed_stones || jsonb_build_object(
        'name', v_stone_elem->>'name',
        'weight', v_st_wt,
        'pcs', v_st_pcs,
        'baseRate', v_st_base_rate,
        'discount', v_st_discount,
        'finalRate', v_st_final_rate,
        'amount', v_st_amt
      );
    END LOOP;
  END IF;

  -- 4. Certification Charges
  IF v_total_diamond_carats > 0 THEN
    v_cert_charges := GREATEST(v_total_diamond_carats * 950.00, 950.00);
  END IF;

  -- 5. Labour Charges
  IF v_labour_amt_override IS NOT NULL AND v_labour_amt_override > 0 THEN
    v_labour_charges := v_labour_amt_override;
    v_labour_type := 'Fixed Override';
  ELSIF v_code LIKE 'D%' THEN
    IF v_net_wt <= 5.20 THEN
      v_labour_charges := 10000.00;
      v_labour_type := 'Tier Override';
    ELSIF v_net_wt < 8.00 THEN
      v_labour_charges := 12000.00;
      v_labour_type := 'Tier Override';
    ELSE
      v_labour_charges := ROUND(v_net_wt * COALESCE(v_labour_rate_override, 1200.00));
      v_labour_type := 'Weight Based';
    END IF;
  ELSIF v_code LIKE 'G%' THEN
    IF v_net_wt < 5.00 THEN
      v_labour_charges := 4000.00;
      v_labour_type := 'Tier Override';
    ELSIF v_net_wt <= 8.00 THEN
      v_labour_charges := 8000.00;
      v_labour_type := 'Tier Override';
    ELSE
      v_labour_charges := ROUND(v_net_wt * COALESCE(v_labour_rate_override, 550.00));
      v_labour_type := 'Weight Based';
    END IF;
  ELSE
    v_labour_charges := ROUND(v_net_wt * COALESCE(v_labour_rate_override, 550.00));
    v_labour_type := 'Weight Based';
  END IF;

  -- 6. Totals
  v_sub_total := v_gold_value + v_total_stone_val + v_labour_charges + v_cert_charges;
  v_gst_amt := ROUND(v_sub_total * 0.03);
  v_total_est := v_sub_total + v_gst_amt;
  v_total_est_usd := ROUND((v_total_est / 83.0), 2);

  IF v_purchase_cost IS NOT NULL AND v_purchase_cost > 0 THEN
    v_est_profit := v_total_est - v_purchase_cost;
    v_profit_margin_pct := ROUND((v_est_profit / v_purchase_cost) * 100.0, 2);
    v_is_loss := v_est_profit < 0;
  END IF;

  RETURN jsonb_build_object(
    'goldRate', v_gold_rate,
    'billingWeight', v_billing_weight,
    'goldValue', v_gold_value,
    'stoneItems', v_processed_stones,
    'totalStoneValue', v_total_stone_val,
    'totalDiamondCarats', v_total_diamond_carats,
    'certCharges', v_cert_charges,
    'labourCharges', v_labour_charges,
    'labourType', v_labour_type,
    'subTotal', v_sub_total,
    'gstAmount', v_gst_amt,
    'totalEstimate', v_total_est,
    'totalEstimateUSD', v_total_est_usd,
    'purchaseCost', v_purchase_cost,
    'estimatedProfit', v_est_profit,
    'profitMarginPct', v_profit_margin_pct,
    'isLoss', v_is_loss
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant EXECUTE permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.calculate_product_estimate_json(JSONB) TO anon, authenticated, service_role;
