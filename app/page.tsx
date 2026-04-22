import BannerCarousel from '@/components/BannerCarousel'
import SearchBar from '@/components/SearchBar'
import GridMenu from '@/components/GridMenu'
import LatestPostsSection from '@/components/LatestPostsSection'
import InfoCardsSection from '@/components/InfoCardsSection'
import NewsSection from '@/components/NewsSection'

export default function HomePage() {
  return (
    <div className="bg-zinc-50">
      {/* Banner carousel */}
      <BannerCarousel />

      {/* Search bar — breathing room below banner */}
      <div className="mt-3 bg-white pt-3 pb-1 px-0">
        <SearchBar />
      </div>

      {/* 8-grid quick-access menu */}
      <GridMenu />

      {/* Latest posts */}
      <div className="mt-3 bg-white">
        <LatestPostsSection />
      </div>

      {/* Thin section divider */}
      <div className="h-3 bg-zinc-50 mt-4" />

      {/* DMV + exchange rate info cards */}
      <div className="bg-white">
        <InfoCardsSection />
      </div>

      {/* Thin section divider */}
      <div className="h-3 bg-zinc-50 mt-4" />

      {/* News section */}
      <div className="bg-white">
        <NewsSection />
      </div>
    </div>
  )
}
