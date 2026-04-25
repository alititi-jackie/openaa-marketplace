'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase,
  ShoppingBag,
  Home,
  Megaphone,
  Heart,
  Clock,
  Phone,
  Handshake,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProfileHeader from '@/components/ProfileHeader'
import type { UserProfile } from '@/types'

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5 overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-1">
      <h2 className="text-[14px] font-black text-zinc-900 tracking-tight">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p>
      ) : null}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      } else {
        const newProfile = {
          id: user.id,
          email: user.email ?? '',
          username:
            user.user_metadata?.username ??
            user.email?.split('@')[0] ??
            '用户',
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

  const welcomeText = useMemo(() => {
    const name = profile?.username || '用户'
    return `欢迎回来，${name}。`
  }, [profile?.username])

  if (loading)
    return <div className="flex justify-center py-20 text-zinc-500">加载中...</div>
  if (!profile) return null

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto max-w-[560px] px-4 pt-6 pb-24 space-y-4">
        {/* Page title */}
        <div className="px-1">
          <h1 className="text-[18px] font-black text-zinc-900 tracking-tight">
            OpenAA 用户中心
          </h1>
          <p className="mt-1 text-[12px] text-zinc-500">{welcomeText}</p>
        </div>

        {/* Profile header (existing component) */}
        <ProfileHeader profile={profile} />

        {/* 我要发布 */}
        <div className="space-y-2">
          <SectionTitle
            title="我要发布"
            subtitle="选择你要发布的内容（发布功能将集中在用户中心）"
          />

          <Card>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/jobs/publish"
                  className="rounded-2xl p-4 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                      <Briefcase size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">
                        发布招聘
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        去发布职位
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/secondhand/publish"
                  className="rounded-2xl p-4 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center">
                      <ShoppingBag size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">
                        发布二手
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        去发布商品
                      </div>
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  disabled
                  className="text-left rounded-2xl p-4 bg-zinc-50 ring-1 ring-zinc-100 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
                      <Home size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">
                        发布房屋
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        即将上线
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled
                  className="text-left rounded-2xl p-4 bg-zinc-50 ring-1 ring-zinc-100 opacity-60 cursor-not-allowed"
                  title="广告发布请联系管理员"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 ring-1 ring-violet-100 flex items-center justify-center">
                      <Megaphone size={18} className="text-violet-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-zinc-900">
                        发布广告
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        请联系管理员
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* 我的发布（占位） */}
        <div className="space-y-2">
          <SectionTitle title="我的发布" subtitle="（占位）" />
          <Card>
            <div className="p-4 text-[13px] text-zinc-500">
              这里将展示你发布的招聘、二手、房屋等内容。
            </div>
          </Card>
        </div>

        {/* 收藏/浏览记录（占位） */}
        <div className="space-y-2">
          <SectionTitle title="收藏 / 浏览记录" subtitle="（占位）" />
          <Card>
            <div className="p-4 text-[13px] text-zinc-500">
              这里将展示你的收藏与浏览记录。
            </div>
          </Card>
        </div>

        {/* 联系与合作 */}
        <div className="space-y-2">
          <SectionTitle title="联系与合作" subtitle="如需帮助或合作，请联系 OpenAA" />
          <Card>
            <div className="divide-y divide-zinc-100">
              <a
                href="mailto:hello@openaa.example"
                className="flex items-center justify-between p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                    <Phone size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-zinc-900">
                      联系 OpenAA
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      邮件咨询 / 反馈建议
                    </div>
                  </div>
                </div>
                <span className="text-zinc-300">›</span>
              </a>

              <button
                type="button"
                className="w-full text-left flex items-center justify-between p-4 hover:bg-zinc-50 transition"
                onClick={() => alert('广告合作请联系管理员 / 官方渠道（占位）')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center">
                    <Handshake size={18} className="text-amber-700" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-zinc-900">
                      广告合作入口
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      请联系管理员
                    </div>
                  </div>
                </div>
                <span className="text-zinc-300">›</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Quick links (optional placeholders) */}
        <div className="space-y-2">
          <SectionTitle title="快捷入口" subtitle="常用功能" />
          <Card>
            <div className="divide-y divide-zinc-100">
              <Link
                href="/profile/my-jobs"
                className="flex items-center justify-between p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-50 ring-1 ring-zinc-100 flex items-center justify-center">
                    <Briefcase size={18} className="text-zinc-700" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-zinc-900">我的招聘</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">管理已发布职位</div>
                  </div>
                </div>
                <span className="text-zinc-300">›</span>
              </Link>

              <Link
                href="/profile/my-items"
                className="flex items-center justify-between p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-50 ring-1 ring-zinc-100 flex items-center justify-center">
                    <ShoppingBag size={18} className="text-zinc-700" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-zinc-900">我的二手</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">管理已发布商品</div>
                  </div>
                </div>
                <span className="text-zinc-300">›</span>
              </Link>

              <Link
                href="/profile/edit"
                className="flex items-center justify-between p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-50 ring-1 ring-zinc-100 flex items-center justify-center">
                    <Heart size={18} className="text-zinc-700" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-zinc-900">编辑资料</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">昵称 / 简介 / 联系方式</div>
                  </div>
                </div>
                <span className="text-zinc-300">›</span>
              </Link>

              <button
                type="button"
                className="w-full text-left flex items-center justify-between p-4 hover:bg-zinc-50 transition"
                onClick={() => alert('敬请期待（占位）')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-50 ring-1 ring-zinc-100 flex items-center justify-center">
                    <Clock size={18} className="text-zinc-700" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-zinc-900">浏览记录</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">（占位）</div>
                  </div>
                </div>
                <span className="text-zinc-300">›</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
