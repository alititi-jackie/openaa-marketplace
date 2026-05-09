import AppTopSection from '@/components/AppTopSection'
import GridMenu from '@/components/GridMenu'
import LatestPostsSection from '@/components/LatestPostsSection'
import InfoCardsSection from '@/components/InfoCardsSection'
import NewsSection from '@/components/NewsSection'
import BackToTopButton from '@/components/BackToTopButton'

export default function HomePage() {
  return (
    <div className="bg-white">
      <AppTopSection bannerPosition="home" />

      {/* 8-grid quick-access menu — sits on a zinc-50 band */}
      <GridMenu />

      {/* DMV + exchange rate info cards */}
      <InfoCardsSection />

      {/* Latest posts */}
      <LatestPostsSection />

      {/* Thin section divider */}
      <div className="h-2 bg-zinc-50 mt-6" />

      {/* News section */}
      <NewsSection />

      <BackToTopButton />
    </div>
  )
}
