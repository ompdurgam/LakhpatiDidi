import { Card } from "@/components/ui/Card"
import { currentLanguage } from "@/i18n"
import { useTr } from "@/i18n/tr"

import type { DidiProfileData } from "./useDidi"

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`

/** The last 12 months (YYYY-MM), oldest first. */
function lastTwelveMonths() {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
}

/**
 * Her income month by month (recorded by her CRP) and how far the last 12 months
 * take her towards ₹1 lakh a year.
 */
export function DidiJourney({ data }: { data: DidiProfileData }) {
  const tr = useTr()
  const byMonth = new Map(data.monthlyIncome.map((m) => [m.month, m.amount]))
  const months = lastTwelveMonths().map((month) => ({ month, amount: byMonth.get(month) ?? 0 }))
  const earned = months.reduce((sum, m) => sum + m.amount, 0)
  const target = data.meter.target
  const max = Math.max(1, ...months.map((m) => m.amount))
  const label = (ym: string) =>
    new Date(`${ym}-01T00:00:00`).toLocaleDateString(
      currentLanguage() === "en" ? "en-IN" : "hi-IN",
      {
        month: "short",
      },
    )
  return (
    <Card title={tr("मेरी आय यात्रा")} subtitle={tr("पिछले 12 महीने • CRP द्वारा दर्ज")}>
      {data.monthlyIncome.length ? (
        <>
          <p className="journey-summary">
            {earned >= target
              ? tr("बधाई! पिछले 12 महीनों में {{earned}} — आप लखपति हैं।", {
                  earned: rupees(earned),
                })
              : tr("पिछले 12 महीनों में {{earned}} • लक्ष्य तक {{left}} बाकी", {
                  earned: rupees(earned),
                  left: rupees(target - earned),
                })}
          </p>
          <div className="journey-track" aria-hidden="true">
            <i style={{ width: `${Math.min(100, (earned / target) * 100)}%` }} />
          </div>
          <div className="journey-bars" role="img" aria-label={tr("मासिक आय चार्ट")}>
            {months.map((m) => (
              <div key={m.month} title={`${label(m.month)}: ${rupees(m.amount)}`}>
                <i style={{ height: `${(m.amount / max) * 100}%` }} />
                <small>{label(m.month)}</small>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="empty-note">
          {tr("अभी कोई मासिक आय दर्ज नहीं। आपकी CRP हर महीने आपकी आय दर्ज करेंगी।")}
        </p>
      )}
    </Card>
  )
}

const STATUS = {
  missing: { label: "आवेदन नहीं किया", tone: "red" },
  pending: { label: "आवेदन लंबित", tone: "amber" },
  received: { label: "प्राप्त", tone: "green" },
} as const

/** Every government entitlement from her survey: what she has, what is pending, what to apply for. */
export function EntitlementChecklist({ data }: { data: DidiProfileData }) {
  const tr = useTr()
  const list = data.entitlements
  const missing = list.filter((e) => e.status === "missing").length
  return (
    <Card
      title={tr("मेरी सरकारी सुविधाएँ")}
      subtitle={
        list.length
          ? tr("{{n}} सुविधाओं के लिए आवेदन बाकी", { n: missing })
          : tr("सर्वे के बाद दिखेंगी")
      }
    >
      {list.length ? (
        <ul className="entitlement-list">
          {list.map((e) => (
            <li key={e.name}>
              <div>
                <strong>{e.name}</strong>
                {e.department && (
                  <small>
                    {e.status === "missing"
                      ? tr("आवेदन के लिए: {{dept}} • अपनी CRP से पूछें", { dept: e.department })
                      : e.department}
                  </small>
                )}
              </div>
              <span className={`status ${STATUS[e.status].tone}`}>
                {tr(STATUS[e.status].label)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">{tr("आपका सर्वे होने के बाद यहाँ आपकी सुविधाएँ दिखेंगी।")}</p>
      )}
    </Card>
  )
}
