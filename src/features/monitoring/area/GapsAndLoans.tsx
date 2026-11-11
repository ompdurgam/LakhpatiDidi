import { Fragment } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { band, money, num } from "../format"
import type { Overview } from "../useOverview"

/** Open entitlement gaps per scheme × child area (the busiest of each). */
export function GapHeatmap({ data }: { data: Overview }) {
  const tr = useTr()
  const { cells } = data.gaps
  const sum = (pick: (c: (typeof cells)[number]) => string | number) => {
    const totals = new Map<string | number, number>()
    for (const c of cells) totals.set(pick(c), (totals.get(pick(c)) ?? 0) + c.open)
    return [...totals].sort((a, b) => b[1] - a[1]).map(([key]) => key)
  }
  const schemes = sum((c) => c.scheme).slice(0, 5) as string[]
  const childIds = sum((c) => c.childId).slice(0, 6) as number[]
  const children = childIds.map((id) => data.children.find((c) => c.id === id)!).filter(Boolean)
  const value = (scheme: string, childId: number) =>
    cells.find((c) => c.scheme === scheme && c.childId === childId)?.open ?? 0
  const max = Math.max(1, ...cells.map((c) => c.open))
  return (
    <div className="card state-heatmap">
      <div className="card-head">
        <div>
          <h3>{tr("योजना × क्षेत्र हकदारी अंतर")}</h3>
          <p>
            {tr("खुले हकदारी गैप • लाल = अधिक गैप")} • {num(data.gaps.open)} {tr("खुले")} /{" "}
            {num(data.gaps.closed)} {tr("बंद")}
          </p>
        </div>
      </div>
      {schemes.length ? (
        <div
          className="heatmap-grid"
          style={{ gridTemplateColumns: `minmax(90px, 1.3fr) repeat(${children.length}, 1fr)` }}
        >
          <div />
          {children.map((child) => (
            <b key={child.id}>{child.name}</b>
          ))}
          {schemes.map((scheme) => (
            <Fragment key={scheme}>
              <strong>{cells.find((c) => c.scheme === scheme)?.schemeName}</strong>
              {children.map((child) => {
                const open = value(scheme, child.id)
                return (
                  <span key={child.id} className={band((open / max) * 100, [34, 67])}>
                    {num(open)}
                  </span>
                )
              })}
            </Fragment>
          ))}
        </div>
      ) : (
        <p className="empty-note">{tr("सर्वे में अभी कोई हकदारी गैप दर्ज नहीं")}</p>
      )}
    </div>
  )
}

const LENDER_LABEL: Record<string, string> = {
  shg: "SHG / CIF",
  bank: "बैंक लिंकेज",
  mfi: "MFI",
  moneylender: "साहूकार",
  relative: "रिश्तेदार",
  other: "अन्य",
}

/** Loans Didis reported in the survey, by lender. */
export function FinancialSupport({ rows }: { rows: Overview["loans"] }) {
  const tr = useTr()
  return (
    <div className="card financial-support">
      <div className="card-head">
        <div>
          <h3>{tr("वित्तीय सहायता")}</h3>
          <p>{tr("सर्वे में बताए गए ऋण • राशि और लाभार्थी")}</p>
        </div>
      </div>
      {rows.length ? (
        rows.map((row) => (
          <div key={row.lender}>
            <span>
              <Icon name="scheme" size={15} />
            </span>
            <strong>{tr(LENDER_LABEL[row.lender] ?? row.lender)}</strong>
            <b>{money(row.amount)}</b>
            <small>
              {num(row.households)} {tr("लाभार्थी")}
            </small>
          </div>
        ))
      ) : (
        <p className="empty-note">{tr("सर्वे में अभी कोई ऋण दर्ज नहीं")}</p>
      )}
    </div>
  )
}
