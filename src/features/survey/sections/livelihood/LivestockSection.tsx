import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { FormGroup } from "@/components/ui/FormGroup"
import { NumberControl } from "@/components/ui/NumberStepper"
import { IncomeMismatch, NeedsBlock } from "@/features/survey/sections/livelihood/shared"
import { useTr } from "@/i18n/tr"

export function LivestockSection({ baseline }: { baseline: number }) {
  const tr = useTr()
  const animals = [
    ["cattle", "🐄", "गाय/भैंस"],
    ["goat", "🐐", "बकरी/भेड़"],
    ["poultry", "🐓", "मुर्गी"],
    ["duck", "🦆", "बत्तख"],
    ["pig", "🐖", "सूअर/अन्य"],
  ]
  const [counts, setCounts] = useState<Record<string, number>>({
    cattle: 0,
    goat: 0,
    poultry: 0,
    duck: 0,
    pig: 0,
  })
  const [incomes, setIncomes] = useState<Record<string, number>>({
    cattle: 0,
    goat: 0,
    poultry: 0,
    duck: 0,
    pig: 0,
  })
  const total = Object.values(incomes).reduce((sum, value) => sum + value, 0)
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={total} baseline={baseline} />
      <FormGroup title={tr("पशु संख्या, नस्ल और आय")}>
        <div className="animal-grid">
          {animals.map(([key, icon, label]) => (
            <div className="animal-card" key={key}>
              <div className="animal-title">
                <b>{icon}</b>
                <span>{tr(label)}</span>
              </div>
              <NumberControl
                label="संख्या"
                value={counts[key]}
                onChange={(value) => setCounts({ ...counts, [key]: value })}
              />
              {counts[key] > 0 && (
                <>
                  <ChipField label="नस्ल">
                    <ChipGroup options={["स्थानीय", "संकर"]} selected={["स्थानीय"]} single />
                  </ChipField>
                  <label className="animal-income">
                    <span>{tr("वार्षिक आय ₹")}</span>
                    <input
                      type="number"
                      value={incomes[key]}
                      onChange={(event) =>
                        setIncomes({
                          ...incomes,
                          [key]: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="auto-total">
          <span>{tr("पशुधन कुल आय")}</span>
          <strong>₹{total.toLocaleString("en-IN")}</strong>
        </div>
      </FormGroup>
      <FormGroup title={tr("पालन प्रबंधन")}>
        <ChipField label="पोल्ट्री प्रकार">
          <ChipGroup options={["ब्रॉयलर", "लेयर", "बैकयार्ड"]} selected={["बैकयार्ड"]} />
        </ChipField>
        <ChipField label="चारा स्रोत">
          <ChipGroup options={["घर पर", "चराई", "बाजार"]} selected={["घर पर", "चराई"]} />
        </ChipField>
        <ChipField label="पशु सखी सहायता">
          <ChipGroup
            options={["टीकाकरण-कृमिनाशन", "प्रशिक्षण", "मार्गदर्शन"]}
            selected={["टीकाकरण-कृमिनाशन"]}
          />
        </ChipField>
      </FormGroup>
      <NeedsBlock
        received={["टीकाकरण-कृमिनाशन", "कृत्रिम गर्भाधान", "पशुधन बीमा", "पशु सखी मार्गदर्शन"]}
        movable={["साइलेज उपकरण", "दूध कैन", "ब्रूडर", "चारा भंडारण"]}
        fixed={["पशु शेड", "पोल्ट्री कूप"]}
      />
    </div>
  )
}
