import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site'

const SERVICES_CANONICAL = getSiteUrl('/services')

export const metadata: Metadata = {
  title: 'OpenAA 本地服务｜美国华人服务｜纽约华人本地服务',
  description:
    'OpenAA 本地服务频道为美国华人提供搬家、装修、清洁、维修、汽车服务、会计报税、法律咨询、保险、电脑手机维修等本地服务信息，帮助华人更方便查找和发布服务信息。',
  keywords: [
    'OpenAA 本地服务',
    '美国华人服务',
    '纽约华人服务',
    '华人本地服务',
    '搬家服务',
    '装修服务',
    '清洁服务',
    '维修服务',
    '汽车服务',
    '会计报税',
    '法律咨询',
    '保险服务',
    '电脑维修',
    '手机维修',
    '纽约本地服务',
    '美华人服务',
  ],
  alternates: {
    canonical: SERVICES_CANONICAL,
  },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
