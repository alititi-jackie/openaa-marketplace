'use client'

import Header from '@/components/Header'
import BannerCarousel from '@/components/BannerCarousel'
import SearchBar from '@/components/SearchBar'

/**
 * Unified top section used across main pages.
 * Includes exactly:
 * 1) city selector row
 * 2) OpenAA logo header row
 * 3) BannerCarousel
 * 4) homepage style search bar
 */
export default function AppTopSection() {
  return (
    <div className="bg-white">
      {/* 1) city selector row + 2) logo header row */}
      <Header />

      {/* spacer to account for fixed header height */}
      <div className="h-14" />

      {/* 3) banner */}
      <BannerCarousel />

      {/* 4) search */}
      <SearchBar />
    </div>
  )
}
