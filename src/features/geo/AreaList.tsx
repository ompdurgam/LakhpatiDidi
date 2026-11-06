import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { countLabel, levelBelow } from "./labels"
import type { ChildArea, GeoLevel } from "./useGeo"

/** Searchable list of the child areas, with LGD code and household stats. */
export function AreaList({
  level,
  areas,
  selected,
  onSelect,
}: {
  level: GeoLevel
  areas: ChildArea[]
  selected?: string
  onSelect: (area: ChildArea) => void
}) {
  const tr = useTr()
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const shown = q
    ? areas.filter((a) => a.name.toLowerCase().includes(q) || (a.code ?? "").includes(q))
    : areas
  const below = levelBelow(level)
  return (
    <div className="geo-list">
      <label className="geo-search">
        <Icon name="search" size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr("नाम या LGD कोड खोजें")}
          aria-label={tr("नाम या LGD कोड खोजें")}
        />
      </label>
      <small className="geo-count">
        {tr("{{n}} में से {{m}} दिखाए गए", { n: areas.length, m: shown.length })}
      </small>
      <ul>
        {shown.map((area) => (
          <li key={area.code ?? area.name}>
            <button
              type="button"
              className={area.code === selected ? "active" : ""}
              onClick={() => onSelect(area)}
              disabled={!area.code}
            >
              <div>
                <strong>{area.name}</strong>
                <small>
                  {area.code ? `LGD ${area.code}` : tr("डेमो — LGD कोड नहीं")}
                  {area.bodyType && area.bodyType !== "Village Panchayat"
                    ? ` • ${tr(area.bodyType)}`
                    : ""}
                  {below ? ` • ${tr(countLabel[below], { n: area.childCount })}` : ""}
                </small>
              </div>
              {area.households > 0 && (
                <span className="geo-badge" title={tr("सर्वेक्षित परिवार / लखपति")}>
                  {area.households} / {area.lakhpati}
                </span>
              )}
              <Icon name="chevron" size={15} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
