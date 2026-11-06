import { useContext } from "react"

import { SurveyDraftContext } from "@/components/ui/FormDraftContext"
import { useTr } from "@/i18n/tr"

export function SelectControl({
  label,
  value,
  options,
}: {
  label: string
  value: string
  options: string[]
}) {
  const tr = useTr()
  const draft = useContext(SurveyDraftContext)
  if (draft && draft[label] === undefined) draft[label] = value
  return (
    <label className="text-control">
      <span>{tr(label)}</span>
      <select
        defaultValue={draft?.[label] ?? value}
        onChange={(event) => {
          if (draft) draft[label] = event.target.value
        }}
      >
        {options.map((option, index) => (
          <option key={`${index}-${option}`} value={option}>
            {tr(option)}
          </option>
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
  const tr = useTr()
  return (
    <label className="register-filter">
      <span>{tr(label)}</span>
      <select value={value} onChange={(event) => onChange?.(event.target.value)}>
        {options.map((option, index) => (
          <option key={`${index}-${option}`} value={option}>
            {tr(option)}
          </option>
        ))}
      </select>
    </label>
  )
}
