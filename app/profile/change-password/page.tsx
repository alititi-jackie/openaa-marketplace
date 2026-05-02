'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ current: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!form.current) { setError('请输入原密码'); return }
    if (!form.newPassword) { setError('请输入新密码'); return }
    if (form.newPassword.length < 6) { setError('新密码至少需要 6 位'); return }
    if (!form.confirm) { setError('请再次输入新密码'); return }
    if (form.newPassword !== form.confirm) { setError('两次输入的新密码不一致'); return }

    setSubmitting(true)
    // Placeholder: real Supabase change-password logic will be added in a future iteration.
    // A short delay simulates async work so the button disabled state is briefly visible.
    setTimeout(() => {
      setSubmitting(false)
      setSuccess(true)
    }, 300)
  }

  if (loading) return <div className="flex justify-center py-20 text-zinc-500">加载中...</div>

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto max-w-[560px] px-4 pt-6 pb-24 space-y-4">
        <div className="px-1">
          <h1 className="text-[18px] font-black text-zinc-900 tracking-tight">修改密码</h1>
          <p className="mt-1 text-[12px] text-zinc-500">
            请输入原密码和新密码。修改成功后，请使用新密码重新登录。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-6 space-y-4"
        >
          {success && (
            <div className="bg-zinc-50 text-zinc-600 rounded-lg p-3 text-sm text-center">
              修改密码功能即将开放
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原密码</label>
            <input
              type="password"
              value={form.current}
              onChange={e => setForm(prev => ({ ...prev, current: e.target.value }))}
              placeholder="请输入原密码"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="请输入新密码"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(prev => ({ ...prev, confirm: e.target.value }))}
              placeholder="请再次输入新密码"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认修改'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/profile/edit" className="text-[13px] text-zinc-500 hover:text-zinc-700 transition">
            返回编辑资料
          </Link>
        </div>
      </div>
    </div>
  )
}
