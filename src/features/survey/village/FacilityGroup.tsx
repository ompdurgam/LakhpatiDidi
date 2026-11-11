import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { useTr } from "@/i18n/tr"

import type { Answer } from "./catalog"

/** A titled list of facilities, each answered available / condition / distance. */
export function FacilityGroup({
  code,
  title,
  items,
  answers,
  onChange,
}: {
  code: string
  title: string
  items: string[]
  answers: Record<string, Answer>
  onChange: (item: string, answer: Answer) => void
}) {
  const tr = useTr()
  return (
    <section className="village-section">
      <div className="village-section-title">
        <div>
          <span>{code}</span>
          <h3>{tr(title)}</h3>
        </div>
        <small>
          {items.filter((i) => answers[i]?.available).length}/{items.length} {tr("मद")}
        </small>
      </div>
      <div className="facility-list">
        {items.map((item) => (
          <FacilityRow
            key={item}
            name={item}
            answer={answers[item] ?? {}}
            onChange={(answer) => onChange(item, answer)}
          />
        ))}
      </div>
    </section>
  )
}

function FacilityRow({
  name,
  answer,
  onChange,
}: {
  name: string
  answer: Answer
  onChange: (answer: Answer) => void
}) {
  const tr = useTr()
  const available = answer.available as string | undefined
  const condition = (answer.condition as string | undefined) ?? "कार्यशील"
  return (
    <div className="facility-row">
      <div className="facility-name">
        <strong>{tr(name)}</strong>
        {available && (
          <span
            className={`status ${
              available === "नहीं" ? "red" : condition === "कार्यशील" ? "green" : "amber"
            }`}
          >
            {available === "नहीं" ? tr("उपलब्ध नहीं") : tr(condition)}
          </span>
        )}
      </div>
      <ChipField label="उपलब्ध?">
        <ChipGroup
          options={["हाँ", "नहीं"]}
          selected={available ? [available] : []}
          onToggle={(value) =>
            onChange(value === "हाँ" ? { available: value, condition } : { available: value })
          }
          single
        />
      </ChipField>
      {available === "हाँ" && (
        <label className="facility-condition">
          <span>{tr("स्थिति")}</span>
          <select
            value={condition}
            onChange={(e) => onChange({ ...answer, condition: e.target.value })}
          >
            <option value="कार्यशील">{tr("कार्यशील")}</option>
            <option value="आंशिक-मरम्मत आवश्यक">{tr("आंशिक-मरम्मत आवश्यक")}</option>
            <option value="अनुपयोगी-निर्माणाधीन">{tr("अनुपयोगी-निर्माणाधीन")}</option>
          </select>
        </label>
      )}
      {available === "नहीं" && (
        <label className="text-control">
          <span>{tr("दूरी (किमी)")}</span>
          <input
            type="number"
            min={0}
            value={answer.distanceKm ?? ""}
            onChange={(e) => onChange({ ...answer, distanceKm: Number(e.target.value) })}
          />
        </label>
      )}
    </div>
  )
}
