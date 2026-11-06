import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { TextControl } from "@/components/ui/TextControl"
import { useTr } from "@/i18n/tr"

export function FacilityGroup({
  title,
  items,
  more,
}: {
  title: string
  items: string[]
  more: number
}) {
  const tr = useTr()
  const [expanded, setExpanded] = useState(false)
  return (
    <section className="village-section">
      <div className="village-section-title">
        <div>
          <span>{title.split(" ")[0]}</span>
          <h3>{tr(title.split(" ").slice(1).join(" "))}</h3>
        </div>
        <small>
          {items.length + more} {tr("मद")}
        </small>
      </div>
      <div className="facility-list">
        {items.map((item, index) => (
          <FacilityRow key={item} name={item} index={index} />
        ))}
      </div>
      {expanded && (
        <div className="additional-facilities-note">
          {tr("{{n}} अतिरिक्त मद की सूची खोली गई है।", { n: more })}
        </div>
      )}
      <button className="show-more-facilities" onClick={() => setExpanded(!expanded)}>
        {expanded ? tr("अतिरिक्त मद छिपाएँ") : tr("+{{n}} और", { n: more })}
      </button>
    </section>
  )
}

export function FacilityRow({ name, index }: { name: string; index: number }) {
  const tr = useTr()
  const [available, setAvailable] = useState(index % 5 !== 2 ? "हाँ" : "नहीं")
  const [condition, setCondition] = useState(index % 4 === 0 ? "आंशिक-मरम्मत आवश्यक" : "कार्यशील")
  return (
    <div className="facility-row">
      <div className="facility-name">
        <strong>{tr(name)}</strong>
        <span
          className={`status ${
            available === "नहीं" ? "red" : condition === "कार्यशील" ? "green" : "amber"
          }`}
        >
          {available === "नहीं" ? tr("उपलब्ध नहीं") : tr(condition)}
        </span>
      </div>
      <ChipField label="उपलब्ध?">
        <ChipGroup
          options={["हाँ", "नहीं"]}
          selected={[available]}
          onToggle={setAvailable}
          single
        />
      </ChipField>
      {available === "हाँ" ? (
        <label className="facility-condition">
          <span>{tr("स्थिति")}</span>
          <select value={condition} onChange={(event) => setCondition(event.target.value)}>
            <option value="कार्यशील">{tr("कार्यशील")}</option>
            <option value="आंशिक-मरम्मत आवश्यक">{tr("आंशिक-मरम्मत आवश्यक")}</option>
            <option value="अनुपयोगी-निर्माणाधीन">{tr("अनुपयोगी-निर्माणाधीन")}</option>
          </select>
        </label>
      ) : (
        <TextControl label="दूरी (किमी)" value="4" type="number" />
      )}
    </div>
  )
}
