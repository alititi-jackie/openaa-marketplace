'use client'

import { useEffect, useId, useMemo, useRef } from 'react'

type FilterValue = string | number

export type FilterDropdownOption = {
  label: string
  value: FilterValue
}

interface FilterDropdownProps {
  value: FilterValue
  options: FilterDropdownOption[]
  onChange: (value: FilterValue) => void
  placeholder?: string
  className?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function FilterDropdown({
  value,
  options,
  onChange,
  placeholder = '请选择',
  className,
  isOpen = false,
  onOpenChange,
}: FilterDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const listboxId = useId()

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value)
    return selected?.label ?? placeholder
  }, [options, placeholder, value])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange?.(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onOpenChange])

  useEffect(() => {
    if (!isOpen) return
    const selectedIndex = options.findIndex((option) => option.value === value)
    const targetIndex = selectedIndex >= 0 ? selectedIndex : 0
    optionRefs.current[targetIndex]?.focus()
  }, [isOpen, options, value])

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onOpenChange?.(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onOpenChange?.(false)
            return
          }

          if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            onOpenChange?.(true)
          }
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className={`text-xs text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-30 w-full rounded-xl border border-zinc-100 bg-white py-1 shadow-[0_10px_24px_rgba(15,23,42,0.14)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                ref={(element) => {
                  optionRefs.current[index] = element
                }}
                onClick={() => {
                  onChange(option.value)
                  onOpenChange?.(false)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    onOpenChange?.(false)
                    return
                  }

                  if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    const nextIndex = (index + 1) % options.length
                    optionRefs.current[nextIndex]?.focus()
                    return
                  }

                  if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    const prevIndex = (index - 1 + options.length) % options.length
                    optionRefs.current[prevIndex]?.focus()
                    return
                  }

                  if (event.key === 'Home') {
                    event.preventDefault()
                    optionRefs.current[0]?.focus()
                    return
                  }

                  if (event.key === 'End') {
                    event.preventDefault()
                    optionRefs.current[options.length - 1]?.focus()
                  }
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  isSelected ? 'bg-blue-50 text-blue-700' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span className={`w-4 text-center ${isSelected ? 'opacity-100' : 'opacity-0'}`}>✓</span>
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
