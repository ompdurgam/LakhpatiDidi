import { useContext } from "react"

import { SurveyDraftContext } from "@/components/ui/FormDraftContext"
import { useTr } from "@/i18n/tr"

export function TextControl({
  label,
  value,
  type = "text",
}: {
  label: string
  value: string
  type?: string
}) {
  const tr = useTr()
  const draft = useContext(SurveyDraftContext)
  if (draft && draft[label] === undefined) draft[label] = value
  return (
    <label className="text-control">
      <span>{tr(label)}</span>
      <input
        type={type}
        defaultValue={draft?.[label] ?? value}
        onChange={(event) => {
          if (draft) draft[label] = event.target.value
        }}
      />
    </label>
  )
}
