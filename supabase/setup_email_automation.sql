-- ==========================================
-- AUTOMATION: ORDER NOTIFICATION EMAILS
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_order_notification()
RETURNS trigger AS $$
DECLARE
  jwt_claims_text TEXT;
  jwt_claims_json JSONB;
  auth_header TEXT := '';
BEGIN
  -- Trigger when an order is created with a relevant status, 
  -- or when the status has changed to a relevant one.
  IF (TG_OP = 'INSERT' AND NEW.status IN ('paid', 'processing', 'shipped', 'delivered')) OR 
     (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('paid', 'processing', 'shipped', 'delivered')) THEN
    
    -- Attempt to get JWT claims safely
    BEGIN
      jwt_claims_text := current_setting('request.jwt.claims', true);
      IF jwt_claims_text IS NOT NULL AND jwt_claims_text <> '' THEN
        jwt_claims_json := jwt_claims_text::jsonb;
        -- Use the API key if present, otherwise no auth header (the function should handle simulation)
        IF jwt_claims_json ? 'api_key' THEN
          auth_header := 'Bearer ' || (jwt_claims_json->>'api_key');
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If JSON parsing fails, we just continue without the auth header
      auth_header := '';
    END;

    -- Wrap the HTTP call in its own block to catch ANY error
    -- This ensures the order insertion NEVER fails even if the network call does
    BEGIN
      PERFORM
        net.http_post(
          url := 'https://tnvdmftovccgfrllaffq.supabase.co/functions/v1/order-confirmation',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', auth_header
          ),
          body := jsonb_build_object('record', row_to_json(NEW))
        );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error to Postgres logs but let the transaction continue
      RAISE WARNING 'Order notification failed for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_order_status_update ON public.orders;
CREATE TRIGGER on_order_status_update
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_notification();
