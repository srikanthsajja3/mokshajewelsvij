-- RPC to delete all data associated with a user
-- This is called from the ProfileScreen when a user deletes their account

DROP FUNCTION IF EXISTS public.delete_user_data();

CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS void AS $$
DECLARE
  uid UUID;
BEGIN
  uid := auth.uid();
  
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from all related tables (Order CASCADE handles some, but let's be explicit)
  DELETE FROM public.cart_items WHERE user_id = uid;
  DELETE FROM public.wishlist WHERE user_id = uid;
  DELETE FROM public.addresses WHERE user_id = uid;
  DELETE FROM public.reviews WHERE user_id = uid;
  
  -- Profiles will be deleted via CASCADE if they reference auth.users
  -- But we might want to keep the profile record if needed, though usually CASCADE is better
  DELETE FROM public.profiles WHERE id = uid;

  -- Finally, sign out the user (this doesn't delete the auth.users record)
  -- To delete auth.users, you need service_role, which we can't do via RPC safely without SECURITY DEFINER
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
