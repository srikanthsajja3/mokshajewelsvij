-- ==========================================
-- AUTOMATION: ORDER CONFIRMATION EMAILS
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_order_confirmation()
RETURNS trigger AS $$
BEGIN
  -- We only want to trigger this when an order is newly created with status 'paid'
  -- or when an existing order is updated to 'paid'
  IF (TG_OP = 'INSERT' AND NEW.status = 'paid') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'paid' AND NEW.status = 'paid') THEN
    
    PERFORM
      net.http_post(
        url := 'https://tnvdmftovccgfrllaffq.supabase.co/functions/v1/order-confirmation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::jsonb->>'api_key' -- Note: In real trigger use service_role
        ),
        body := jsonb_build_object('record', row_to_json(NEW))
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger (Alternative: Use Supabase Dashboard -> Database -> Webhooks)
-- Note: It is often easier to set up a Webhook in the Supabase UI 
-- under "Database" -> "Webhooks" pointing to the 'order-confirmation' function.
-- But if you prefer SQL:

/*
DROP TRIGGER IF EXISTS on_order_paid ON public.orders;
CREATE TRIGGER on_order_paid
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_confirmation();
*/

-- RECOMMENDED: Use Supabase Webhooks UI for more reliability and easier monitoring.
-- Event: INSERT and UPDATE
-- Table: public.orders
-- URL: https://tnvdmftovccgfrllaffq.supabase.co/functions/v1/order-confirmation
