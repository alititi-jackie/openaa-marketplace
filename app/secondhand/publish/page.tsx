'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ItemForm from '@/components/ItemForm'
import type { SecondhandItem, SecondhandItemType } from '@/types'

function normalizeType(t: string | null): SecondhandItemType {
  return t === 'buying' ? 'buying' : 'selling'
}

function PublishItemPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const editId = useMemo(() => {
    const v = searchParams.get('edit')
    return v && /^\d+$/.test(v) ? v : ''
  }, [searchParams])

  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState<SecondhandItem | null>(null)

  const initialType = useMemo(() => {
    if (editItem?.type) return editItem.type
    return normalizeType(searchParams.get('type'))
  }, [searchParams, editItem?.type])

  const pageTitle = editId ? '编辑信息' : initialType === 'buying' ? '发布求购信息' : '发布二手商品'

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setChecking(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      if (!editId) {
        if (!cancelled) setChecking(false)
        return
      }

      const { data, error } = await supabase.from('secondhand_items').select('*').eq('id', editId).single()

      if (cancelled) return

      if (error || !data) {
        setError('加载失败：信息不存在或无权限访问')
        setChecking(false)
        return
      }

      if (data.user_id !== user.id) {
        setError('无权限：只能编辑自己发布的信息')
        setChecking(false)
        return
      }

      setEditItem(data as SecondhandItem)
      setChecking(false)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [router, editId])

  if (checking) return <div className="flex justify-center py-20 text-gray-500">验证中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{pageTitle}</h1>

      {error ? (
        <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>
      ) : (
        <ItemForm initialType={initialType} editItem={editItem} />
      )}
    </div>
  )
}

export default function PublishItemPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-gray-500">加载中...</div>}>
      <PublishItemPageInner />
    </Suspense>
  )
}
