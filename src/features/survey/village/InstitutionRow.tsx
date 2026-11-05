import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"

export function InstitutionRow({ name, index }: { name: string; index: number }) {
  const [exists, setExists] = useState(index < 10 ? "हाँ" : "नहीं")
  return (
    <div className="institution-row">
      <strong>{name}</strong>
      <ChipField label="मौजूद?">
        <ChipGroup options={["हाँ", "नहीं"]} selected={[exists]} onToggle={setExists} single />
      </ChipField>
      {exists === "हाँ" && (
        <>
          <label>
            <span>स्थिति</span>
            <select defaultValue={index % 4 === 0 ? "आंशिक" : "सक्रिय"}>
              <option>सक्रिय</option>
              <option>आंशिक</option>
              <option>केवल कागज़ पर</option>
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
