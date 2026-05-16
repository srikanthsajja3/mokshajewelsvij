-- Allow authenticated users to view vendors
-- This is necessary for the "Quick Link" feature and for future marketplace visibility
CREATE POLICY "Allow authenticated users to view vendors" 
ON public.vendors 
FOR SELECT 
TO authenticated 
USING (true);

-- Also ensure vendors can insert into vendor_settings if they don't have a row yet
-- (The trigger handle_vendor_setup usually handles this, but upsert from client needs it)
CREATE POLICY "Vendors can insert their own settings" 
ON public.vendor_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
