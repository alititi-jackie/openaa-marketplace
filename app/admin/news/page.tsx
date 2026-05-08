'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { NewsPost } from '@/types'
import { NEWS_CATEGORIES, NEWS_SLUG_REGEX } from '@/lib/news'

type FormState = {
  title: string
  slug: string
  category: string
  summary: string
  cover_image_url: string
  content: string
  seo_title: string
  seo_description: string
  is_published: boolean
}

const emptyForm: FormState = {
  title: '',
  slug: '',
  category: NEWS_CATEGORIES[0],
  summary: '',
  cover_image_url: '',
  content: '',
  seo_title: '',
  seo_description: '',
  is_published: false,
}

function formatDate(value: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('zh-CN')
  } catch {
    return value
  }
}

export default function AdminNewsPage() {
  const [token, setToken] = useState('')
  const [inputToken, setInputToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [hasAccess, setHasAccess] = useState(true)

  const fetchPosts = useCallback(async (adminToken: string) => {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/admin/news', {
      headers: { 'x-admin-token': adminToken },
    })
    const json: unknown = await res.json()

    if (res.status === 401) {
      setHasAccess(false)
      setMessage('无权限访问')
      setPosts([])
      setLoading(false)
      return
    }

    setHasAccess(true)
    if (
      json !== null &&
      typeof json === 'object' &&
      'data' in json &&
      Array.isArray((json as Record<string, unknown>).data)
    ) {
      setPosts((json as { data: NewsPost[] }).data)
    } else {
      setMessage(
        json !== null && typeof json === 'object' && 'error' in json
          ? String((json as Record<string, unknown>).error || '获取失败')
          : '获取失败'
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''
    if (stored) {
      setToken(stored)
      setInputToken(stored)
      fetchPosts(stored)
    } else {
      setHasAccess(false)
    }
  }, [fetchPosts])

  function saveToken() {
    localStorage.setItem('admin_token', inputToken)
    setToken(inputToken)
    fetchPosts(inputToken)
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setMessage('')
  }

  function startEdit(post: NewsPost) {
    setEditingId(post.id)
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category,
      summary: post.summary || '',
      cover_image_url: post.cover_image_url || '',
      content: post.content,
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      is_published: post.is_published,
    })
    setShowForm(true)
    setMessage('')
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim() || !form.category.trim()) {
      setMessage('请完整填写标题、slug、分类与正文')
      return
    }

    if (!NEWS_SLUG_REGEX.test(form.slug.trim())) {
      setMessage('Slug 只能使用英文小写、数字和短横线，例如 openaa-new-user-guide')
      return
    }

    setLoading(true)
    setMessage('')
    const endpoint = editingId ? `/api/admin/news/${editingId}` : '/api/admin/news'
    const method = editingId ? 'PATCH' : 'POST'

    const res = await fetch(endpoint, {
      method,
      headers: {
        'x-admin-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim(),
        category: form.category.trim(),
        content: form.content.trim(),
        summary: form.summary.trim(),
        cover_image_url: form.cover_image_url.trim(),
        seo_title: form.seo_title.trim(),
        seo_description: form.seo_description.trim(),
      }),
    })

    const json: unknown = await res.json()
    if (res.status === 401) {
      setHasAccess(false)
      setMessage('无权限访问')
      setLoading(false)
      return
    }

    if (res.ok) {
      setMessage('保存成功')
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await fetchPosts(token)
    } else {
      setMessage(
        json !== null && typeof json === 'object' && 'error' in json
          ? String((json as Record<string, unknown>).error || '保存失败')
          : '保存失败'
      )
    }
    setLoading(false)
  }

  async function updatePublish(post: NewsPost, isPublished: boolean) {
    setLoading(true)
    const res = await fetch(`/api/admin/news/${post.id}`, {
      method: 'PATCH',
      headers: {
        'x-admin-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_published: isPublished }),
    })
    if (res.status === 401) {
      setHasAccess(false)
      setMessage('无权限访问')
      setLoading(false)
      return
    }
    if (!res.ok) {
      const json: unknown = await res.json()
      setMessage(
        json !== null && typeof json === 'object' && 'error' in json
          ? String((json as Record<string, unknown>).error || '操作失败')
          : '操作失败'
      )
      setLoading(false)
      return
    }
    await fetchPosts(token)
    setLoading(false)
  }

  async function removePost(id: string) {
    if (!confirm('确定要删除这篇新闻吗？删除后不可恢复。')) return

    setLoading(true)
    const res = await fetch(`/api/admin/news/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': token },
    })
    if (res.status === 401) {
      setHasAccess(false)
      setMessage('无权限访问')
      setLoading(false)
      return
    }
    if (!res.ok) {
      setMessage('删除失败')
      setLoading(false)
      return
    }
    await fetchPosts(token)
    setLoading(false)
  }

  const sortedPosts = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const t1 = new Date(b.updated_at).getTime()
        const t2 = new Date(a.updated_at).getTime()
        return t1 - t2
      }),
    [posts]
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">新闻管理</h1>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          + 新增新闻
        </button>
      </div>

      <div className="mb-6 rounded-xl border bg-gray-50 p-4">
        <p className="mb-1 text-sm font-medium">Admin Token</p>
        {!hasAccess ? <p className="mb-2 text-sm text-red-500">无权限访问</p> : null}
        <div className="flex gap-2">
          <input
            type="password"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="输入管理 Token"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={saveToken}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            确认
          </button>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={submitForm} className="mb-6 space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{editingId ? '编辑新闻' : '新增新闻'}</h2>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="标题 *"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="slug *"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {NEWS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            placeholder="摘要"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            value={form.cover_image_url}
            onChange={(e) => setForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
            placeholder="封面图 URL"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="正文 *"
            rows={8}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            value={form.seo_title}
            onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
            placeholder="SEO 标题"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={form.seo_description}
            onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
            placeholder="SEO 描述"
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
            />
            立即发布
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setForm(emptyForm)
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700"
            >
              取消
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <p className={`mb-4 text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-gray-500">加载中...</p> : null}

      <div className="space-y-3">
        {sortedPosts.map((post) => (
          <div key={post.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {post.category} · {post.is_published ? '已发布' : '草稿'}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  发布时间：{formatDate(post.published_at)} · 更新时间：{formatDate(post.updated_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700"
                >
                  编辑
                </button>
                {post.is_published ? (
                  <button
                    type="button"
                    onClick={() => updatePublish(post, false)}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700"
                  >
                    下架
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updatePublish(post, true)}
                    className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700"
                  >
                    发布
                  </button>
                )}
                {post.is_published ? (
                  <Link
                    href={`/news/${post.slug}`}
                    target="_blank"
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700"
                  >
                    查看
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => removePost(post.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
