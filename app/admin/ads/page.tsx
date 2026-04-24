'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

interface Ad {
  id: string
  image_url: string
  link_url?: string | null
  link_type?: string | null
  external_url?: string | null
  slug?: string | null
  content?: string | null
  position: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

function AdsAdminContent() {
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [linkType, setLinkType] = useState<'external' | 'internal'>('external')
  const [externalUrl, setExternalUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [position, setPosition] = useState<'home' | 'jobs' | 'secondhand'>('home')
  const [isActive, setIsActive] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const qToken = searchParams.get('token')
    const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''
    const t = qToken || stored || ''
    setToken(t)
    if (t) fetchAds(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAds(t: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ads', {
        headers: { 'x-admin-token': t },
      })
      const json = await res.json()
      if (json.data) setAds(json.data)
      else setMessage(json.error || '获取失败')
    } catch {
      setMessage('网络错误')
    }
    setLoading(false)
  }

  function saveToken() {
    localStorage.setItem('admin_token', token)
    fetchAds(token)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageFile) { setMessage('请选择图片'); return }
    if (linkType === 'external' && !externalUrl) { setMessage('请填写外部链接'); return }
    if (linkType === 'internal' && !slug) { setMessage('请填写页面标识 (slug)'); return }

    setLoading(true)
    setMessage('')
    const form = new FormData()
    form.append('image', imageFile)
    form.append('link_type', linkType)
    if (linkType === 'external') form.append('external_url', externalUrl)
    if (linkType === 'internal') {
      form.append('slug', slug)
      if (content) form.append('content', content)
    }
    form.append('position', position)
    form.append('is_active', String(isActive))
    if (startDate) form.append('start_date', startDate)
    if (endDate) form.append('end_date', endDate)

    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: form,
      })
      const json = await res.json()
      if (json.data) {
        setMessage('创建成功')
        setExternalUrl('')
        setSlug('')
        setContent('')
        setStartDate('')
        setEndDate('')
        setImageFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchAds(token)
      } else {
        setMessage(json.error || '创建失败')
      }
    } catch {
      setMessage('网络错误')
    }
    setLoading(false)
  }

  async function toggleActive(ad: Ad) {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !ad.is_active }),
      })
      const json = await res.json()
      if (json.data) fetchAds(token)
      else setMessage(json.error || '更新失败')
    } catch {
      setMessage('网络错误')
    }
  }

  async function deleteAd(id: string) {
    if (!confirm('确定删除这条广告?')) return
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      })
      const json = await res.json()
      if (json.success) fetchAds(token)
      else setMessage(json.error || '删除失败')
    } catch {
      setMessage('网络错误')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">广告管理</h1>

      {/* Token input */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
        <label className="block text-sm font-medium mb-1">Admin Token</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="输入管理 Token"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={saveToken}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            确认
          </button>
        </div>
      </div>

      {/* Create form */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-xl border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">新增广告</h2>

        <div>
          <label className="block text-sm font-medium mb-1">广告图片 *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600"
          />
        </div>

        {/* Link type radio */}
        <div>
          <label className="block text-sm font-medium mb-2">链接类型 *</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="link_type"
                value="external"
                checked={linkType === 'external'}
                onChange={() => setLinkType('external')}
              />
              外部链接 (External Link)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="link_type"
                value="internal"
                checked={linkType === 'internal'}
                onChange={() => setLinkType('internal')}
              />
              内部详情页 (Internal Detail Page)
            </label>
          </div>
        </div>

        {/* External URL */}
        {linkType === 'external' && (
          <div>
            <label className="block text-sm font-medium mb-1">外部链接地址 *</label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Internal slug + content */}
        {linkType === 'internal' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">页面标识 (slug) *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. summer-sale-2024"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">访问路径将为 /ads/{slug || '你的标识'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">详情内容（可选）</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="广告详细描述..."
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-y"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">位置</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as 'home' | 'jobs' | 'secondhand')}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="home">首页 (home)</option>
            <option value="jobs">招聘 (jobs)</option>
            <option value="secondhand">二手 (secondhand)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="is_active" className="text-sm font-medium">立即启用</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">开始日期（可选）</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">结束日期（可选）</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? '处理中...' : '提交广告'}
        </button>
      </form>

      {/* Ad list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">现有广告</h2>
        {loading && <p className="text-sm text-gray-500">加载中...</p>}
        {ads.length === 0 && !loading && (
          <p className="text-sm text-gray-400">暂无广告</p>
        )}
        <ul className="space-y-3">
          {ads.map((ad) => (
            <li key={ad.id} className="p-4 bg-white rounded-xl border shadow-sm flex gap-3 items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.image_url}
                alt=""
                className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  {ad.link_type === 'internal'
                    ? `/ads/${ad.slug ?? ''}`
                    : (ad.external_url || ad.link_url || '')}
                </p>
                <p className="text-xs mt-1">
                  <span className="font-medium">位置:</span> {ad.position}
                  {' · '}
                  <span className={`font-medium ${ad.link_type === 'internal' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {ad.link_type === 'internal' ? '内部页' : '外部链接'}
                  </span>
                  {' · '}
                  <span className={ad.is_active ? 'text-green-600' : 'text-gray-400'}>
                    {ad.is_active ? '启用' : '停用'}
                  </span>
                </p>
                {(ad.start_date || ad.end_date) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ad.start_date ? ad.start_date.slice(0, 10) : '—'} →{' '}
                    {ad.end_date ? ad.end_date.slice(0, 10) : '—'}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleActive(ad)}
                  className="text-xs px-3 py-1 rounded-lg border font-medium"
                >
                  {ad.is_active ? '停用' : '启用'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAd(ad.id)}
                  className="text-xs px-3 py-1 rounded-lg border border-red-300 text-red-500 font-medium"
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function AdsAdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">加载中...</div>}>
      <AdsAdminContent />
    </Suspense>
  )
}
