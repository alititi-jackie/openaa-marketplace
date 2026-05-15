import type { Metadata } from 'next'

const HOUSING_CANONICAL = 'https://app.openaa.com/housing'

export const metadata: Metadata = {
  title: 'OpenAA 房屋｜美国华人房屋出租｜纽约租房｜华人租房',
  description:
    'OpenAA 房屋频道为美国华人提供房屋租售和租房信息，涵盖纽约租房、法拉盛租房、布鲁克林租房、房间出租、公寓出租、整租、合租等信息，帮助华人更方便找房、出租和发布房屋信息。',
  keywords: [
    'OpenAA 房屋',
    '美国华人房屋',
    '纽约租房',
    '华人租房',
    '法拉盛租房',
    '布鲁克林租房',
    '房屋出租',
    '房间出租',
    '公寓出租',
    '整租',
    '合租',
    '美国租房',
    '纽约华人房屋',
    '美华人租房',
  ],
  alternates: {
    canonical: HOUSING_CANONICAL,
  },
}

export default function HousingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
