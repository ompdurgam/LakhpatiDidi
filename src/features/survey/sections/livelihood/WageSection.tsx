import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { FormGroup } from "@/components/ui/FormGroup"
import { Icon } from "@/components/ui/Icon"
import { TextControl } from "@/components/ui/TextControl"
import { IncomeMismatch } from "@/features/survey/sections/livelihood/shared"
import type { WageRow } from "@/features/survey/types"

export function WageSection({ baseline }: { baseline: number }) {
  const [rows, setRows] = useState<WageRow[]>([
    { member: "राम कश्यप", skill: "राजमिस्त्री", months: 6 },
    { member: "सुनीता कश्यप", skill: "मनरेगा श्रमिक", months: 4 },
  ])
  const [income, setIncome] = useState(28000)
  const update = (index: number, patch: Partial<WageRow>) =>
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={income} baseline={baseline} />
      <FormGroup title="सदस्य, कार्य और कौशल">
        <div className="simple-rows">
          {rows.map((row, index) => (
            <div className="simple-row" key={index}>
              <div className="control-grid">
                <label className="text-control">
                  <span>सदस्य</span>
                  <input
                    value={row.member}
                    onChange={(event) => update(index, { member: event.target.value })}
                  />
                </label>
                <label className="text-control">
                  <span>कार्य/कौशल</span>
                  <input
                    value={row.skill}
                    onChange={(event) => update(index, { skill: event.target.value })}
                  />
                </label>
                <label className="text-control">
                  <span>महीने</span>
                  <input
                    type="number"
                    value={row.months}
                    onChange={(event) => update(index, { months: Number(event.target.value) })}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          className="add-row-button"
          onClick={() => setRows([...rows, { member: "नया सदस्य", skill: "", months: 0 }])}
        >
          <Icon name="plus" size={14} /> सदस्य जोड़ें
        </button>
      </FormGroup>
      <FormGroup title="रोजगार विवरण">
        <ChipField label="रोजगार प्राथमिकता">
          <ChipGroup
            options={["गाँव", "ब्लॉक-जिला", "राज्य", "राज्य के बाहर", "स्वरोजगार"]}
            selected={["गाँव", "ब्लॉक-जिला"]}
          />
        </ChipField>
        <ChipField label="प्रकार">
          <ChipGroup options={["नियमित नौकरी", "मनरेगा", "प्रवासन"]} selected={["मनरेगा"]} />
        </ChipField>
        <div className="mgnrega-linked">
          <span>
            मनरेगा जॉब कार्ड <b>खंड D से स्वतः</b>
          </span>
          <strong>CG-04-006-021-00123</strong>
        </div>
        <div className="control-grid">
          <TextControl label="कार्य दिवस" value="68" type="number" />
          <label className="text-control">
            <span>मजदूरी स्थिति</span>
            <select defaultValue="समय पर">
              <option>समय पर</option>
              <option>विलंब</option>
              <option>बकाया</option>
            </select>
          </label>
        </div>
        <label className="section-total">
          <span>वार्षिक मजदूरी आय ₹</span>
          <input
            type="number"
            value={income}
            onChange={(event) => setIncome(Number(event.target.value))}
          />
        </label>
      </FormGroup>
    </div>
  )
}
