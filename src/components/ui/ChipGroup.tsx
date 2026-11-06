import { type ReactNode, useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function ChipField({ label, children }: { label: string; children: ReactNode }) {
  const tr = useTr()
  return (
    <div className="chip-field">
      <span>{tr(label)}</span>
      {children}
    </div>
  )
}

export function ChipGroup({
  options,
  selected,
  onToggle,
  single = false,
}: {
  options: string[]
  selected: string[]
  onToggle?: (item: string) => void
  single?: boolean
}) {
  const tr = useTr()
  const [localSelected, setLocalSelected] = useState(selected)
  const active = onToggle ? selected : localSelected
  const handleToggle = (option: string) => {
    if (onToggle) {
      onToggle(option)
      return
    }
    setLocalSelected(
      single
        ? [option]
        : active.includes(option)
          ? active.filter((item) => item !== option)
          : [...active, option],
    )
  }
  return (
    <div className="survey-chips">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          className={active.includes(option) ? "selected" : ""}
          onClick={() => handleToggle(option)}
          aria-pressed={active.includes(option)}
        >
          {tr(option)}
          {single && active.includes(option) && <Icon name="check" size={12} />}
        </button>
      ))}
    </div>
  )
}
