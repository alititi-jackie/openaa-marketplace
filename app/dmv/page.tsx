import questionsData from '@/data/openaa-ny-dmv-questions-v1.json'
import { fetchPublishedNewsPosts } from '@/lib/newsPosts'
import DmvPageClient from './DmvPageClient'
import { getPublicSupabaseServerClient } from '@/lib/serverSupabase'

export const dynamic = 'force-dynamic'

const DMV_QUESTION_COUNT = 150

type QuestionBank = {
  _meta?: {
    totalQuestions?: number
  }
  questions?: unknown[]
}

type DmvGuidePost = {
  id: string
  slug: string
  title: string
}

function getQuestionCount() {
  const questionBank = questionsData as QuestionBank
  if (typeof questionBank._meta?.totalQuestions === 'number' && questionBank._meta.totalQuestions > 0) {
    return questionBank._meta.totalQuestions
  }
  if (Array.isArray(questionBank.questions) && questionBank.questions.length > 0) {
    return questionBank.questions.length
  }
  return DMV_QUESTION_COUNT
}

async function getDmvGuides() {
  const supabase = getPublicSupabaseServerClient()
  if (!supabase) return [] as DmvGuidePost[]

  const posts = await fetchPublishedNewsPosts(supabase, {
    category: 'DMV教程',
    limit: 5,
  })

  return posts
    .filter((post) => !!post.slug)
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
    }))
}

export default async function DMVPage() {
  const [questionCount, dmvGuides] = await Promise.all([Promise.resolve(getQuestionCount()), getDmvGuides()])

  return <DmvPageClient questionCount={questionCount} dmvGuides={dmvGuides} />
}
