import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { FormGroup } from "@/components/ui/FormGroup"
import { Icon } from "@/components/ui/Icon"
import { IncomeMismatch, NeedsBlock } from "@/features/survey/sections/livelihood/shared"
import type { NtfpRow } from "@/features/survey/types"

export function ForestProduceSection({ baseline }: { baseline: number }) {
  const [rows, setRows] = useState<NtfpRow[]>([
    { produce: "महुआ", months: "मार्च–मई", days: 45, gap: "भंडारण" },
  ])
  const [income, setIncome] = useState(18500)
  const update = (index: number, patch: Partial<NtfpRow>) =>
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={income} baseline={baseline} />
      <FormGroup title="संग्रह विवरण">
        <div className="simple-rows">
          {rows.map((row, index) => (
            <div className="simple-row" key={index}>
              <div className="control-grid">
                <label className="text-control">
                  <span>उपज</span>
                  <input
                    value={row.produce}
                    onChange={(event) => update(index, { produce: event.target.value })}
                  />
                </label>
                <label className="text-control">
                  <span>महीने</span>
                  <input
                    value={row.months}
                    onChange={(event) => update(index, { months: event.target.value })}
                  />
                </label>
                <label className="text-control">
                  <span>संग्रह दिन (0–365)</span>
                  <input
                    type="number"
                    value={row.days}
                    onChange={(event) => update(index, { days: Number(event.target.value) })}
                  />
                </label>
                <label className="text-control">
                  <span>मुख्य कमी</span>
                  <input
                    value={row.gap}
                    onChange={(event) => update(index, { gap: event.target.value })}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          className="add-row-button"
          onClick={() => setRows([...rows, { produce: "नई उपज", months: "", days: 0, gap: "" }])}
        >
          <Icon name="plus" size={14} /> उपज जोड़ें
        </button>
        <ChipField label="अधिकार और क्षमता">
          <ChipGroup
            options={["कानूनी पहुँच", "FRA-CFR", "संसाधन कमी", "सतत संग्रहण प्रशिक्षण"]}
            selected={["FRA-CFR", "सतत संग्रहण प्रशिक्षण"]}
          />
        </ChipField>
      </FormGroup>
      <FormGroup title="उपज-वार आय">
        <div className="income-chip-grid">
          {[
            "महुआ",
            "इमली",
            "साल बीज",
            "चिरौंजी",
            "टोरा",
            "लाख",
            "तेंदू पत्ता",
            "हर्रा",
            "बहेड़ा",
            "आँवला",
            "काजू",
            "बाँस",
            "कोसा",
            "शहद",
            "सीताफल",
          ].map((item, index) => (
            <label key={item}>
              <span>{item}</span>
              <input type="number" defaultValue={index === 0 ? 18500 : 0} />
            </label>
          ))}
        </div>
        <label className="section-total">
          <span>कुल वन उपज आय ₹</span>
          <input
            type="number"
            value={income}
            onChange={(event) => setIncome(Number(event.target.value))}
          />
        </label>
      </FormGroup>
      <NeedsBlock
        received={["संग्रहण उपकरण", "सतत संग्रहण प्रशिक्षण", "बाजार जुड़ाव"]}
        movable={["संग्रहण उपकरण", "शहद किट", "तौल मशीन/क्रेट", "मॉइस्चर मीटर"]}
        fixed={["सोलर ड्रायर", "पत्तल-दोना इकाई", "बाँस सीज़निंग टैंक", "तेल मशीन"]}
      />
    </div>
  )
}
