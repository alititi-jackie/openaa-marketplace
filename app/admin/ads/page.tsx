'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface Ad {
  id: string
  image_url: string
  link_url: string
  position: 'home' | 'jobs' | 'secondhand'
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

const POSITIONS = [
  { value: 'home', label: '首页 (home)' },
  { value: 'jobs', label: '招聘 (jobs)' },
  { value: 'secondhand', label: '二手 (secondhand)' },
]

function getAdminToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('admin_token') || ''
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [authed, setAuthed] = useState(false)

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [position, setPosition] = useState<'home' | 'jobs' | 'secondhand'>('home')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = getAdminToken()
    if (stored) {
      setAdminToken(stored)
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (authed && adminToken) fetchAds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, adminToken])

  function handleLogin() {
    if (!tokenInput.trim()) return
    localStorage.setItem('admin_token', tokenInput.trim())
    setAdminToken(tokenInput.trim())
    setAuthed(true)
  }

  async function fetchAds() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ads', {
        headers: { 'x-admin-token': adminToken },
      })
      if (res.ok) {
        const json = await res.json()
        setAds(json.data || [])
      } else {
        setError('加载失败')
      }
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!imageFile && !imagePreview) {
      setFormError('请选择图片')
      return
    }
    if (!linkUrl.trim()) {
      setFormError('请填写链接')
      return
    }
    setSubmitting(true)
    try {
      let imageUrl = imagePreview
      if (imageFile) {
        const fd = new FormData()
        fd.append('file', imageFile)
        const uploadRes = await fetch('/api/admin/ads/upload', {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
          body: fd,
        })
        if (!uploadRes.ok) {
          const j = await uploadRes.json()
          setFormError(j.error || '上传失败')
          return
        }
        const { url } = await uploadRes.json()
        imageUrl = url
      }

      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          image_url: imageUrl,
          link_url: linkUrl.trim(),
          position,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: isActive,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        setFormError(j.error || '创建失败')
        return
      }
      // Reset form
      setImageFile(null)
      setImagePreview('')
      setLinkUrl('')
      setPosition('home')
      setStartDate('')
      setEndDate('')
      setIsActive(true)
      if (fileRef.current) fileRef.current.value = ''
      await fetchAds()
    } catch {
      setFormError('操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(ad: Ad) {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ is_active: !ad.is_active }),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error || '操作失败')
        return
      }
      await fetchAds()
    } catch {
      setError('操作失败，请重试')
    }
  }

  async function deleteAd(id: string) {
    if (!confirm('确认删除此广告？')) return
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error || '删除失败')
        return
      }
      await fetchAds()
    } catch {
      setError('删除失败，请重试')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm">
          <h1 className="text-lg font-bold text-zinc-800 mb-4">管理员登录</h1>
          <input
            type="password"
            placeholder="输入 ADMIN_TOKEN"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white font-semibold rounded-xl py-2.5 text-sm"
          >
            登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-zinc-800">广告管理</h1>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('admin_token')
              setAuthed(false)
              setAdminToken('')
              setTokenInput('')
            }}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            退出
          </button>
        </div>

        {/* Create form */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 mb-6">
          <h2 className="text-[15px] font-semibold text-zinc-700 mb-4">新建广告</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Image upload */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">广告图片</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-600"
              />
              {imagePreview && (
                <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-zinc-100">
                  <Image src={imagePreview} alt="preview" fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">跳转链接</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">展示位置</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as 'home' | 'jobs' | 'secondhand')}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">开始时间（可选）</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">结束时间（可选）</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-blue-500' : 'bg-zinc-300'}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-zinc-600">{isActive ? '立即投放' : '暂不投放'}</span>
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-500 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-60"
            >
              {submitting ? '提交中...' : '创建广告'}
            </button>
          </form>
        </div>

        {/* Ads list */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5">
          <h2 className="text-[15px] font-semibold text-zinc-700 mb-4">
            广告列表
            {loading && <span className="ml-2 text-xs text-zinc-400">加载中...</span>}
          </h2>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          {ads.length === 0 && !loading && (
            <p className="text-sm text-zinc-400">暂无广告</p>
          )}
          <div className="space-y-3">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="flex items-center gap-3 border border-zinc-100 rounded-xl p-3"
              >
                <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100">
                  <Image src={ad.image_url} alt="ad" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-700 truncate">{ad.link_url}</p>
                  <p className="text-[11px] text-zinc-400">
                    {POSITIONS.find((p) => p.value === ad.position)?.label ?? ad.position}
                    {' · '}
                    {ad.is_active ? '投放中' : '已暂停'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleActive(ad)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-lg ${ad.is_active ? 'bg-zinc-100 text-zinc-500' : 'bg-blue-50 text-blue-600'}`}
                  >
                    {ad.is_active ? '暂停' : '启用'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAd(ad.id)}
                    className="text-[11px] font-medium px-2 py-1 rounded-lg bg-red-50 text-red-500"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
