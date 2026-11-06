import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { useTr } from "@/i18n/tr"

export function InstitutionRow({ name, index }: { name: string; index: number }) {
  const tr = useTr()
  const [exists, setExists] = useState(index < 10 ? "हाँ" : "नहीं")
  return (
    <div className="institution-row">
      <strong>{tr(name)}</strong>
      <ChipField label="मौजूद?">
        <ChipGroup options={["हाँ", "नहीं"]} selected={[exists]} onToggle={setExists} single />
      </ChipField>
      {exists === "हाँ" && (
        <>
          <label>
            <span>{tr("स्थिति")}</span>
            <select defaultValue={index % 4 === 0 ? "आंशिक" : "सक्रिय"}>
              <option value="सक्रिय">{tr("सक्रिय")}</option>
              <option value="आंशिक">{tr("आंशिक")}</option>
              <option value="केवल कागज़ पर">{tr("केवल कागज़ पर")}</option>
            </select>
          </label>
          <ChipField label="परिवार सदस्य?">
            <ChipGroup options={["हाँ", "नहीं"]} selected={[index < 3 ? "हाँ" : "नहीं"]} single />
          </ChipField>
        </>
      )}
    </div>
  )
}
