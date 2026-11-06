import { useState } from "react"

import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { DidiRow } from "@/features/recommendations/DidiRow"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import type { BoardState } from "./types"
import { useDprBoard } from "./useDpr"

const stateClass: Record<BoardState, string> = {
  filled: "ready",
  draft: "draft",
  todo: "todo",
  done: "done",
}

/** DPR tab: how many DPRs are drafted / filled / sent, and a list of Didis to make the next one for. */
export function DprBoard({ compact }: { compact: boolean }) {
  const tr = useTr()
  const [search, setSearch] = useState("")
  const { data, loading, error } = useDprBoard(search.trim())

  const stateLabel: Record<BoardState, string> = {
    filled: tr("भरा हुआ — भेजें"),
    draft: tr("ड्राफ्ट"),
    todo: tr("DPR बनाना बाकी"),
    done: tr("सब भेजा जा चुका"),
  }
  const kpis = data?.kpis
  const tiles: [string, number | undefined, string][] = [
    [tr("DPR बाकी"), kpis?.todo, "todo"],
    [tr("ड्राफ्ट"), kpis?.draft, "draft"],
    [tr("भरे हुए"), kpis?.filled, "ready"],
    [tr("भेजे गए"), kpis?.sent, "done"],
  ]

  return (
    <div className={compact ? "phone-content field-list-page" : "field-list-page wide"}>
      <div className="field-list-head">
        <div>
          <span className="eyebrow">{tr("परियोजना रिपोर्ट")}</span>
          <h2>DPR</h2>
          <p>{tr("दीदी चुनकर उसका DPR बनाएँ और विभाग को भेजें")}</p>
        </div>
        <strong className="field-count">{kpis?.didis ?? 0}</strong>
      </div>
      <div className="dpr-kpis" role="list">
        {tiles.map(([label, value, tone]) => (
          <div key={tone} role="listitem" className={`dpr-kpi ${tone}`}>
            <strong>{value ?? "–"}</strong>
            <span>{label}</span>
          </div>
        ))}
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
            to={item.scheme ? `/field/dpr/${item.code}/${item.scheme.code}` : "/field/dpr"}
            initials={item.initials}
            name={item.name}
            meta={`${item.village} • ${rupees(item.income)}${tr("/वर्ष")}`}
            aside={
              <span className={`state-chip ${stateClass[item.state]}`}>
                {stateLabel[item.state]}
              </span>
            }
          >
            <small className="didi-row-note">
              {item.scheme ? (
                <>
                  {item.scheme.name}
                  {item.step ? ` • ${tr("चरण {{n}}/7", { n: item.step })}` : ""}
                  {item.expectedGain ? ` • +${rupees(item.expectedGain)}` : ""}
                </>
              ) : (
                tr("{{n}} DPR भेजे गए", { n: item.sent })
              )}
            </small>
            {item.scheme && (
              <span className="make-dpr">
                {item.state === "todo" ? tr("DPR बनाएँ") : tr("DPR खोलें")}{" "}
                <Icon name="arrow" size={13} />
              </span>
            )}
          </DidiRow>
        ))}
      </ul>
    </div>
  )
}
