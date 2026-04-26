'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { SecondhandItem } from '@/types'

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return s
  }
}

function typeLabel(t?: string) {
  return t === 'buying' ? '求购' : '出售'
}

function typeBadgeClass(t?: string) {
  return t === 'buying'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
}

function displayPrice(item: SecondhandItem) {
  const price = Number(item.price || 0)
  if (!Number.isFinite(price) || price <= 0) return '价格面议'
  return `$${price}`
}

export default function MyItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<SecondhandItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('secondhand_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setItems(data || [])
      setLoading(false)
    }
    fetchItems()
  }, [router])

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此商品？')) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { error } = await supabase
      .from('secondhand_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      alert(`删除失败：${error.message}`)
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">我的商品</h1>
        <p className="text-sm text-gray-500 mt-1">管理您发布的二手出售与求购信息</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">🛍️</div>
          <p className="text-gray-700 font-medium">暂无发布的二手信息</p>
          <Link
            href="/secondhand/publish"
            className="inline-flex mt-4 bg-[#1976d2] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1565c0] transition"
          >
            去发布二手
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate max-w-[260px] sm:max-w-[420px]">
                      {item.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeClass(item.type)}`}>
                      {typeLabel(item.type)}
                    </span>
                    {item.category ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100">
                        {item.category}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>💰 {displayPrice(item)}</span>
                    <span>🕒 {formatDate(item.created_at)}</span>
                    {'location' in (item as any) && (item as any).location ? (
                      <span>📍 {(item as any).location}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/secondhand/publish?edit=${item.id}`}
                    className="px-3 py-1.5 rounded-lg text-sm bg-zinc-50 hover:bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 transition"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-red-50 hover:bg-red-100 text-red-600 ring-1 ring-red-200 transition"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
