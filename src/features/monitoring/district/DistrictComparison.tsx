import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { money, num } from "../format"
import { ahead, type Comparison } from "./compare"

const show = (c: Comparison, value: number) =>
  c.key === "avgIncome" ? money(value) : c.unit === "%" ? `${value}%` : num(value)

/** The district's measures beside the state's (state average per district for counts), with rank. */
export function DistrictComparison({ rows }: { rows: Comparison[] }) {
  const tr = useTr()
  return (
    <section className="card department-leaderboard district-compare">
      <div className="card-head">
        <div>
          <h3>{tr("राज्य से तुलना")}</h3>
          <p>{tr("गिनती के लिए राज्य का प्रति-जिला औसत • रैंक: 1 = सर्वश्रेष्ठ")}</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{tr("संकेतक")}</th>
              <th>{tr("जिला")}</th>
              <th>{tr("राज्य")}</th>
              <th>{tr("रैंक")}</th>
              <th>{tr("स्थिति")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const good = ahead(c)
              return (
                <tr key={c.key}>
                  <td>
                    <strong>{tr(c.label)}</strong>
                  </td>
                  <td>
                    <strong>{show(c, c.district)}</strong>
                  </td>
                  <td>{show(c, c.state)}</td>
                  <td>{c.rank ? `${c.rank} / ${c.of}` : "—"}</td>
                  <td>
                    <span className={`compare-status ${good ? "good" : "behind"}`}>
                      <Icon name={good ? "check" : "alert"} size={13} />
                      {tr(good ? "राज्य से आगे" : "राज्य से पीछे")}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
