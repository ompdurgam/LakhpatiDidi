import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { useTr } from "@/i18n/tr"

import type { Answer } from "./catalog"

/** One village institution: exists, its status, and whether the household is a member. */
export function InstitutionRow({
  name,
  answer,
  onChange,
}: {
  name: string
  answer: Answer
  onChange: (answer: Answer) => void
}) {
  const tr = useTr()
  const exists = answer.exists as string | undefined
  return (
    <div className="institution-row">
      <strong>{tr(name)}</strong>
      <ChipField label="मौजूद?">
        <ChipGroup
          options={["हाँ", "नहीं"]}
          selected={exists ? [exists] : []}
          onToggle={(value) =>
            onChange(value === "हाँ" ? { exists: value, status: "सक्रिय" } : { exists: value })
          }
          single
        />
      </ChipField>
      {exists === "हाँ" && (
        <label>
          <span>{tr("स्थिति")}</span>
          <select
            value={(answer.status as string | undefined) ?? "सक्रिय"}
            onChange={(e) => onChange({ ...answer, status: e.target.value })}
          >
            <option value="सक्रिय">{tr("सक्रिय")}</option>
            <option value="आंशिक">{tr("आंशिक")}</option>
            <option value="केवल कागज़ पर">{tr("केवल कागज़ पर")}</option>
          </select>
        </label>
      )}
    </div>
  )
}
