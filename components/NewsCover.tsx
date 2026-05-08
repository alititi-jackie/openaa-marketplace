'use client'

import { useState } from 'react'

interface Props {
  src?: string | null
  alt: string
  className?: string
}

function Fallback({ className }: { className?: string }) {
  const classes = `${className ?? ''} bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center`.trim()
  return (
    <div className={classes}>
      <span className="text-sm font-semibold text-blue-700">OpenAA 资讯</span>
    </div>
  )
}

export default function NewsCover({ src, alt, className }: Props) {
  const [broken, setBroken] = useState(false)
  const imageSrc = typeof src === 'string' ? src.trim() : ''
  const imageClasses = `${className ?? ''} object-cover bg-zinc-100`.trim()

  if (!imageSrc || broken) return <Fallback className={className} />

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      onError={() => setBroken(true)}
      className={imageClasses}
    />
  )
}
