import NavigationPageClient from './NavigationPageClient'
import { getServiceSupabaseServerClient } from '@/lib/serverSupabase'

export const dynamic = 'force-dynamic'

type OpenMode = 'auto' | 'same' | 'new'

interface NavCategory {
  id: string
  name: string
  slug: string
  sort_order: number
  display_limit: number
}

interface NavLink {
  id: string
  category_id: string
  title: string
  url: string
  description: string | null
  open_mode: OpenMode
  sort_order: number
}

async function getNavigationPageData() {
  const supabase = getServiceSupabaseServerClient()
  if (!supabase) {
    return {
      categories: [] as NavCategory[],
      links: [] as NavLink[],
      fetchError: '数据加载失败，请稍后重试',
    }
  }

  const [{ data: categories, error: catError }, { data: links, error: linkError }] = await Promise.all([
    supabase
      .from('navigation_categories')
      .select('id, name, slug, sort_order, display_limit')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('navigation_links')
      .select('id, category_id, title, url, description, open_mode, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  if (catError || linkError) {
    console.error('Failed to load navigation page data:', catError, linkError)
    return {
      categories: [] as NavCategory[],
      links: [] as NavLink[],
      fetchError: '数据加载失败，请稍后重试',
    }
  }

  return {
    categories: (categories as NavCategory[] | null) ?? [],
    links: (links as NavLink[] | null) ?? [],
    fetchError: null,
  }
}

export default async function NavigationPage() {
  const { categories, links, fetchError } = await getNavigationPageData()

  return (
    <NavigationPageClient initialCategories={categories} initialLinks={links} fetchError={fetchError} />
  )
}
