import { useTr } from "@/i18n/tr"

import { donutGradient, num, pct } from "../format"
import type { Overview } from "../useOverview"

const COLORS = [
  "#4b875f",
  "#85a965",
  "#dca63b",
  "#5b8fa9",
  "#8a7058",
  "#b77a59",
  "#8d7ab5",
  "#718a79",
]

/** Income sources reported by surveyed Didis. */
export function SectorDonut({ rows, surveyed }: { rows: Overview["sectors"]; surveyed: number }) {
  const tr = useTr()
  const total = rows.reduce((sum, r) => sum + r.households, 0)
  return (
    <div className="card sector-donut-card">
      <div className="card-head">
        <div>
          <h3>{tr("सेक्टर वितरण")}</h3>
          <p>{tr("सर्वे में बताए गए आजीविका स्रोत")}</p>
        </div>
      </div>
      {rows.length ? (
        <div className="district-donut-wrap">
          <div
            className="sector-donut"
            style={{
              background: donutGradient(
                rows.map((r, i) => ({ value: r.households, color: COLORS[i] })),
              ),
            }}
          >
            <span>
              {num(surveyed)}
              <small>{tr("सर्वेक्षित")}</small>
            </span>
          </div>
          <div className="sector-legend">
            {rows.map((row, index) => (
              <span key={row.name}>
                <i style={{ background: COLORS[index] }} />
                {tr(row.name)} {pct(row.households, total)}%
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="empty-note">{tr("अभी तक कोई सर्वे जमा नहीं हुआ है")}</p>
      )}
    </div>
  )
}

const BANDS = ["<50K", "50–80K", "80K–1L", "1L+"]

/** Surveyed Didis by annual household income. */
export function IncomeBands({ bands }: { bands: Overview["incomeBands"] }) {
  const tr = useTr()
  const max = Math.max(...bands)
  return (
    <div className="card income-band-chart">
      <div className="card-head">
        <div>
          <h3>{tr("आय बैंड")}</h3>
          <p>{tr("सर्वेक्षित परिवारों का वार्षिक आय स्तर")}</p>
        </div>
      </div>
      {max ? (
        BANDS.map((label, index) => (
          <div key={label}>
            <span>{label}</span>
            <i>
              <b className={`band-${index}`} style={{ width: `${pct(bands[index], max)}%` }} />
            </i>
            <strong>{num(bands[index])}</strong>
          </div>
        ))
      ) : (
        <p className="empty-note">{tr("अभी तक कोई सर्वे जमा नहीं हुआ है")}</p>
      )}
    </div>
  )
}
