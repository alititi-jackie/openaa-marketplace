import { MetadataRoute } from 'next'

const BASE_URL = 'https://app.openaa.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

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
      url: `${BASE_URL}/profile`,
      lastModified: now,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/jobs/publish?type=hiring`,
      lastModified: now,
      priority: 0.64,
    },
    {
      url: `${BASE_URL}/housing/publish?type=renting`,
      lastModified: now,
      priority: 0.64,
    },
    {
      url: `${BASE_URL}/secondhand/publish?type=selling`,
      lastModified: now,
      priority: 0.64,
    },
  ]
}
