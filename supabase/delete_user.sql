-- ==========================================
-- SECURE ACCOUNT DELETION FUNCTION (COMPLIANCE)
-- ==========================================

DROP FUNCTION IF EXISTS public.delete_user_data();

CREATE OR REPLACE FUNCTION public.delete_user_data()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (cascades to profiles, orders, reviews, wishlist, cart)
  DELETE FROM auth.users 
  WHERE id = v_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
