import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { FormGroup } from "@/components/ui/FormGroup"
import { IncomeMismatch, NeedsBlock } from "@/features/survey/sections/livelihood/shared"
import { useTr } from "@/i18n/tr"

export function TourismSection({ baseline }: { baseline: number }) {
  const tr = useTr()
  const [engaged, setEngaged] = useState("हाँ")
  const [income, setIncome] = useState(8000)
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={engaged === "हाँ" ? income : 0} baseline={baseline} />
      <FormGroup title={tr("पर्यटन गतिविधि")}>
        <ChipField label="आस-पास स्थल">
          <ChipGroup options={["जल", "वन", "ऐतिहासिक", "धार्मिक"]} selected={["वन", "ऐतिहासिक"]} />
        </ChipField>
        <ChipField label="सदस्य संलग्न?">
          <ChipGroup options={["हाँ", "नहीं"]} selected={[engaged]} onToggle={setEngaged} single />
        </ChipField>
        {engaged === "हाँ" && (
          <>
            <ChipField label="गतिविधि">
              <ChipGroup
                options={["टूर गाइड", "जल क्रीड़ा", "पेटी शॉप", "होम स्टे"]}
                selected={["टूर गाइड"]}
              />
            </ChipField>
            <label className="section-total">
              <span>{tr("वार्षिक पर्यटन आय ₹")}</span>
              <input
                type="number"
                value={income}
                onChange={(event) => setIncome(Number(event.target.value))}
              />
            </label>
          </>
        )}
      </FormGroup>
      {engaged === "हाँ" && (
        <NeedsBlock
          received={["होमस्टे/इको-गाइड प्रशिक्षण", "ऑनलाइन लिस्टिंग", "टूर ऑपरेटर जुड़ाव"]}
          movable={["साइनेज", "होमस्टे सामग्री", "सुरक्षा उपकरण"]}
          fixed={["होमस्टे विकास", "अंतिम छोर सड़क"]}
        />
      )}
    </div>
  )
}
