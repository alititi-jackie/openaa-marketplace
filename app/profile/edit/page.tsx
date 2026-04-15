'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', bio: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('users').upsert({
      id: user.id,
      username: form.username,
      bio: form.bio,
      phone: form.phone,
      updated_at: new Date().toISOString(),
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
