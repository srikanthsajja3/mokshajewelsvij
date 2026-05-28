-- ==========================================
-- FIX VENDOR LINKING FOR MOKSHA JEWELS
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Get your User ID from profiles (assuming you are the only user or most recent)
-- If you have multiple users, replace 'your-email@example.com' with your actual login email
DO $$
DECLARE
    target_user_id UUID;
    target_vendor_id UUID;
BEGIN
    -- Find the user ID (change the email to your login email if needed)
    -- SELECT id INTO target_user_id FROM auth.users WHERE email = 'your-email@example.com';
    
    -- Fallback: Use the most recently created profile if email is unknown
    SELECT id INTO target_user_id FROM public.profiles ORDER BY created_at DESC LIMIT 1;
    
    -- Find a mock vendor to link to
    SELECT id INTO target_vendor_id FROM public.vendors WHERE name = 'Heritage Crafts' LIMIT 1;

    IF target_user_id IS NOT NULL AND target_vendor_id IS NOT NULL THEN
        -- 2. Ensure the profile has the 'vendor' role
        UPDATE public.profiles 
        SET role = 'vendor' 
        WHERE id = target_user_id;

        -- 3. Create or Update vendor_settings
        INSERT INTO public.vendor_settings (user_id, vendor_id, business_name, is_verified)
        VALUES (target_user_id, target_vendor_id, 'My Artisan Studio', true)
        ON CONFLICT (user_id) DO UPDATE 
        SET vendor_id = EXCLUDED.vendor_id, 
            role = 'vendor', -- just in case
            is_verified = true;

        RAISE NOTICE 'Successfully linked user % to vendor %', target_user_id, target_vendor_id;
    ELSE
        RAISE EXCEPTION 'Could not find user or vendor. Please check email or ensure vendors exist.';
    END IF;
END $$;
