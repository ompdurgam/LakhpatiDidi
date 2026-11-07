import { Link } from "react-router"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"

import { AskDidi } from "./AskDidi"
import type { SchemeFit } from "./types"

/** One scheme that fits the Didi: why, eligibility checks, papers, where to apply, and the DPR link. */
export function RecommendationCard({
  fit,
  rank,
  didi,
  onChanged,
}: {
  fit: SchemeFit
  rank: number
  didi: string
  onChanged: () => void
}) {
  const tr = useTr()
  const action =
    fit.dpr === "filled"
      ? tr("DPR भेजने के लिए तैयार")
      : fit.dpr === "draft"
        ? tr("DPR जारी रखें")
        : tr("DPR बनाएँ")
  return (
    <article className="rec-card">
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
          <strong className="positive">+{rupees(fit.gain)}</strong>
        </div>
        <div>
          <span>{tr("अनुदान")}</span>
          <strong>
            {fit.subsidyPercent}%
            {fit.maxSubsidy ? ` • ${tr("अधिकतम")} ${rupees(fit.maxSubsidy)}` : ""}
          </strong>
        </div>
      </div>
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
      <AskDidi didi={didi} fit={fit} onAsked={onChanged} />
      <Link
        className={`rec-action ${fit.dpr ? "continue" : ""}`}
        to={`/field/dpr/${didi}/${fit.code}`}
      >
        {action} <Icon name="arrow" size={15} />
      </Link>
    </article>
  )
}
