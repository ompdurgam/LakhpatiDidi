import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { useVillage } from "./useGeo"

/** Details of one village: LGD path and survey / Lakhpati figures. */
export function VillagePanel({ code, onClose }: { code: string; onClose: () => void }) {
  const tr = useTr()
  const { data, isLoading } = useVillage(code)
  const village = data?.path.at(-1)
  return (
    <aside className="geo-village card" aria-live="polite">
      <div className="geo-village-head">
        <div>
          <span className="eyebrow">{tr("गाँव")}</span>
          <h3>{village?.name ?? "…"}</h3>
          <small>LGD {code}</small>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label={tr("बंद करें")}>
          <Icon name="close" size={16} />
        </button>
      </div>
      {isLoading || !data ? (
        <p className="geo-muted">{tr("लोड हो रहा है…")}</p>
      ) : (
        <>
          <p className="geo-muted">
            {data.path
              .slice(0, -1)
              .map((a) => a.name)
              .join(" › ")}
          </p>
          <dl className="geo-village-stats">
            <div>
              <dt>{tr("सर्वेक्षित परिवार")}</dt>
              <dd>{data.households}</dd>
            </div>
            <div>
              <dt>{tr("PLD चिन्हित")}</dt>
              <dd>{data.pld}</dd>
            </div>
            <div>
              <dt>{tr("लखपति दीदी")}</dt>
              <dd>{data.lakhpati}</dd>
            </div>
            <div>
              <dt>{tr("औसत वार्षिक आय")}</dt>
              <dd>₹{data.avgIncome.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt>{tr("SHG")}</dt>
              <dd>{data.shgs}</dd>
            </div>
          </dl>
          {!data.households && (
            <p className="geo-muted">{tr("इस गाँव में अभी कोई सर्वे नहीं हुआ है।")}</p>
          )}
        </>
      )}
    </aside>
  )
}
