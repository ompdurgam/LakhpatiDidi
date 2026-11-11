import type { ApplicationRow } from "@/api/types"
import { ApplicationTable } from "@/features/applications/ApplicationTable"
import { Blcc } from "@/features/blcc/BlccRegister"
import { SchemeConvergence } from "@/features/block/SchemeConvergence"
import { HouseholdRegister } from "@/features/households/HouseholdRegister"
import { useAreaLabel } from "@/features/monitoring/useAreaLabel"
import { BlockReports } from "@/features/reports/BlockReports"
import { useTr } from "@/i18n/tr"

const OPEN = new Set(["submitted", "under_review", "info_requested"])

export function ModulePage({
  active,
  rows,
  onSelect,
  onNotify,
}: {
  active: string
  rows: ApplicationRow[]
  onSelect: (item: ApplicationRow) => void
  onNotify: (s: string) => void
}) {
  const tr = useTr()
  const area = useAreaLabel()
  const titleMap: Record<string, string> = {
    परिवार: "परिवार और दीदी रजिस्टर",
    आवेदन: "आवेदन एवं DPR ट्रैकर",
    "BLCC कार्यवाही": "BLCC कार्यवाही रजिस्टर",
    योजनाएँ: "योजना अभिसरण",
    रिपोर्ट: "रिपोर्ट और विश्लेषण",
    सेटिंग्स: "पोर्टल सेटिंग्स",
  }
  return (
    <div className="page module-page">
      <section className="welcome">
        <div>
          <h2>{tr(titleMap[active] || active)}</h2>
          <p>{area}</p>
        </div>
      </section>
      {active === "परिवार" ? (
        <HouseholdRegister onNotify={onNotify} />
      ) : active === "आवेदन" ? (
        <section className="card applications-card">
          <div className="card-head">
            <div>
              <h3>{tr("सभी आवेदन")}</h3>
              <p>
                {tr("कुल {{n}} आवेदन • {{p}} पर कार्यवाही बाकी", {
                  n: rows.length,
                  p: rows.filter((r) => OPEN.has(r.statusCode)).length,
                })}
              </p>
            </div>
          </div>
          <ApplicationTable rows={rows} onSelect={onSelect} />
        </section>
      ) : active === "BLCC कार्यवाही" ? (
        <Blcc rows={rows} onSelect={onSelect} />
      ) : active === "योजनाएँ" ? (
        <SchemeConvergence />
      ) : active === "रिपोर्ट" ? (
        <BlockReports rows={rows} />
      ) : null}
    </div>
  )
}
