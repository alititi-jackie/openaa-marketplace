import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const JOBS_CANONICAL = getSiteUrl('/jobs')

export const metadata: Metadata = {
  title: 'OpenAA 招聘｜美国华人招聘｜纽约招聘｜找工作｜168招聘',
  description:
    'OpenAA 招聘频道为美国华人提供招聘求职信息，涵盖纽约招聘、餐馆招聘、兼职、全职、司机、仓库、电工、装修、前台、文员等岗位，帮助华人更方便找工作和发布招聘信息。',
  keywords: [
    'OpenAA 招聘',
    '美国华人招聘',
    '纽约招聘',
    '找工作',
    '168招聘',
    '华人招聘',
    '美国找工作',
    '纽约找工作',
    '兼职招聘',
    '全职招聘',
    '法拉盛招聘',
    '布鲁克林招聘',
    '司机招聘',
    '餐馆招聘',
    '华人工作',
    '美国工作',
    '美华人招聘',
  ],
  alternates: {
    canonical: JOBS_CANONICAL,
  },
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
