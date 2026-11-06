import { useState } from "react"

import { EmptyState } from "@/components/ui/EmptyState"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import { DidiRow } from "./DidiRow"
import { useSurveyed } from "./useRecommendations"

/** Recommendations tab: every Didi whose survey is complete; tap one for her personal schemes. */
export function RecommendationList({ compact }: { compact: boolean }) {
  const tr = useTr()
  const [search, setSearch] = useState("")
  const { data, loading, error } = useSurveyed(search.trim())

  return (
    <div className={compact ? "phone-content field-list-page" : "field-list-page wide"}>
      <div className="field-list-head">
        <div>
          <span className="eyebrow">{tr("सर्वे पूर्ण")}</span>
          <h2>{tr("योजना सुझाव")}</h2>
          <p>{tr("किसी दीदी को चुनें — उसकी आय बढ़ाने वाली योजनाएँ देखें")}</p>
        </div>
        <strong className="field-count">{data?.total ?? 0}</strong>
      </div>
      <input
        className="field-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={tr("नाम, गाँव या कोड से खोजें")}
        aria-label={tr("नाम, गाँव या कोड से खोजें")}
      />
      {error && <EmptyState>{error}</EmptyState>}
      {!error && !data && loading && <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>}
      {data && !data.items.length && <EmptyState>{tr("कोई पूर्ण सर्वे नहीं मिला")}</EmptyState>}
      <ul className="didi-rows">
        {data?.items.map((item) => (
          <DidiRow
            key={item.code}
            to={`/field/recommendations/${item.code}`}
            initials={item.initials}
            name={item.name}
            meta={`${item.village} • ${rupees(item.income)}${tr("/वर्ष")}`}
            aside={
              item.extraIncome > 0 ? (
                <span className={`gain-chip ${item.reachesTarget ? "goal" : ""}`}>
                  +{rupees(item.extraIncome)}
                </span>
              ) : undefined
            }
          >
            <small className="didi-row-note">
              {item.recommended
                ? tr("{{count}} योजनाएँ सुझाई • {{top}}", {
                    count: item.recommended,
                    top: item.topScheme ?? "",
                  })
                : tr("अभी कोई नई योजना नहीं")}
            </small>
          </DidiRow>
        ))}
      </ul>
    </div>
  )
}
