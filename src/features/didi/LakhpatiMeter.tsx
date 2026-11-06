import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge"
import { useTr } from "@/i18n/tr"

import type { DidiProfileData } from "./useDidi"

const tone: Record<DidiProfileData["meter"]["status"], StatusTone> = {
  lakhpati: "green",
  threshold: "amber",
  in_progress: "blue",
  single_source: "amber",
  gap: "red",
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`

/** Annual income against the ₹1 lakh Lakhpati target, with the ₹80K threshold marked. */
export function LakhpatiMeter({ meter }: { meter: DidiProfileData["meter"] }) {
  const tr = useTr()
  const done = meter.income >= meter.target
  return (
    <Card
      className="didi-meter"
      title={tr("लखपति मीटर")}
      subtitle={tr("वार्षिक शुद्ध आय")}
      action={<StatusBadge label={meter.statusLabel} tone={tone[meter.status]} />}
    >
      <div className="didi-meter-figure">
        <strong>{rupees(meter.income)}</strong>
        <span>/ {rupees(meter.target)}</span>
      </div>
      <div className="didi-meter-bar">
        <ProgressBar value={meter.percent} label={tr("लखपति मीटर")} />
        <i
          className="didi-meter-mark"
          style={{ left: `${(meter.threshold / meter.target) * 100}%` }}
          title={tr("थ्रेशोल्ड {{amount}}", { amount: rupees(meter.threshold) })}
        />
      </div>
      <p className="didi-meter-note">
        {done
          ? tr("बधाई हो! आप लखपति दीदी बन चुकी हैं।")
          : tr("लखपति बनने के लिए ₹{{amount}} और चाहिए ({{n}}% पूरा)।", {
              amount: meter.remaining.toLocaleString("en-IN"),
              n: meter.percent,
            })}
      </p>
      {meter.activeSources < 2 && !done && (
        <p className="didi-meter-tip">
          {tr("सुझाव: आय का एक और स्रोत जोड़ने से लखपति बनना आसान होगा।")}
        </p>
      )}
    </Card>
  )
}
