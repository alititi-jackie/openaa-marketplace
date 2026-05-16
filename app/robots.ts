import { MetadataRoute } from 'next'
import { toAbsoluteUrl } from '@/lib/site'

// Next.js will serve this at /robots.txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/admin',
          '/admin/',
          '/admin/*',
          '/api/admin',
          '/api/admin/*',
          '/auth',
          '/auth/*',
          '/profile',
          '/profile/*',
          '/jobs/publish',
          '/housing/publish',
          '/secondhand/publish',
          '/services/publish',
          '/navigation/my',
        ],
      },
    ],
    // keep sitemap discoverable (but ensure sitemap.ts only outputs public pages)
    sitemap: toAbsoluteUrl('/sitemap.xml'),
  }
}
