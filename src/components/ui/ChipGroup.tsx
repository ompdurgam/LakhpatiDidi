import { createContext, type ReactNode, useContext } from "react"

import { useDraftState } from "@/components/ui/draft"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

/** The label of the enclosing ChipField: an uncontrolled ChipGroup saves its answer under it. */
const ChipLabelContext = createContext("")

export function ChipField({ label, children }: { label: string; children: ReactNode }) {
  const tr = useTr()
  return (
    <div className="chip-field">
      <span>{tr(label)}</span>
      <ChipLabelContext.Provider value={label}>{children}</ChipLabelContext.Provider>
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
  // Without onToggle the group keeps its own answer, saved in the survey draft
  // under its field's label (so it is submitted and survives leaving the section).
  // A single choice is saved as its text ("ST"), several as a JSON list.
  const field = useContext(ChipLabelContext)
  const [saved, setSaved] = useDraftState<string>(
    field || "chips",
    single ? (selected[0] ?? "") : JSON.stringify(selected),
  )
  const localSelected: string[] = single ? (saved ? [saved] : []) : parseList(saved)
  const setLocalSelected = (next: string[]) =>
    setSaved(single ? (next[0] ?? "") : JSON.stringify(next))
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

function parseList(raw: string): string[] {
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}
