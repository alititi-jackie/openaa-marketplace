'use client'

import { useState, useEffect, Suspense } from 'react'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'
import AdminPageHeader from '@/components/AdminPageHeader'
import BackToTopButton from '@/components/BackToTopButton'

function SettingsAdminContent() {
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [isUsingUnifiedToken, setIsUsingUnifiedToken] = useState(false)
  const [showTokenEditor, setShowTokenEditor] = useState(false)
  const [dailyPostLimit, setDailyPostLimit] = useState(5)
  const [inputLimit, setInputLimit] = useState('5')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState('')

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
    const saved = getAdminToken()
    if (saved) {
      setToken(saved)
      setTokenInput(saved)
      setIsUsingUnifiedToken(true)
      fetchSettings(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function saveToken() {
    const nextToken = tokenInput.trim()
    if (!nextToken) {
      setMessage('请输入 Admin Token')
      return
    }
    setAdminToken(nextToken)
    setToken(nextToken)
    setIsUsingUnifiedToken(true)
    setShowTokenEditor(false)
    setMessage('')
    fetchSettings(nextToken)
  }

  function logoutAdmin() {
    clearAdminToken()
    setToken('')
    setTokenInput('')
    setIsUsingUnifiedToken(false)
    setShowTokenEditor(false)
    setDailyPostLimit(5)
    setInputLimit('5')
    setMessage('')
  }

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
      <AdminPageHeader
        title="站点设置"
        isLoggedIn={isUsingUnifiedToken}
        onLogout={logoutAdmin}
        onChangeToken={() => setShowTokenEditor((prev) => !prev)}
      />

      {/* Token section */}
      {!token || showTokenEditor ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
          <label className="block text-sm font-medium mb-1">Admin Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="输入管理 Token"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={saveToken}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              {showTokenEditor ? '更新 Token' : '保存 Token'}
            </button>
            {token ? (
              <button
                type="button"
                onClick={() => fetchSettings(token)}
                disabled={fetching}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {fetching ? '加载中...' : '加载设置'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Settings form — only shown when token is set */}
      {token && !showTokenEditor ? (
        <>
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
                  message.includes('成功')
                    ? 'text-green-600'
                    : 'text-red-500'
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchSettings(token)}
                disabled={fetching}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm disabled:opacity-50"
              >
                {fetching ? '加载中...' : '重新加载'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存设置'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-gray-400">
            注意：每日发帖上限功能需要数据库中存在 <code>site_settings</code> 表。若尚未创建，当前限制为默认值 5 条。
          </p>
        </>
      ) : null}

      {message && !token ? (
        <p className="text-sm text-red-500">{message}</p>
      ) : null}
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <>
      <Suspense fallback={<div className="flex justify-center py-20 text-gray-500">加载中...</div>}>
        <SettingsAdminContent />
      </Suspense>
      <BackToTopButton />
    </>
  )
}

