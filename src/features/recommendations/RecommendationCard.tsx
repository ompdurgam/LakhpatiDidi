import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import type { RecommendationScheme } from "@/features/recommendations/types"
import { useTr } from "@/i18n/tr"

export function RecommendationCard({
  scheme,
  interested,
  onToggle,
  onLater,
  onDecline,
}: {
  scheme: RecommendationScheme
  interested: boolean
  onToggle: () => void
  onLater: () => void
  onDecline: () => void
}) {
  const tr = useTr()
  const [details, setDetails] = useState(true)
  return (
    <article className={`scheme-match expanded ${interested ? "selected" : ""}`}>
      <div className="scheme-score">
        {tr(scheme.score)}
        <small>{tr("मैच")}</small>
      </div>
      <div className="scheme-main">
        <span>{tr(scheme.dept)}</span>
        <h3>{tr(scheme.name)}</h3>
        <p>
          <b>{tr("क्यों सुझाया:")}</b> {tr(scheme.why)}
        </p>
        <div className="scheme-benefit">
          <strong>{tr(scheme.benefit)}</strong>
          <span>{tr("लाभ / सब्सिडी")}</span>
        </div>
        <div className="eligibility rule-list">
          {scheme.eligibility.map(([ok, rule]) => (
            <span className={ok ? "eligible" : "ineligible"} key={rule}>
              {ok ? "✔" : "✖"} {tr(rule)}
            </span>
          ))}
        </div>
        <button className="scheme-detail-toggle" onClick={() => setDetails(!details)}>
          {details ? tr("विवरण छिपाएँ") : tr("दस्तावेज़ और आवेदन स्थान")}{" "}
          <Icon name="chevron" size={13} />
        </button>
        {details && (
          <div className="scheme-extra-details">
            <div>
              <strong>{tr("आवश्यक दस्तावेज़")}</strong>
              <p>{scheme.docs.map((doc) => tr(doc)).join(" • ")}</p>
            </div>
            <div>
              <strong>{tr("कहाँ आवेदन करें")}</strong>
              <p>{tr(scheme.apply)}</p>
            </div>
          </div>
        )}
        <div className="expected-income">
          <Icon name="trend" size={14} />
          <span>{tr("अपेक्षित अतिरिक्त आय")}</span>
          <strong>{tr("+₹37,500/वर्ष")}</strong>
        </div>
        <div className="consent-actions">
          <button className={interested ? "interested" : ""} onClick={onToggle}>
            {tr("✔ रुचि है")}
          </button>
          <button onClick={onLater}>{tr("बाद में")}</button>
          <button onClick={onDecline}>{tr("रुचि नहीं")}</button>
        </div>
      </div>
    </article>
  )
}
