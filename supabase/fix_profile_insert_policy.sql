-- =======================================================
-- ADD PROFILE INSERT POLICY WITH ROLE ESCALATION PROTECTION
-- =======================================================

-- Allow users to insert their own profile, but force the role to 'customer'
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND role = 'customer'
);

-- Force cache reload
NOTIFY pgrst, 'reload schema';
