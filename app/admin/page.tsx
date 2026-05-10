'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/adminToken'

type AdminEntry = {
  id: string
  icon: string
  title: string
  description: string
  status: '已可用' | '待开发'
  href?: string
}

const ADMIN_ENTRIES: AdminEntry[] = [
  {
    id: 'ads',
    icon: '📢',
    title: '广告管理',
    description: '管理首页、招聘、房屋、二手、导航、新闻等广告位。',
    status: '已可用',
    href: '/admin/ads',
  },
  {
    id: 'news',
    icon: '📰',
    title: '新闻管理',
    description: '发布、编辑、下架新闻资讯内容。',
    status: '已可用',
    href: '/admin/news',
  },
  {
    id: 'feedback',
    icon: '🛎️',
    title: '反馈与举报',
    description: '查看用户反馈、举报、新闻线索和问题建议。',
    status: '待开发',
  },
  {
    id: 'services',
    icon: '🧰',
    title: '本地服务管理',
    description: '管理用户发布的本地服务信息。',
    status: '待开发',
  },
  {
    id: 'posts',
    icon: '🗂️',
    title: '帖子管理',
    description: '统一管理招聘、房屋、二手和本地服务帖子。',
    status: '待开发',
  },
  {
    id: 'users',
    icon: '👥',
    title: '用户管理',
    description: '管理用户状态、封禁与审核。',
    status: '待开发',
  },
  {
    id: 'navigation',
    icon: '🧭',
    title: '导航管理',
    description: '管理 OpenAA 公共导航和用户导航内容。',
    status: '待开发',
  },
  {
    id: 'image-cleanup',
    icon: '🧹',
    title: '图片清理工具',
    description: '扫描未使用图片，管理员确认后删除。',
    status: '待开发',
  },
]

const ROADMAP_ITEMS = [
  '反馈管理',
  '帖子统一审核',
  '用户管理',
  '导航管理',
  '图片清理工具',
  '全站置顶管理',
  'SEO 工具',
]

export default function AdminHomePage() {
  const [tokenInput, setTokenInput] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsLoggedIn(Boolean(getAdminToken()))
    setIsReady(true)
  }, [])

  function handleLogin() {
    const token = tokenInput.trim()
    if (!token) return
    setAdminToken(token)
    setIsLoggedIn(true)
    setTokenInput('')
  }

  function handleLogout() {
    clearAdminToken()
    setTokenInput('')
    setIsLoggedIn(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          ← 返回首页
        </Link>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">OpenAA 管理后台</h1>
            <p className="mt-2 text-sm text-zinc-600">
              集中管理广告、新闻、反馈、本地服务和网站功能。
            </p>
          </div>
          {isReady && isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-sm text-green-700">
                已登录后台
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                退出后台
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {!isReady ? null : !isLoggedIn ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-6">
          <h2 className="text-lg font-semibold text-zinc-900">OpenAA 管理后台</h2>
          <p className="mt-1 text-sm text-zinc-600">请输入 Admin Token 进入后台管理入口</p>
          <label className="mt-4 block text-sm font-medium text-zinc-700">Admin Token</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Admin Token"
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              进入后台
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {ADMIN_ENTRIES.map((entry) => {
              return (
                <div key={entry.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg leading-none">{entry.icon}</p>
                      <h2 className="mt-2 text-base font-semibold text-zinc-900">{entry.title}</h2>
                      <p className="mt-1 text-sm text-zinc-600">{entry.description}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                        entry.status === '已可用'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          : 'bg-zinc-100 text-zinc-600 ring-zinc-200'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  {entry.status === '已可用' && entry.href ? (
                    <Link
                      href={entry.href}
                      className="mt-3 inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      进入
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-3 inline-flex cursor-not-allowed items-center rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-400"
                    >
                      待开发
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-semibold text-zinc-900">后续计划</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
              {ROADMAP_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
