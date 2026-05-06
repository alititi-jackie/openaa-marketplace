import { Metadata } from 'next'
import ServicesListClient from './ServicesListClient'

export const metadata: Metadata = {
  title: '纽约华人本地服务 - 装修搬家保洁维修律师会计 | OpenAA',
  description:
    'OpenAA 本地服务提供纽约华人常用服务信息，包括装修维修、搬家运输、家政清洁、汽车驾校、律师会计、电脑手机维修、餐饮商业服务等。',
}

export default function ServicesPage() {
  return <ServicesListClient />
}
