'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Briefcase,
  Home,
  PlusSquare,
  Share2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProfileHeader from '@/components/ProfileHeader'
import type { UserProfile } from '@/types'
import A2HSButton, { IosA2HSModal } from '@/components/A2HSButton'
import { shareOpenAA } from '@/lib/share'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishOpen, setPublishOpen] = useState(false)
  const [iosA2hsOpen, setIosA2hsOpen] = useState(false)
  const [toast, setToast] = useState<string>('')

  const showToast = (message: string, durationMs = 1800) => {
    setToast(message)
    setTimeout(() => setToast(''), durationMs)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Guest mode: do NOT redirect; keep page visible
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()

      if (data) setProfile(data)
      else {
        const newProfile = {
          id: user.id,
          email: user.email ?? '',
          username: user.user_metadata?.username ?? user.email?.split('@')[0] ?? '用户',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await supabase.from('users').insert(newProfile)
        setProfile(newProfile)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleShare = async () => {
    const res = await shareOpenAA()
    if (res === 'copied') {
      showToast('✅ 链接已复制')
    }
  }

  if (loading) return <div className="flex justify-center py-20 text-zinc-500">加载中...</div>

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto max-w-[560px] px-4 pt-6 pb-24 space-y-4">
        <div className="px-1">
          <h1 className="text-[18px] font-black text-zinc-900 tracking-tight">OpenAA 用户中心</h1>
          <p className="mt-1 text-[12px] text-zinc-500">管理我的信息与发布入口</p>
        </div>

        {profile ? (
          <ProfileHeader profile={profile} />
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-black text-zinc-900">未登录</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">登录后可管理发布与个人信息</div>
              </div>
              <Link
                href="/auth/login"
                className="rounded-2xl bg-zinc-900 text-white font-bold text-[13px] px-4 py-2"
              >
                登录
              </Link>
            </div>
          </div>
        )}

        <div className="px-1 space-y-3">
          <div>
            <h2 className="text-[14px] font-black text-zinc-900 tracking-tight">快捷操作</h2>
          </div>

          <div className="grid grid-cols-2 max-[359px]:grid-cols-1 gap-3">
            <A2HSButton
              onIosNeedInstructions={() => setIosA2hsOpen(true)}
              onAlreadyInstalled={() =>
                showToast('OpenAA 已经添加到桌面了，无需重复添加。', 2400)
              }
              className="text-left rounded-2xl border border-blue-100 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <PlusSquare size={18} className="text-blue-600" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold leading-tight text-blue-600">OpenAA</div>
                  <div className="mt-1 text-[13px] font-semibold leading-tight text-slate-900">
                    添加到桌面
                  </div>
                </div>
              </div>
            </A2HSButton>

            <button
              type="button"
              onClick={handleShare}
              className="text-left rounded-2xl border border-orange-100 bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Share2 size={17} className="text-orange-500" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold leading-tight text-blue-600">OpenAA</div>
                  <div className="mt-1 text-[13px] font-semibold leading-tight text-slate-900">
                    分享给朋友
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5 overflow-hidden">
          {/* 我要发布 (expand) */}
          <button
            type="button"
            onClick={() => setPublishOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition border-b border-zinc-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-900 font-medium">🚀 我要发布</span>
              <span className="text-[11px] text-zinc-400">二手 / 招聘 / 房屋 / 服务</span>
            </div>
            {publishOpen ? (
              <ChevronUp size={18} className="text-zinc-400" />
            ) : (
              <ChevronDown size={18} className="text-zinc-400" />
            )}
          </button>

          {publishOpen && (
            <div className="px-4 pb-4 pt-2 border-b border-zinc-100">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/secondhand/publish"
                  className="rounded-2xl p-3 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center">
                      <ShoppingBag size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">发布二手</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">去发布商品</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/jobs/publish"
                  className="rounded-2xl p-3 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                      <Briefcase size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">发布招聘</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">去发布职位</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/housing/publish"
                  className="text-left rounded-2xl p-3 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
                      <Home size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">发布房源</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">去发布房源</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/services/publish"
                  className="text-left rounded-2xl p-3 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 ring-1 ring-cyan-100 flex items-center justify-center">
                      <span className="text-base leading-none">🛠️</span>
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">发布服务</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">去发布服务</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Menu order (exact) */}
          <Link
            href="/profile/my-items"
            className="flex items-center justify-between p-4 hover:bg-zinc-50 transition border-b border-zinc-100"
          >
            <span className="text-zinc-900">🛍️ 我的商品</span>
            <span className="text-zinc-300">›</span>
          </Link>

          <Link
            href="/profile/my-jobs"
            className="flex items-center justify-between p-4 hover:bg-zinc-50 transition border-b border-zinc-100"
          >
            <span className="text-zinc-900">💼 我的招聘</span>
            <span className="text-zinc-300">›</span>
          </Link>

          <Link
            href="/profile/my-housing"
            className="flex items-center justify-between p-4 hover:bg-zinc-50 transition border-b border-zinc-100"
          >
            <span className="text-zinc-900">🏠 我的房屋</span>
            <span className="text-zinc-300">›</span>
          </Link>

          <Link
            href="/profile/my-services"
            className="flex items-center justify-between p-4 hover:bg-zinc-50 transition border-b border-zinc-100"
          >
            <span className="text-zinc-900">🛠️ 我的服务</span>
            <span className="text-zinc-300">›</span>
          </Link>

          <Link
            href="/profile/edit"
            className="flex items-center justify-between p-4 hover:bg-zinc-50 transition border-b border-zinc-100"
          >
            <span className="text-zinc-900">✏️ 编辑资料</span>
            <span className="text-zinc-300">›</span>
          </Link>

          {profile ? (
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center justify-between p-4 hover:bg-red-50 transition"
            >
              <span className="text-red-600 font-medium">退出登录</span>
              <span className="text-red-300">›</span>
            </button>
          ) : (
            <div className="p-4 text-[12px] text-zinc-400">登录后可使用更多功能</div>
          )}
        </div>
      </div>

      {toast ? (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[110]">
          <div className="rounded-full bg-zinc-900 text-white text-[12px] font-semibold px-4 py-2 shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}

      <IosA2HSModal open={iosA2hsOpen} onClose={() => setIosA2hsOpen(false)} />
    </div>
  )
}
