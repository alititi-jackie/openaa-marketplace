'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="hidden md:block bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-[#1976d2]">
          OpenAA
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/secondhand" className="text-gray-700 hover:text-[#1976d2] transition">
            二手交易
          </Link>
          <Link href="/jobs" className="text-gray-700 hover:text-[#1976d2] transition">
            招聘信息
          </Link>

          {user ? (
            <>
              <Link
                href="/secondhand/publish"
                className="bg-[#1976d2] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#1565c0] transition"
              >
                发布商品
              </Link>
              <Link href="/profile" className="text-gray-700 hover:text-[#1976d2] transition">
                个人中心
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 text-sm transition"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-700 hover:text-[#1976d2] transition">
                登录
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#1976d2] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#1565c0] transition"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
