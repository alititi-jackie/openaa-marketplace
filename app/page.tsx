import AppTopSection from '@/components/AppTopSection'
import GridMenu from '@/components/GridMenu'
import LatestPostsSection from '@/components/LatestPostsSection'
import InfoCardsSection from '@/components/InfoCardsSection'
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

      <BackToTopButton />
    </div>
  )
}
