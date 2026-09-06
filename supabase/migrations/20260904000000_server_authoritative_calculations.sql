-- Migration: Server-Authoritative Calculation Engine
-- Date: 2026-09-04

-- 1. Exchange Rates Table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  currency_code TEXT PRIMARY KEY,
  rate_vs_usd NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT '1g',
  factor NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  locale TEXT NOT NULL DEFAULT 'en-US',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Exchange Rates
INSERT INTO public.exchange_rates (currency_code, rate_vs_usd, unit, factor, locale)
VALUES
  ('INR', 83.00, '1g', 1, 'en-IN'),
  ('USD', 1.00,  '1g', 1, 'en-US'),
  ('GBP', 0.79,  '1g', 1, 'en-GB'),
  ('AED', 3.67,  '1g', 1, 'en-AE'),
  ('CAD', 1.35,  '1g', 1, 'en-CA'),
  ('AUD', 1.52,  '1g', 1, 'en-AU'),
  ('SGD', 1.34,  '1g', 1, 'en-SG')
ON CONFLICT (currency_code) DO UPDATE
SET rate_vs_usd = EXCLUDED.rate_vs_usd,
    updated_at = NOW();

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on exchange_rates"
  ON public.exchange_rates FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Server RPC: Get Latest Gold Rates per Purity in Target Currency
CREATE OR REPLACE FUNCTION public.get_latest_gold_rates(p_country_code TEXT DEFAULT 'IN')
RETURNS JSONB AS $$
DECLARE
  v_base_usd NUMERIC(10, 2) := 75.00;
  v_curr_code TEXT := 'INR';
  v_exchange_rate NUMERIC(10, 4) := 83.00;
  v_unit TEXT := '1g';
  v_locale TEXT := 'en-IN';
  v_result JSONB;
BEGIN
  -- Get active 24K USD rate from gold_rates table if available
  SELECT COALESCE(
    (SELECT rate_per_gram_usd FROM public.gold_rates WHERE purity IN ('24K', '24 KT', '24') ORDER BY updated_at DESC LIMIT 1),
    75.00
  ) INTO v_base_usd;

  -- Convert INR raw inputs if entered as INR per gram in admin panel (> 1000)
  IF v_base_usd > 1000 THEN
    v_base_usd := v_base_usd / 83.00;
  END IF;

  -- Get exchange config for country
  IF p_country_code = 'IN' THEN v_curr_code := 'INR'; v_exchange_rate := 83.00; v_locale := 'en-IN';
  ELSIF p_country_code = 'US' THEN v_curr_code := 'USD'; v_exchange_rate := 1.00; v_locale := 'en-US';
  ELSIF p_country_code = 'GB' THEN v_curr_code := 'GBP'; v_exchange_rate := 0.79; v_locale := 'en-GB';
  ELSIF p_country_code = 'AE' THEN v_curr_code := 'AED'; v_exchange_rate := 3.67; v_locale := 'en-AE';
  ELSIF p_country_code = 'CA' THEN v_curr_code := 'CAD'; v_exchange_rate := 1.35; v_locale := 'en-CA';
  ELSIF p_country_code = 'AU' THEN v_curr_code := 'AUD'; v_exchange_rate := 1.52; v_locale := 'en-AU';
  ELSIF p_country_code = 'SG' THEN v_curr_code := 'SGD'; v_exchange_rate := 1.34; v_locale := 'en-SG';
  END IF;

  -- Try reading from exchange_rates table if present
  SELECT COALESCE(currency_code, v_curr_code), COALESCE(rate_vs_usd, v_exchange_rate), COALESCE(locale, v_locale)
  INTO v_curr_code, v_exchange_rate, v_locale
  FROM public.exchange_rates
  WHERE currency_code = (
    CASE p_country_code
      WHEN 'IN' THEN 'INR' WHEN 'US' THEN 'USD' WHEN 'GB' THEN 'GBP'
      WHEN 'AE' THEN 'AED' WHEN 'CA' THEN 'CAD' WHEN 'AU' THEN 'AUD'
      WHEN 'SG' THEN 'SGD' ELSE 'USD'
    END
  );

  v_result := jsonb_build_object(
    'base_usd_24k', v_base_usd,
    'currency', v_curr_code,
    'exchange_rate', v_exchange_rate,
    'locale', v_locale,
    'rates', jsonb_build_array(
      jsonb_build_object('purity', '24K', 'usd_rate', v_base_usd, 'local_rate', ROUND(v_base_usd * v_exchange_rate, 2)),
      jsonb_build_object('purity', '22K', 'usd_rate', ROUND(v_base_usd * 0.9167, 2), 'local_rate', ROUND(v_base_usd * 0.9167 * v_exchange_rate, 2)),
      jsonb_build_object('purity', '18K', 'usd_rate', ROUND(v_base_usd * 0.75, 2), 'local_rate', ROUND(v_base_usd * 0.75 * v_exchange_rate, 2))
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Server RPC: Get Cart Summary & Financial Totals
CREATE OR REPLACE FUNCTION public.get_cart_summary(p_user_id UUID, p_country_code TEXT DEFAULT 'IN')
RETURNS JSONB AS $$
DECLARE
  v_exchange_rate NUMERIC(10, 4) := 83.00;
  v_currency TEXT := 'INR';
  v_subtotal_usd NUMERIC(10, 2) := 0;
  v_subtotal_local NUMERIC(10, 2) := 0;
  v_gst_local NUMERIC(10, 2) := 0;
  v_grand_total_local NUMERIC(10, 2) := 0;
  v_total_items INT := 0;
  v_items_json JSONB := '[]'::jsonb;
BEGIN
  -- Determine exchange rate
  IF p_country_code = 'IN' THEN v_exchange_rate := 83.00; v_currency := 'INR';
  ELSE v_exchange_rate := 1.00; v_currency := 'USD';
  END IF;

  -- Aggregate cart items directly in Postgres
  SELECT 
    COALESCE(SUM(ci.quantity * COALESCE(p.base_price_usd, 0)), 0),
    COALESCE(SUM(ci.quantity), 0),
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'quantity', ci.quantity,
        'unit_price_usd', COALESCE(p.base_price_usd, 0),
        'unit_price_local', ROUND(COALESCE(p.base_price_usd, 0) * v_exchange_rate, 2),
        'line_total_local', ROUND(COALESCE(p.base_price_usd, 0) * ci.quantity * v_exchange_rate, 2)
      )
    ), '[]'::jsonb)
  INTO v_subtotal_usd, v_total_items, v_items_json
  FROM public.cart_items ci
  JOIN public.products p ON p.id = ci.product_id
  WHERE ci.user_id = p_user_id;

  v_subtotal_local := ROUND(v_subtotal_usd * v_exchange_rate, 2);
  v_gst_local := ROUND(v_subtotal_local * 0.03, 2); -- 3% GST
  v_grand_total_local := v_subtotal_local + v_gst_local;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'country_code', p_country_code,
    'currency', v_currency,
    'total_items', v_total_items,
    'subtotal_usd', v_subtotal_usd,
    'subtotal_local', v_subtotal_local,
    'gst_amount_local', v_gst_local,
    'grand_total_local', v_grand_total_local,
    'items', v_items_json
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Execute Permissions
GRANT EXECUTE ON FUNCTION public.get_latest_gold_rates(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_cart_summary(UUID, TEXT) TO anon, authenticated, service_role;
