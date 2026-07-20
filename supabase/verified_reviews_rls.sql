-- =======================================================
-- ENFORCE VERIFIED PURCHASER REVIEWS
-- =======================================================
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;

CREATE POLICY "Only verified purchasers can review products" 
ON public.reviews FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.user_id = auth.uid() 
    AND o.status = 'paid'
    AND oi.product_id = reviews.product_id
  )
);

-- Force cache reload
NOTIFY pgrst, 'reload schema';
