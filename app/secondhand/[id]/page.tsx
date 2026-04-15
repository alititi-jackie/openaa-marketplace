'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import type { SecondhandItem } from '@/types'

export default function SecondhandDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [item, setItem] = useState<SecondhandItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItem = async () => {
      const { data } = await supabase
        .from('secondhand_items')
        .select('*, user:users(username, avatar_url)')
        .eq('id', id)
        .single()

      if (data) {
        setItem(data)
        await supabase
          .from('secondhand_items')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id)
      }
      setLoading(false)
    }
    fetchItem()
  }, [id])

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>
  if (!item) return <div className="flex justify-center py-20 text-gray-500">商品不存在</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-[#1976d2] mb-4 flex items-center gap-1">
        ← 返回
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {item.images && item.images.length > 0 ? (
          <div className="relative h-64 md:h-96">
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-64 bg-gray-100 flex items-center justify-center text-6xl">🛍️</div>
        )}

        <div className="p-6">
          <p className="text-2xl font-bold text-[#1976d2]">{formatPrice(item.price)}</p>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">{item.title}</h1>

          <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
            <span>👁 {item.views || 0} 次浏览</span>
            <span>{formatDate(item.created_at)}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-2">商品描述</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1976d2] flex items-center justify-center text-white font-bold">
              {item.user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {item.user?.username ?? '匿名用户'}
              </p>
              <p className="text-xs text-gray-500">发布者</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
