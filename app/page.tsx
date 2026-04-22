import BannerCarousel from '@/components/BannerCarousel'
import SearchBar from '@/components/SearchBar'
import GridMenu from '@/components/GridMenu'
import LatestPostsSection from '@/components/LatestPostsSection'
import InfoCardsSection from '@/components/InfoCardsSection'
import NewsSection from '@/components/NewsSection'

export default function HomePage() {
  return (
    <div className="bg-zinc-50 pb-8">
      {/* Banner carousel */}
      <BannerCarousel />

      {/* Search bar */}
      <SearchBar />

      {/* 8-grid quick-access menu — sits on a zinc-50 band */}
      <GridMenu />

      {/* Latest posts */}
      <LatestPostsSection />

      {/* Thin section divider */}
      <div className="h-2 bg-zinc-100 mt-8" />

      {/* DMV + exchange rate info cards */}
      <InfoCardsSection />

      {/* Thin section divider */}
      <div className="h-2 bg-zinc-100 mt-8" />

      {/* News section */}
      <NewsSection />
    </div>
  )
}
