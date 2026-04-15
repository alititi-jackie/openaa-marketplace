import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, formatDate } from '@/lib/utils'
import type { SecondhandItem } from '@/types'

interface Props {
  item: SecondhandItem
}

export default function SecondhandCard({ item }: Props) {
  return (
    <Link href={`/secondhand/${item.id}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer">
        <div className="relative h-48 bg-gray-100">
          {item.images && item.images.length > 0 ? (
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">🛍️</div>
          )}
        </div>
        <div className="p-3">
          <p className="font-semibold text-lg text-[#1976d2]">{formatPrice(item.price)}</p>
          <h3 className="text-gray-900 font-medium line-clamp-2 mt-1">{item.title}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {item.category}
            </span>
            <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
