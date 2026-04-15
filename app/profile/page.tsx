'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ProfileHeader from '@/components/ProfileHeader'
import type { UserProfile } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

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

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>
  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <ProfileHeader profile={profile} />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <Link
          href="/profile/edit"
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100"
        >
          <span className="text-gray-900">✏️ 编辑资料</span>
          <span className="text-gray-400">›</span>
        </Link>
        <Link
          href="/profile/my-items"
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100"
        >
          <span className="text-gray-900">🛍️ 我的商品</span>
          <span className="text-gray-400">›</span>
        </Link>
        <Link
          href="/profile/my-jobs"
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
        >
          <span className="text-gray-900">💼 我的招聘</span>
          <span className="text-gray-400">›</span>
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition"
      >
        退出登录
      </button>
    </div>
  )
}
