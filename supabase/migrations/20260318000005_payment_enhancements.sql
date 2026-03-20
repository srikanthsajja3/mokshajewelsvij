-- Enhance Orders for Payment Gateway Integration

-- 1. Add Payment Intent ID for Stripe/Gateway tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- 2. Refine status check
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled'));

-- 3. Comment for documentation
COMMENT ON COLUMN public.orders.payment_intent_id IS 'Unique ID from the payment gateway (e.g., Stripe pi_...)';
