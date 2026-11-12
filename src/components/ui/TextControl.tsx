import { useContext } from "react"

import { SurveyDraftContext, useDraftKey } from "@/components/ui/draft"
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
  const key = useDraftKey(label)
  if (draft && draft[key] === undefined) draft[key] = value
  return (
    <label className="text-control">
      <span>{tr(label)}</span>
      <input
        type={type}
        defaultValue={draft?.[key] ?? value}
        onChange={(event) => {
          if (draft) draft[key] = event.target.value
        }}
      />
    </label>
  )
}
