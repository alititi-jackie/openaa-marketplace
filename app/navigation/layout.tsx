import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '美国华人生活导航 - OpenAA',
  description:
    'OpenAA 美国华人生活导航，整理政务办事、招聘求职、房屋生活、银行购物、AI工具、新闻资讯等常用网站入口。',
}

export default function NavigationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
