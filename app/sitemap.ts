import type { MetadataRoute } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mscsrmap.xyz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/events`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/team`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/gallery`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('events')
      .select('slug, updated_at')
      .eq('is_published', true)
      .not('slug', 'is', null);

    if (error) {
      console.error('[sitemap] Could not load published events:', error.message);
      return staticRoutes;
    }

    const eventRoutes: MetadataRoute.Sitemap = (data || [])
      .filter((event) => typeof event.slug === 'string' && event.slug.length > 0)
      .map((event) => ({
        url: `${BASE_URL}/events/${encodeURIComponent(event.slug)}`,
        ...(event.updated_at ? { lastModified: event.updated_at } : {}),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    return [...staticRoutes, ...eventRoutes];
  } catch (error) {
    console.error('[sitemap] Failed to generate dynamic event URLs:', error);
    return staticRoutes;
  }
}
