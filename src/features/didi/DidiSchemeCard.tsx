import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import type { DidiScheme } from "./useDidiSchemes"

/**
 * One scheme that suits the Didi, in plain words: why it fits, what it could add,
 * the subsidy, papers and office, and her own "apply / not now" answer.
 */
export function DidiSchemeCard({
  fit,
  rank,
  busy,
  onAnswer,
}: {
  fit: DidiScheme
  rank: number
  busy: boolean
  onAnswer: (answer: "yes" | "no") => void
}) {
  const tr = useTr()
  return (
    <article className="rec-card didi-scheme">
      <header>
        <span className="rec-rank">{rank}</span>
        <div>
          <h3>{fit.name}</h3>
          <small>{fit.department}</small>
        </div>
        <span className="rec-score" title={tr("उपयुक्तता")}>
          {fit.score}%
        </span>
      </header>
      <p className="rec-why">{fit.why}</p>
      <div className="rec-figures">
        <div>
          <span>{tr("अनुमानित अतिरिक्त आय")}</span>
          <strong className="positive">
            +{rupees(fit.gain)} <small>{tr("/वर्ष")}</small>
          </strong>
        </div>
        <div>
          <span>{tr("अनुदान")}</span>
          <strong>
            {fit.subsidyPercent}%
            {fit.maxSubsidy ? ` • ${tr("अधिकतम")} ${rupees(fit.maxSubsidy)}` : ""}
          </strong>
        </div>
      </div>

      <details className="didi-scheme-more">
        <summary>{tr("पात्रता, दस्तावेज़ और कहाँ आवेदन करें")}</summary>
        <ul className="rec-checks">
          {fit.checks.map(([ok, text]) => (
            <li key={text} className={ok ? "ok" : "todo"}>
              <Icon name={ok ? "check" : "alert"} size={13} /> {text}
            </li>
          ))}
        </ul>
        <p className="rec-docs">
          <b>{tr("दस्तावेज़:")}</b> {fit.docs.join(" • ")}
        </p>
        <p className="rec-office">
          <Icon name="building" size={13} /> {fit.office}
        </p>
      </details>

      {fit.interest === "interested" ? (
        <p className="rec-interest yes">
          <Icon name="check" size={14} /> {tr("आपने रुचि दिखाई — CRP आवेदन में मदद करेंगी")}
        </p>
      ) : (
        <div className="didi-scheme-answer">
          {fit.interest === "not_interested" ? (
            <p>{tr("आपने अभी मना किया है। मन बदले तो बताएँ।")}</p>
          ) : (
            <p>{tr("क्या आप इस योजना में आवेदन करना चाहती हैं?")}</p>
          )}
          <div>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => onAnswer("yes")}
            >
              <Icon name="check" size={15} /> {tr("हाँ, आवेदन करना है")}
            </button>
            {fit.interest !== "not_interested" && (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => onAnswer("no")}
              >
                {tr("अभी नहीं")}
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
