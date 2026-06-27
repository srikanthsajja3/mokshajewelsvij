-- Create admin full access policy on homepage_banners
CREATE POLICY "Allow admin full access to homepage_banners" 
  ON public.homepage_banners FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
