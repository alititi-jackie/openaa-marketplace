import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const BASE_URL = SITE_URL

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
    {
      url: `${BASE_URL}/dmv/ny/practice`,
      lastModified: now,
      priority: 0.64,
    },
    {
      url: `${BASE_URL}/dmv/ny/questions`,
      lastModified: now,
      priority: 0.64,
    },
    {
      url: `${BASE_URL}/dmv/ny/mock-test`,
      lastModified: now,
      priority: 0.64,
    },
    {
      url: `${BASE_URL}/dmv/ny/sign-test`,
      lastModified: now,
      priority: 0.64,
    },
    {
      url: `${BASE_URL}/dmv/tickets`,
      lastModified: now,
      priority: 0.64,
    },
  ]
}
