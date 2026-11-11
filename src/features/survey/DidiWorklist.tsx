import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import type { SurveyList, SurveyStatusFilter } from "./surveyHouseholds"

const filters: [SurveyStatusFilter, string][] = [
  ["pending", "सर्वे बाकी"],
  ["done", "पूर्ण"],
  ["all", "सभी"],
]

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

/** Didis on record in the surveyor's area, each with a "complete survey" action. */
export function DidiWorklist({
  data,
  loading,
  query,
  setQuery,
  status,
  setStatus,
  page,
  setPage,
  onOpen,
}: {
  data: SurveyList | undefined
  loading: boolean
  query: string
  setQuery: (q: string) => void
  status: SurveyStatusFilter
  setStatus: (s: SurveyStatusFilter) => void
  page: number
  setPage: (page: number) => void
  onOpen: (code: string) => void
}) {
  const tr = useTr()
  const items = data?.items ?? []
  return (
    <>
      <div className="mobile-section-title">
        <strong>{tr("मेरे क्षेत्र की दीदी")}</strong>
      </div>
      <label className="household-search">
        <Icon name="search" size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr("नाम, गाँव, Household ID या LokOS कोड खोजें")}
        />
      </label>
      <div className="household-filters">
        {filters.map(([value, label]) => (
          <button
            key={value}
            className={status === value ? "active" : ""}
            onClick={() => setStatus(value)}
          >
            {tr(label)}
          </button>
        ))}
      </div>
      {items.map((row) => (
        <button className="household-row" key={row.code} onClick={() => onOpen(row.code)}>
          <span className="avatar">{initials(row.name)}</span>
          <div className="household-info">
            <strong>
              {row.name} {row.pld && <b>PLD</b>}
            </strong>
            <small>
              {row.code} • {row.village}
            </small>
            {row.shg && <small>{row.shg}</small>}
          </div>
          {row.surveyed ? (
            <i className="green">{tr("पूर्ण")}</i>
          ) : (
            <span className="complete-survey">{tr("सर्वे पूरा करें")}</span>
          )}
          <Icon name="chevron" size={16} />
        </button>
      ))}
      {!items.length && (
        <div className="home-empty">
          {loading ? tr("लोड हो रहा है…") : tr("इस फ़िल्टर में कोई परिवार नहीं मिला")}
        </div>
      )}
      {(page > 0 || data?.hasMore) && (
        <div className="worklist-pager">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            {tr("पिछला")}
          </button>
          <span>{tr("पृष्ठ {{n}}", { n: page + 1 })}</span>
          <button disabled={!data?.hasMore} onClick={() => setPage(page + 1)}>
            {tr("अगला")}
          </button>
        </div>
      )}
    </>
  )
}
