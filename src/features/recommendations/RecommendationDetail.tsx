import type { ReactNode } from "react"
import { Link } from "react-router"

import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import { RecommendationCard } from "./RecommendationCard"
import { useDidiRecommendations } from "./useRecommendations"

/** One Didi's personalised scheme recommendations and how far they take her toward ₹1 lakh. */
export function RecommendationDetail({ code, compact }: { code: string; compact: boolean }) {
  const tr = useTr()
  const { data, error, loading, reload } = useDidiRecommendations(code)
  const wrap = (body: ReactNode) => (
    <div className={compact ? "phone-content field-detail-page" : "field-detail-page wide"}>
      <Link to="/field/recommendations" className="back-link">
        <Icon name="arrow" size={14} className="flip" /> {tr("सर्वे पूर्ण सूची")}
      </Link>
      {body}
    </div>
  )
  if (error) return wrap(<EmptyState>{error}</EmptyState>)
  if (!data) return wrap(<EmptyState>{loading ? tr("लोड हो रहा है…") : ""}</EmptyState>)

  const { household: h, leverage: lev } = data
  const after = Math.min(100, Math.round((lev.projected / lev.target) * 100))
  const now = Math.min(100, Math.round((lev.current / lev.target) * 100))
  return wrap(
    <>
      <section className="rec-person">
        <span className="fl-avatar large" aria-hidden="true">
          {h.initials}
        </span>
        <div>
          <h2>{h.name}</h2>
          <p>
            {h.village} • {h.category}
            {h.special ? ` • ${h.special}` : ""}
          </p>
          <small>
            {h.sources.length ? h.sources.map((s) => s.name).join(" • ") : tr("आय स्रोत दर्ज नहीं")}
          </small>
        </div>
      </section>

      <section className="rec-leverage">
        <div className="rec-leverage-figures">
          <div>
            <span>{tr("वर्तमान आय")}</span>
            <strong>{rupees(lev.current)}</strong>
          </div>
          <Icon name="arrow" size={18} />
          <div className={lev.reachesTarget ? "goal" : ""}>
            <span>{tr("सुझावों के बाद")}</span>
            <strong>{rupees(lev.projected)}</strong>
          </div>
        </div>
        <div className="rec-meter" aria-hidden="true">
          <i className="after" style={{ width: `${after}%` }} />
          <i className="now" style={{ width: `${now}%` }} />
        </div>
        <p>
          {lev.reachesTarget
            ? tr("इन योजनाओं से आय ₹1,00,000 के लखपति लक्ष्य से ऊपर पहुँच सकती है")
            : lev.extra > 0
              ? tr("लखपति लक्ष्य ₹1,00,000 में अभी {{gap}} और चाहिए", {
                  gap: rupees(Math.max(0, lev.target - lev.projected)),
                })
              : tr("इस समय कोई नई योजना आय नहीं बढ़ाती")}
        </p>
        {lev.steps.length > 0 && (
          <ol className="rec-steps">
            {lev.steps.map((step) => (
              <li key={step.code}>
                <span>{step.name}</span>
                <b>+{rupees(step.gain)}</b>
              </li>
            ))}
          </ol>
        )}
      </section>

      <h3 className="rec-heading">{tr("इसके लिए उपयुक्त योजनाएँ")}</h3>
      {data.recommendations.length === 0 && <EmptyState>{tr("अभी कोई नई योजना नहीं")}</EmptyState>}
      <div className="rec-cards">
        {data.recommendations.map((fit, index) => (
          <RecommendationCard
            key={fit.code}
            fit={fit}
            rank={index + 1}
            didi={h.code}
            onChanged={() => void reload()}
          />
        ))}
      </div>

      {data.entitlements.length > 0 && (
        <>
          <h3 className="rec-heading">{tr("छूटे हुए अधिकार")}</h3>
          <ul className="rec-simple">
            {data.entitlements.map((e) => (
              <li key={e.code}>
                <strong>{e.name}</strong>
                <small>
                  {e.department} • {e.since}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}
      {data.applied.length > 0 && (
        <>
          <h3 className="rec-heading">{tr("पहले भेजे गए आवेदन")}</h3>
          <ul className="rec-simple">
            {data.applied.map((a) => (
              <li key={a.id}>
                <strong>{a.scheme}</strong>
                <small>{a.id}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </>,
  )
}
