interface ChannelSeoSectionProps {
  title: string
  paragraphs: string[]
  highlights?: string[]
  className?: string
}

export default function ChannelSeoSection({
  title,
  paragraphs,
  highlights = [],
  className = 'mt-8',
}: ChannelSeoSectionProps) {
  return (
    <section className={className}>
      <div className="rounded-2xl bg-white p-4 text-[13px] leading-relaxed text-zinc-600 ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)]">
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
        <div className="mt-2 space-y-3">
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
        {highlights.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-zinc-700">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
