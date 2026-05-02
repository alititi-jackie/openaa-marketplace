'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('请输入邮箱')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    setLoading(true)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/reset-password`,
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message || '发送失败，请稍后重试')
      return
    }

    setSuccess(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-900">忘记密码</h1>

        <p className="mt-3 mb-6 text-center text-[13.5px] leading-relaxed text-zinc-500">
          请输入您的注册邮箱，我们会发送一封密码重置邮件。
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 rounded-lg p-4 text-sm leading-relaxed">
              如果该邮箱已注册，我们已发送密码重置邮件。请打开邮箱查看来自 Supabase Auth（noreply@mail.app.supabase.io）的邮件，并按邮件提示重置密码。
            </div>
            <p className="text-center text-xs text-zinc-400">
              如果没有收到邮件，请检查垃圾邮件箱，或稍后重试。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
            >
              {loading ? '发送中...' : '发送重置邮件'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          <Link href="/auth/login" className="text-[#1976d2] hover:underline font-medium">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  )
}
