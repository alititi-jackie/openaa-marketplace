'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUpWithEmail } from '@/lib/auth'
import GoogleLoginButton from './GoogleLoginButton'

export default function SignupForm() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('两次密码不一致')
      return
    }
    if (form.password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)
    const { error } = await signUpWithEmail(form.email, form.password, form.username)

    if (error) {
      setError(error.message || '注册失败，请重试')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">注册成功！</h2>
        <p className="text-gray-600 text-sm">请检查你的邮箱并点击确认链接</p>
        <p className="text-gray-400 text-xs mt-2">3秒后跳转到登录页...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">注册 OpenAA</h1>

      <GoogleLoginButton />

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-sm">或</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="请输入用户名"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="your@email.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="至少6个字符"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="再次输入密码"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
        >
          {loading ? '注册中...' : '创建账号'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        已有账号？{' '}
        <Link href="/auth/login" className="text-[#1976d2] hover:underline font-medium">
          立即登录
        </Link>
      </p>
    </div>
  )
}
