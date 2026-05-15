import { MetadataRoute } from 'next'

const BASE_URL = 'https://app.openaa.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // Only include public, indexable pages.
  // Do NOT include admin/auth/profile, API routes, publish/edit flows, or "my" pages.
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: now,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/housing`,
      lastModified: now,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/secondhand`,
      lastModified: now,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: now,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: now,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/navigation`,
      lastModified: now,
      priority: 0.64,
    },
    {
      url: `${BASE_URL}/dmv`,
      lastModified: now,
      priority: 0.64,
    },
  ]
}
