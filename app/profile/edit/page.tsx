'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function EditProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', bio: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) setForm({ username: data.username || '', bio: data.bio || '', phone: data.phone || '' })
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const usernameError = validateUsername(form.username)
    if (usernameError) {
      setSaving(false)
      setError(usernameError)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      setError('保存失败：未找到记录或无权限')
      return
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        username: form.username,
        bio: form.bio,
        phone: form.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError || !updated) {
      setSaving(false)
      setError('保存失败：未找到记录或无权限')
      return
    }

    // Sync local state with updated row to avoid UI showing stale values
    setForm({
      username: updated.username || '',
      bio: updated.bio || '',
      phone: updated.phone || '',
    })

    setSaving(false)
    setSuccess(true)
    setTimeout(() => { setSuccess(false); router.push('/profile') }, 1500)
  }

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑资料</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {success && (
          <div className="bg-green-50 text-green-600 rounded-lg p-3 text-sm">✅ 保存成功！</div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input
            type="text"
            value={form.username}
            onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            placeholder="介绍一下自己..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="xxx-xxx-xxxx"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#1976d2] text-white py-2.5 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存更改'}
        </button>
      </form>
    </div>
  )
}
