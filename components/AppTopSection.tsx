'use client'

import Header from '@/components/Header'
import BannerCarousel from '@/components/BannerCarousel'
import SearchBar from '@/components/SearchBar'

type BannerPosition = 'home' | 'jobs' | 'secondhand' | 'navigation'

interface Props {
  bannerPosition?: BannerPosition
}

/**
 * Unified top section used across main pages.
 * Includes exactly:
 * 1) city selector row + logo header row (Header)
 * 2) BannerCarousel
 * 3) homepage-style SearchBar
 */
export default function AppTopSection({ bannerPosition = 'home' }: Props) {
  return (
    <div className="bg-white">
      <Header />

      {/* Keep header->banner close (no extra spacer gap here) */}
      {/*
        NOTE: BannerCarousel currently fetches home banners internally.
        The bannerPosition prop is wired for future BannerCarousel support,
        but must not break production builds.
      */}
      <BannerCarousel />

      <SearchBar />
    </div>
  )
}
