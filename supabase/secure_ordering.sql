-- ==========================================
-- SECURE TRANSACTION AND ORDERING FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.place_secure_order(
  p_shipping_address TEXT,
  p_city TEXT,
  p_zip_code TEXT,
  p_shipping_country TEXT,
  p_cart_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_price NUMERIC;
  v_stock INT;
  v_product_id UUID;
  v_quantity INT;
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Insert order with pending status and 0 amount
  INSERT INTO public.orders (
    user_id,
    total_amount,
    shipping_address,
    city,
    zip_code,
    shipping_country,
    status
  ) VALUES (
    auth.uid(),
    0,
    p_shipping_address,
    p_city,
    p_zip_code,
    p_shipping_country,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- 2. Process cart items and validate prices/stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items) LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    -- Look up authentic price and stock quantity from database products table
    SELECT base_price_usd, stock_quantity INTO v_price, v_stock
    FROM public.products 
    WHERE id = v_product_id;

    IF v_price IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    -- Decrement product stock
    UPDATE public.products 
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_product_id;

    -- Insert item record with validated base price
    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      price_at_purchase
    ) VALUES (
      v_order_id,
      v_product_id,
      v_quantity,
      v_price
    );

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  -- 3. Update the final order total based on authentic computed prices
  UPDATE public.orders 
  SET total_amount = v_total
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- SECURE PAYMENT CONFIRMATION FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.confirm_secure_payment(
  p_order_id UUID,
  p_payment_intent_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure the user owns the order or is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = p_order_id 
    AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update order status to paid
  UPDATE public.orders
  SET 
    status = 'paid',
    payment_intent_id = COALESCE(p_payment_intent_id, payment_intent_id)
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
