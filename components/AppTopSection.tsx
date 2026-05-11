'use client'

import BannerCarousel from '@/components/BannerCarousel'
import SearchBar from '@/components/SearchBar'
import GridMenu from '@/components/GridMenu'

type BannerPosition = 'home' | 'jobs' | 'secondhand' | 'navigation' | 'housing' | 'services' | 'news'

interface Props {
  bannerPosition?: BannerPosition
  showQuickGrid?: boolean
}

/**
 * Unified top section used across main pages.
 * Includes exactly:
 * 1) BannerCarousel
 * 2) homepage-style SearchBar
 * 3) optional GridMenu on news page
 */
export default function AppTopSection({ bannerPosition, showQuickGrid = true }: Props) {
  return (
    <div className="bg-white">
      <BannerCarousel position={bannerPosition || 'home'} />

      <SearchBar />

      {bannerPosition === 'news' && showQuickGrid ? <GridMenu /> : null}
    </div>
  )
}
