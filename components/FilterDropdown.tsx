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

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onOpenChange?.(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 shadow-sm transition hover:bg-white"
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
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  onOpenChange?.(false)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
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
