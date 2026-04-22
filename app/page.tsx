import BannerCarousel from '@/components/BannerCarousel'
import SearchBar from '@/components/SearchBar'
import GridMenu from '@/components/GridMenu'
import LatestPostsSection from '@/components/LatestPostsSection'
import InfoCardsSection from '@/components/InfoCardsSection'
import NewsSection from '@/components/NewsSection'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Banner carousel */}
      <BannerCarousel />

      {/* Search bar — clear gap below banner */}
      <div className="mt-4">
        <SearchBar />
      </div>

      {/* 8-grid quick-access menu */}
      <div className="mt-5">
        <GridMenu />
      </div>

      {/* Latest posts */}
      <div className="mt-2">
        <LatestPostsSection />
      </div>

      {/* Thin section divider */}
      <div className="h-2 bg-zinc-50 mt-6" />

      {/* DMV + exchange rate info cards */}
      <InfoCardsSection />

      {/* Thin section divider */}
      <div className="h-2 bg-zinc-50 mt-6" />

      {/* News section */}
      <NewsSection />
    </div>
  )
}
