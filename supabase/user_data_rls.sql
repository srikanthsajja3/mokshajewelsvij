-- =======================================================
-- CONSOLIDATED RLS POLICIES FOR USER-SPECIFIC TABLES
-- =======================================================

-- 1. Enable RLS on Cart, Wishlist, Addresses, and Reviews
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;


-- =======================================================
-- CART ITEMS POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
CREATE POLICY "Users can insert their own cart items" 
ON public.cart_items FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
CREATE POLICY "Users can update their own cart items" 
ON public.cart_items FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items FOR DELETE 
TO authenticated
USING (user_id = auth.uid());


-- =======================================================
-- WISHLIST POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
CREATE POLICY "Users can view their own wishlist" 
ON public.wishlist FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can insert their own wishlist items" 
ON public.wishlist FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON public.wishlist;
CREATE POLICY "Users can delete their own wishlist items" 
ON public.wishlist FOR DELETE 
TO authenticated
USING (user_id = auth.uid());


-- =======================================================
-- ADDRESSES POLICIES (Privacy & GDPR Protection)
-- =======================================================
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" 
ON public.addresses FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses" 
ON public.addresses FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" 
ON public.addresses FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" 
ON public.addresses FOR DELETE 
TO authenticated
USING (user_id = auth.uid());


-- =======================================================
-- REVIEWS POLICIES
-- =======================================================
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews" 
ON public.reviews FOR SELECT 
USING (true); -- Public views reviews

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews" 
ON public.reviews FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" 
ON public.reviews FOR DELETE 
TO authenticated
USING (user_id = auth.uid());


-- Force cache reload
NOTIFY pgrst, 'reload schema';
