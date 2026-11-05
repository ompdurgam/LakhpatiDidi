import { type ReactNode, useState } from "react"

import { Icon } from "@/components/ui/Icon"

export function ChipField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="chip-field">
      <span>{label}</span>
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
          {option}
          {single && active.includes(option) && <Icon name="check" size={12} />}
        </button>
      ))}
    </div>
  )
}
