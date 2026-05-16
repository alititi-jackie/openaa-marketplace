import type { Metadata } from 'next'
import { toAbsoluteUrl } from '@/lib/site'

const SECONDHAND_CANONICAL = toAbsoluteUrl('/secondhand')

export const metadata: Metadata = {
  title: 'OpenAA 二手｜美国华人二手市场｜纽约二手｜闲置转让',
  description:
    'OpenAA 二手频道为美国华人提供二手闲置和转让信息，涵盖纽约二手、家具、电器、手机、汽车用品、生活用品、搬家甩卖等内容，帮助华人更方便发布和查找二手市场信息。',
  keywords: [
    'OpenAA 二手',
    '美国华人二手',
    '纽约二手',
    '华人二手市场',
    '二手市场',
    '闲置转让',
    '搬家甩卖',
    '二手家具',
    '二手电器',
    '二手手机',
    '美国二手',
    '纽约华人二手',
    '美华人二手',
  ],
  alternates: {
    canonical: SECONDHAND_CANONICAL,
  },
}

export default function SecondhandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
