import { useContext } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { SurveyDraftContext, useDraftState } from "@/components/ui/draft"
import { FormGroup } from "@/components/ui/FormGroup"
import { Icon } from "@/components/ui/Icon"
import { SelectControl } from "@/components/ui/Select"
import { TextControl } from "@/components/ui/TextControl"
import { IncomeMismatch } from "@/features/survey/sections/livelihood/shared"
import type { WageRow } from "@/features/survey/types"
import { useTr } from "@/i18n/tr"

export function WageSection({ baseline }: { baseline: number }) {
  const tr = useTr()
  const [rows, setRows] = useDraftState<WageRow[]>("सदस्य, कार्य और कौशल", [
    { member: "", skill: "", months: 0 },
  ])
  const [income, setIncome] = useDraftState("वार्षिक मजदूरी आय ₹", 0)
  // Section D's job card number (saved under its scheme card), when entered there.
  const draft = useContext(SurveyDraftContext)
  const jobCard = Object.entries(draft ?? {}).find(
    ([key, value]) => key.endsWith("जॉब कार्ड नंबर") && value,
  )?.[1]
  const update = (index: number, patch: Partial<WageRow>) =>
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={income} baseline={baseline} />
      <FormGroup title={tr("सदस्य, कार्य और कौशल")}>
        <div className="simple-rows">
          {rows.map((row, index) => (
            <div className="simple-row" key={index}>
              <div className="control-grid">
                <label className="text-control">
                  <span>{tr("सदस्य")}</span>
                  <input
                    value={row.member}
                    onChange={(event) => update(index, { member: event.target.value })}
                  />
                </label>
                <label className="text-control">
                  <span>{tr("कार्य/कौशल")}</span>
                  <input
                    value={row.skill}
                    onChange={(event) => update(index, { skill: event.target.value })}
                  />
                </label>
                <label className="text-control">
                  <span>{tr("महीने")}</span>
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
          onClick={() => setRows([...rows, { member: "", skill: "", months: 0 }])}
        >
          <Icon name="plus" size={14} /> {tr("सदस्य जोड़ें")}
        </button>
      </FormGroup>
      <FormGroup title={tr("रोजगार विवरण")}>
        <ChipField label="रोजगार प्राथमिकता">
          <ChipGroup
            options={["गाँव", "ब्लॉक-जिला", "राज्य", "राज्य के बाहर", "स्वरोजगार"]}
            selected={[]}
          />
        </ChipField>
        <ChipField label="प्रकार">
          <ChipGroup options={["नियमित नौकरी", "मनरेगा", "प्रवासन"]} selected={[]} />
        </ChipField>
        <div className="mgnrega-linked">
          <span>
            {tr("मनरेगा जॉब कार्ड")} <b>{tr("खंड D से स्वतः")}</b>
          </span>
          <strong>{jobCard || "—"}</strong>
        </div>
        <div className="control-grid">
          <TextControl label="कार्य दिवस" value="" type="number" />
          <SelectControl
            label="मजदूरी स्थिति"
            value=""
            options={["", "समय पर", "विलंब", "बकाया"]}
          />
        </div>
        <label className="section-total">
          <span>{tr("वार्षिक मजदूरी आय ₹")}</span>
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
