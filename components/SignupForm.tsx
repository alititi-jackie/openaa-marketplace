'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUpWithEmail } from '@/lib/auth'
import GoogleLoginButton from './GoogleLoginButton'

function validateUsername(username: string): string | null {
  const trimmed = username.trim()

  if (!trimmed) return '请输入昵称'
  if (trimmed.length < 2) return '昵称至少需要 2 个字符'
  if (trimmed.length > 20) return '昵称不能超过 20 个字符'

  const normalizedName = trimmed.toLowerCase().replace(/\s+/g, '')

  const blockedWords = [
    // 中文
    '官方',
    '官方账号',
    '平台官方',
    '认证',
    '认证账号',
    '管理员',
    '管理',
    '版主',
    '站长',
    '系统',
    '平台',
    '运营',
    '审核员',
    '监督员',
    '客服',
    '客户服务',
    '服务热线',
    '售后',
    '帮助中心',
    '举报中心',
    '投诉中心',
    'OpenAA',
    'OpenAA官方',
    'openaa',
    '警察',
    '公安',
    '政府',
    '移民局',
    '税务局',
    '银行',
    'DMV',
    'USCIS',
    'IRS',

    // 英文
    'admin',
    'administrator',
    'root',
    'system',
    'official',
    'support',
    'service',
    'moderator',
    'staff',
    'owner',
    'operator',
    'helpdesk',
    'customer service',
    'customerservice',
    'openai',
    'openaa',
    'bank',
    'dmv',
    'uscis',
    'irs',
    'government',
    'police',
  ]

  const hasBlockedWord = blockedWords.some((word) => {
    const normalizedWord = word.toLowerCase().replace(/\s+/g, '')
    return normalizedName.includes(normalizedWord)
  })

  if (hasBlockedWord) {
    return '该昵称包含平台保留词，请换一个昵称'
  }

  return null
}

export default function SignupForm() {
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

    const usernameError = validateUsername(form.username)
    if (usernameError) {
      setError(usernameError)
      return
    }

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
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">注册成功！</h2>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          请先打开您的邮箱，点击 OpenAA 发出的确认链接。邮箱确认完成后，请返回 OpenAA 登录页面重新登录。
        </p>
        <p className="text-gray-400 text-xs leading-relaxed mb-5">
          如果没有收到确认邮件，请检查垃圾邮件箱，或稍后重新注册/重试。
        </p>
        <Link
          href="/auth/login"
          className="inline-block bg-[#1976d2] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1565c0] transition"
        >
          返回登录页面
        </Link>
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
