-- Create public read policy on homepage_banners
CREATE POLICY "Allow public read access to homepage_banners" 
  ON public.homepage_banners FOR SELECT 
  USING (true);
