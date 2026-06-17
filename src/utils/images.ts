/**
 * Generates an optimized image URL using Supabase's transformation service.
 * @param url The original image URL
 * @param options Transformation options (width, height, quality, format)
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'origin' } = {}
) {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) return url;

  // Supabase transformation URL format requires a Pro plan.
  // Returning the original URL ensures images load correctly.
  return url;
}
