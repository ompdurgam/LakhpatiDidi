import { useContext } from "react"

import { SurveyDraftContext } from "@/components/ui/FormDraftContext"

export function TextControl({
  label,
  value,
  type = "text",
}: {
  label: string
  value: string
  type?: string
}) {
  const draft = useContext(SurveyDraftContext)
  if (draft && draft[label] === undefined) draft[label] = value
  return (
    <label className="text-control">
      <span>{label}</span>
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
