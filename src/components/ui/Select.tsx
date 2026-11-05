import { useContext } from "react"

import { SurveyDraftContext } from "@/components/ui/FormDraftContext"

export function SelectControl({
  label,
  value,
  options,
}: {
  label: string
  value: string
  options: string[]
}) {
  const draft = useContext(SurveyDraftContext)
  if (draft && draft[label] === undefined) draft[label] = value
  return (
    <label className="text-control">
      <span>{label}</span>
      <select
        defaultValue={draft?.[label] ?? value}
        onChange={(event) => {
          if (draft) draft[label] = event.target.value
        }}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

export function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <label className="register-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange?.(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
