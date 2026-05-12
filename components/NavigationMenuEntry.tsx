'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navigation } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function NavigationMenuEntry() {
  const [href, setHref] = useState('/navigation')

  useEffect(() => {
    let active = true

    const loadHref = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) return

      if (!session?.access_token) {
        setHref('/navigation')
        return
      }

      try {
        const res = await fetch('/api/user/navigation-settings', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (!res.ok) {
          setHref('/navigation')
          return
        }

        const json: unknown = await res.json()
        const navigationDefault =
          json &&
          typeof json === 'object' &&
          'data' in json &&
          json.data &&
          typeof json.data === 'object' &&
          'navigation_default' in json.data
            ? (json.data.navigation_default as string)
            : 'public'

        setHref(navigationDefault === 'my' ? '/navigation/my' : '/navigation')
      } catch {
        setHref('/navigation')
      }
    }

    void loadHref()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadHref()
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 active:scale-90 transition-transform duration-150"
    >
      <div className="w-[54px] h-[54px] rounded-[18px] bg-cyan-50 ring-1 ring-cyan-100 flex items-center justify-center shadow-sm">
        <Navigation size={25} className="text-cyan-500" strokeWidth={1.7} />
      </div>
      <span className="text-[14px] font-medium text-zinc-800 text-center leading-tight">
        导航
      </span>
    </Link>
  )
}
