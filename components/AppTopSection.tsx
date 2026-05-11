'use client'

import Header from '@/components/Header'
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
 * 1) city selector row + logo header row (Header)
 * 2) BannerCarousel
 * 3) homepage-style SearchBar
 */
export default function AppTopSection({ bannerPosition, showQuickGrid = true }: Props) {
  return (
    <div className="bg-white">
      <Header />

      {/* Keep header->banner close (no extra spacer gap here) */}
      <BannerCarousel position={bannerPosition || 'home'} showSearchIcon={!bannerPosition || bannerPosition === 'home'} />

      <SearchBar />

      {bannerPosition === 'news' && showQuickGrid ? <GridMenu /> : null}
    </div>
  )
}
