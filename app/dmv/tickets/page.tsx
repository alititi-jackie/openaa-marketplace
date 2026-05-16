import type { Metadata } from 'next'
import AppTopSection from '@/components/AppTopSection'
import BackToTopButton from '@/components/BackToTopButton'
import TicketsClient from './TicketsClient'
import { toAbsoluteUrl } from '@/lib/site'

const CANONICAL = toAbsoluteUrl('/dmv/tickets')

export const metadata: Metadata = {
  title: 'OpenAA 罚单查询｜美国停车罚单｜纽约罚单查询｜闯红灯超速拍照',
  description:
    'OpenAA 罚单查询入口为美国华人提供停车罚单、闯红灯拍照罚单、超速拍照罚单、交通罚单和过路费查询的官方入口导航，帮助用户快速找到纽约、加州、新泽西等州和城市的官方查询网站。',
  keywords: [
    '美国罚单查询',
    '纽约罚单查询',
    '停车罚单',
    '闯红灯罚单',
    '超速拍照罚单',
    'Parking Ticket',
    'Red Light Camera Ticket',
    'Speed Camera Ticket',
    'Traffic Ticket',
    'E-ZPass',
    'Toll',
    '华人罚单查询',
    '美国华人 DMV',
    'OpenAA DMV',
  ],
  alternates: {
    canonical: CANONICAL,
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '美国停车罚单怎么查询？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '美国停车罚单通常由发出罚单的城市或县财政局、停车管理部门管理。您需要前往该城市官方网站，输入罚单号或车牌号进行查询。纽约市可通过 NYC Finance CityPay 系统查询。OpenAA 不直接查询罚单，仅提供官方入口导航。',
      },
    },
    {
      '@type': 'Question',
      name: '闯红灯拍照罚单在哪里查？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '闯红灯拍照罚单（Red Light Camera Ticket）一般由城市交通部门或 DMV 系统管理。纽约市可通过 NYC Finance CityPay 查询。其他城市请前往该城市官方停车/交通违规查询网站。OpenAA 仅提供入口导航，不直接查询罚单。',
      },
    },
    {
      '@type': 'Question',
      name: '超速拍照罚单怎么处理？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '超速拍照罚单（Speed Camera Ticket）通常为 civil penalty，需在规定期限内缴费或申诉。纽约市可通过 NYC Finance CityPay 处理。逾期可能产生额外费用。请尽快登录收到罚单上注明的官方网站处理。',
      },
    },
    {
      '@type': 'Question',
      name: '罚单逾期有什么影响？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '罚单逾期通常会产生额外滞纳金，严重时可能导致 DMV 暂停车辆注册或驾照、车辆被贴 boot 或拖走、信用记录受影响。请尽快登录官方网站处理逾期罚单。具体规定以各州或城市官方页面为准。',
      },
    },
    {
      '@type': 'Question',
      name: 'OpenAA 会保存我的车牌号吗？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '不会。您在 OpenAA 罚单查询页面输入的车牌号仅在本页面本地显示，用于帮助您确认信息。OpenAA 不保存、不上传、也不将车牌号传递给任何第三方或官方网站。',
      },
    },
    {
      '@type': 'Question',
      name: '如果找不到罚单怎么办？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '如果在官方系统中找不到罚单，可能是罚单尚未录入系统（通常需要 3-5 个工作日）、罚单号或车牌号输入有误、或罚单由不同机构管辖。建议直接联系发出罚单的机构或查看罚单上的联系信息。',
      },
    },
    {
      '@type': 'Question',
      name: '可以在 OpenAA 直接缴罚单吗？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '不可以。OpenAA 不提供罚单缴费服务，也不处理任何付款。OpenAA 仅整理官方查询入口和中文说明。所有罚单的查询、申诉和缴费请在对应官方政府、法院或机构网站上完成。',
      },
    },
  ],
}

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'OpenAA 罚单查询｜美国停车罚单｜纽约罚单查询',
  description:
    'OpenAA 罚单查询入口为美国华人提供停车罚单、闯红灯拍照罚单、超速拍照罚单、交通罚单和过路费查询的官方入口导航。',
  url: CANONICAL,
  inLanguage: 'zh-CN',
  isPartOf: {
    '@type': 'WebSite',
    name: 'OpenAA',
    url: toAbsoluteUrl('/'),
  },
}

export default function DMVTicketsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <AppTopSection bannerPosition="dmv" />
      <TicketsClient />
      <BackToTopButton />
    </div>
  )
}
