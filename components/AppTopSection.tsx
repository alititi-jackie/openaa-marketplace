'use client'

import Header from '@/components/Header'
import BannerCarousel from '@/components/BannerCarousel'
import SearchBar from '@/components/SearchBar'

/**
 * Unified top section used across main pages.
 * Includes exactly:
 * 1) city selector row + logo header row (Header)
 * 2) BannerCarousel
 * 3) homepage-style SearchBar
 */
export default function AppTopSection() {
  return (
    <div className="bg-white">
      <Header />

      {/* Keep header->banner close (no extra spacer gap here) */}
      <BannerCarousel />

      <SearchBar />
    </div>
  )
}
