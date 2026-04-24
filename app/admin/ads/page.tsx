'use client'

import { useState, useEffect, useRef } from 'react'

const POSITIONS = ['home', 'jobs', 'housing', 'marketplace'] as const
type AdPosition = (typeof POSITIONS)[number]

interface Ad {
  id: number
  image_url: string
  link_url: string
  position: AdPosition
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

const POSITION_LABELS: Record<AdPosition, string> = {
  home: '首页',
  jobs: '招聘',
  housing: '房屋',
  marketplace: '二手',
}

export default function AdminAdsPage() {
  const [token, setToken] = useState('')
  const [authed, setAuthed] = useState(false)
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('/')
  const [position, setPosition] = useState<AdPosition>('home')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function authHeaders() {
    return { Authorization: `Bearer ${token}` }
  }

  async function fetchAds() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ads', { headers: authHeaders() })
      const json = await res.json()
      if (!res.ok) { setError(json.error || '加载失败'); return }
      setAds(json.data)
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin() {
    if (!token.trim()) { setError('请输入 Admin Token'); return }
    setError('')
    const res = await fetch('/api/admin/ads', { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { setError('Token 无效'); return }
    setAuthed(true)
  }

  useEffect(() => {
    if (authed) fetchAds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || '上传失败'); return }
      setImageUrl(json.url)
      setSuccess('图片上传成功')
    } catch {
      setError('上传失败')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!imageUrl) { setError('请先上传图片或填写图片链接'); return }
    const validUrl = /^(https?:\/\/|\/)/.test(linkUrl)
    if (!validUrl) { setError('跳转链接必须以 http://, https:// 或 / 开头'); return }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          link_url: linkUrl,
          position,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || '创建失败'); return }
      setSuccess('广告创建成功')
      setImageUrl('')
      setLinkUrl('/')
      setPosition('home')
      setStartDate('')
      setEndDate('')
      setIsActive(true)
      if (fileRef.current) fileRef.current.value = ''
      fetchAds()
    } catch {
      setError('创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(ad: Ad) {
    setError('')
    const res = await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !ad.is_active }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || '更新失败'); return }
    setAds((prev) => prev.map((a) => (a.id === ad.id ? json.data : a)))
  }

  async function handleDelete(id: number) {
    if (!confirm('确认删除此广告？')) return
    setError('')
    const res = await fetch(`/api/admin/ads/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || '删除失败'); return }
    setAds((prev) => prev.filter((a) => a.id !== id))
    setSuccess('广告已删除')
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 w-full max-w-sm">
          <h1 className="text-lg font-bold text-zinc-800 mb-4">广告管理 — 登录</h1>
          {error && <p className="text-rose-500 text-sm mb-3">{error}</p>}
          <label className="block text-sm text-zinc-600 mb-1">Admin Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="输入 ADMIN_TOKEN"
            className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full h-10 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
          >
            登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-zinc-800">广告管理</h1>
          <button
            onClick={() => { setAuthed(false); setAds([]) }}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            退出
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100">
            {success}
          </div>
        )}

        {/* Create Ad Form */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 mb-6">
          <h2 className="text-[15px] font-bold text-zinc-800 mb-4">新建广告</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            {/* Image Upload */}
            <div>
              <label className="block text-sm text-zinc-600 mb-1">图片</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="block w-full text-sm text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
              {uploading && <p className="text-xs text-zinc-400 mt-1">上传中…</p>}
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="或直接输入图片 URL"
                className="mt-2 w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="预览"
                  className="mt-2 h-20 rounded-lg object-cover border border-zinc-100"
                />
              )}
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-sm text-zinc-600 mb-1">点击跳转链接</label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/"
                required
                className="w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm text-zinc-600 mb-1">展示位置</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as AdPosition)}
                className="w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {POSITION_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-zinc-600 mb-1">开始日期（可选）</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 mb-1">结束日期（可选）</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 px-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 text-blue-500 focus:ring-blue-100"
              />
              <label htmlFor="is_active" className="text-sm text-zinc-600">
                立即启用
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full h-10 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {submitting ? '创建中…' : '创建广告'}
            </button>
          </form>
        </div>

        {/* Ad List */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-zinc-800">广告列表</h2>
            <button
              onClick={fetchAds}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              刷新
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-400 text-center py-4">加载中…</p>
          ) : ads.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">暂无广告</p>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className="flex gap-3 p-3 border border-zinc-100 rounded-xl"
                >
                  <img
                    src={ad.image_url}
                    alt=""
                    className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-zinc-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                        {POSITION_LABELS[ad.position]}
                      </span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                          ad.is_active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        {ad.is_active ? '启用' : '停用'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{ad.link_url}</p>
                    {(ad.start_date || ad.end_date) && (
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {ad.start_date ? new Date(ad.start_date).toLocaleDateString('zh-CN') : '—'}
                        {' → '}
                        {ad.end_date ? new Date(ad.end_date).toLocaleDateString('zh-CN') : '无限期'}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className="text-xs px-2 py-1 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition"
                    >
                      {ad.is_active ? '停用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="text-xs px-2 py-1 rounded-lg border border-rose-100 text-rose-500 hover:bg-rose-50 transition"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
