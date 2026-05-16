import type { Metadata } from 'next'
import { toAbsoluteUrl } from '@/lib/site'

const NAVIGATION_CANONICAL = toAbsoluteUrl('/navigation')

export const metadata: Metadata = {
  title: 'OpenAA 导航｜美国华人导航｜华人常用网站｜实用网址导航',
  description:
    'OpenAA 导航为美国华人提供常用网站和实用网址入口，涵盖政府服务、银行金融、购物平台、新闻资讯、社交媒体、视频平台、AI 工具、DMV 和本地生活服务，帮助华人更方便访问美国常用网站。',
  keywords: [
    'OpenAA 导航',
    '美国华人导航',
    '华人导航',
    '华人常用网站',
    '美国常用网站',
    '实用网址导航',
    '政府服务',
    '银行金融',
    '购物平台',
    '新闻资讯',
    '社交媒体',
    '视频平台',
    'AI 工具',
    'DMV 导航',
    '美国生活导航',
    '美华人导航',
  ],
  alternates: {
    canonical: NAVIGATION_CANONICAL,
  },
}

export default function NavigationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
