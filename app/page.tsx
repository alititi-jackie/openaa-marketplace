import AppTopSection from '@/components/AppTopSection'
import GridMenu from '@/components/GridMenu'
import LatestPostsSection from '@/components/LatestPostsSection'
import InfoCardsSection from '@/components/InfoCardsSection'
import NewsSection from '@/components/NewsSection'

export default function HomePage() {
  return (
    <div className="bg-white">
      <AppTopSection />

      {/* 8-grid quick-access menu — sits on a zinc-50 band */}
      <GridMenu />

      {/* Latest posts */}
      <LatestPostsSection />

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
