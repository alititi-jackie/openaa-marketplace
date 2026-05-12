import AppTopSection from '@/components/AppTopSection'
import BackToTopButton from '@/components/BackToTopButton'
import MyNavigationClient from '@/components/MyNavigationClient'

export default function MyNavigationPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppTopSection bannerPosition="navigation" />
      <MyNavigationClient />
      <BackToTopButton />
    </div>
  )
}
