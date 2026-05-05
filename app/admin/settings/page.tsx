'use client'

import { useState, useEffect, Suspense } from 'react'

const STORAGE_KEY = 'admin_token'

function SettingsAdminContent() {
  const [token, setToken] = useState('')
  const [dailyPostLimit, setDailyPostLimit] = useState(5)
  const [inputLimit, setInputLimit] = useState('5')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState('')

  function saveToken() {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
      setMessage('Token 已保存')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  async function fetchSettings(t: string) {
    if (!t) return
    setFetching(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-token': t },
      })
      if (!res.ok) {
        const json: unknown = await res.json()
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '加载失败'
        setMessage(errMsg)
        return
      }
      const json: unknown = await res.json()
      if (
        json !== null &&
        typeof json === 'object' &&
        'daily_post_limit' in json &&
        typeof (json as Record<string, unknown>).daily_post_limit === 'number'
      ) {
        const limit = (json as { daily_post_limit: number }).daily_post_limit
        setDailyPostLimit(limit)
        setInputLimit(String(limit))
      }
    } catch {
      setMessage('网络错误，请稍后重试')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || ''
    if (saved) {
      setToken(saved)
      fetchSettings(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    const parsed = parseInt(inputLimit, 10)
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
      setMessage('请输入 1~100 之间的整数')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({ daily_post_limit: parsed }),
      })

      const json: unknown = await res.json()

      if (!res.ok) {
        const errMsg =
          json !== null &&
          typeof json === 'object' &&
          'error' in json &&
          typeof (json as Record<string, unknown>).error === 'string'
            ? (json as { error: string }).error
            : '保存失败'
        setMessage(errMsg)
        return
      }

      if (
        json !== null &&
        typeof json === 'object' &&
        'daily_post_limit' in json &&
        typeof (json as Record<string, unknown>).daily_post_limit === 'number'
      ) {
        const limit = (json as { daily_post_limit: number }).daily_post_limit
        setDailyPostLimit(limit)
        setInputLimit(String(limit))
      }

      setMessage('保存成功')
    } catch {
      setMessage('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">站点设置</h1>

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
            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm"
          >
            保存 Token
          </button>
          <button
            type="button"
            onClick={() => fetchSettings(token)}
            disabled={fetching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {fetching ? '加载中...' : '加载设置'}
          </button>
        </div>
      </div>

      {/* Settings form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">每日发帖上限</label>
          <p className="text-xs text-gray-500 mb-2">
            每个账号每天最多可发布的招聘、房屋、二手信息总数。
          </p>
          <input
            type="number"
            value={inputLimit}
            onChange={(e) => setInputLimit(e.target.value)}
            min={1}
            max={100}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            当前已保存值：{dailyPostLimit} 条 · 允许范围：1~100
          </p>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.includes('成功') || message.includes('已保存')
                ? 'text-green-600'
                : 'text-red-500'
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存设置'}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-400">
        注意：每日发帖上限功能需要数据库中存在 <code>site_settings</code> 表。若尚未创建，当前限制为默认值 5 条。
      </p>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-gray-500">加载中...</div>}>
      <SettingsAdminContent />
    </Suspense>
  )
}
