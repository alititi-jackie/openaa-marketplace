import AppTopSection from '@/components/AppTopSection'
import BackToTopButton from '@/components/BackToTopButton'
import MyNavigationClient from '@/components/MyNavigationClient'
import DetailBackButton from '@/components/DetailBackButton'
import ShareButton from '@/components/ShareButton'

export default function MyNavigationPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppTopSection bannerPosition="navigation" />
      <div className="mx-auto w-full max-w-[860px] px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <DetailBackButton fallbackHref="/" label="← 返回首页" inToolbar forceHref />
          <ShareButton path="/navigation/my" title="我的导航 - OpenAA" text="保存常用网站，打开 OpenAA 快速访问。" />
        </div>
      </div>
      <MyNavigationClient />
      <BackToTopButton />
    </div>
  )
}
