import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import type { RecommendationScheme } from "@/features/recommendations/types"

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
  const [details, setDetails] = useState(true)
  return (
    <article className={`scheme-match expanded ${interested ? "selected" : ""}`}>
      <div className="scheme-score">
        {scheme.score}
        <small>मैच</small>
      </div>
      <div className="scheme-main">
        <span>{scheme.dept}</span>
        <h3>{scheme.name}</h3>
        <p>
          <b>क्यों सुझाया:</b> {scheme.why}
        </p>
        <div className="scheme-benefit">
          <strong>{scheme.benefit}</strong>
          <span>लाभ / सब्सिडी</span>
        </div>
        <div className="eligibility rule-list">
          {scheme.eligibility.map(([ok, rule]) => (
            <span className={ok ? "eligible" : "ineligible"} key={rule}>
              {ok ? "✔" : "✖"} {rule}
            </span>
          ))}
        </div>
        <button className="scheme-detail-toggle" onClick={() => setDetails(!details)}>
          {details ? "विवरण छिपाएँ" : "दस्तावेज़ और आवेदन स्थान"} <Icon name="chevron" size={13} />
        </button>
        {details && (
          <div className="scheme-extra-details">
            <div>
              <strong>आवश्यक दस्तावेज़</strong>
              <p>{scheme.docs.join(" • ")}</p>
            </div>
            <div>
              <strong>कहाँ आवेदन करें</strong>
              <p>{scheme.apply}</p>
            </div>
          </div>
        )}
        <div className="expected-income">
          <Icon name="trend" size={14} />
          <span>अपेक्षित अतिरिक्त आय</span>
          <strong>+₹37,500/वर्ष</strong>
        </div>
        <div className="consent-actions">
          <button className={interested ? "interested" : ""} onClick={onToggle}>
            ✔ रुचि है
          </button>
          <button onClick={onLater}>बाद में</button>
          <button onClick={onDecline}>रुचि नहीं</button>
        </div>
      </div>
    </article>
  )
}
