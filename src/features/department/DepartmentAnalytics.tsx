import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

/** Department funnel, awareness gap and target-vs-achievement panels. */
export function DepartmentAnalytics() {
  const tr = useTr()
  return (
    <>
      <section className="analytics-grid department-analytics">
        <div className="card bar-chart">
          <div className="card-head">
            <div>
              <h3>{tr("योजना-वार फनल")}</h3>
              <p>{tr("प्राप्त → स्वीकृत → डिलीवर")}</p>
            </div>
          </div>
          <div className="funnel-legend">
            <span>
              <i className="received" />
              {tr("प्राप्त")}
            </span>
            <span>
              <i className="sanctioned" />
              {tr("स्वीकृत")}
            </span>
            <span>
              <i className="delivered" />
              {tr("डिलीवर")}
            </span>
          </div>
          {["PMMSY", "Boat / Net", "Pond", "Biofloc", "Ice Box"].map((x, index) => (
            <div className="bar-row" key={x}>
              <span>{tr(x)}</span>
              <i>
                <b style={{ width: `${92 - index * 10}%` }} />
                <em style={{ width: `${68 - index * 7}%` }} />
                <small style={{ width: `${49 - index * 5}%` }} />
              </i>
            </div>
          ))}
        </div>
        <div className="card sla-gauge">
          <h3>{tr("औसत स्वीकृति समय")}</h3>
          <strong>
            11.4 <small>{tr("दिन")}</small>
          </strong>
          <div>
            <i />
          </div>
          <p>{tr("लक्ष्य 15 दिन • 78% समय पर")}</p>
        </div>
        <div className="card awareness-gap-card">
          <div className="card-head">
            <div>
              <h3>{tr("जागरूकता बनाम लाभ अंतर")}</h3>
              <p>{tr("सर्वे D सेक्शन से प्रतिशत")}</p>
            </div>
          </div>
          {[
            ["PMMSY", 78, 34],
            ["Boat / Net", 64, 29],
            ["Pond construction", 71, 41],
            ["Biofloc", 46, 18],
          ].map(([scheme, aware, received]) => (
            <div className="awareness-row" key={String(scheme)}>
              <strong>{tr(String(scheme))}</strong>
              <div>
                <span>
                  {tr("जागरूक")} <b>{aware}%</b>
                </span>
                <i>
                  <em style={{ width: `${aware}%` }} />
                </i>
              </div>
              <div>
                <span>
                  {tr("लाभ मिला")} <b>{received}%</b>
                </span>
                <i>
                  <em style={{ width: `${received}%` }} />
                </i>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="card target-achievement">
        <div className="card-head">
          <div>
            <h3>{tr("योजना लक्ष्य बनाम उपलब्धि")}</h3>
            <p>{tr("वित्तीय वर्ष 2026–27 • नवंबर तक")}</p>
          </div>
          <button className="filter-button">
            <Icon name="download" size={14} /> {tr("निर्यात")}
          </button>
        </div>
        <div className="target-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{tr("योजना")}</th>
                <th>{tr("वार्षिक लक्ष्य")}</th>
                <th>{tr("स्वीकृत")}</th>
                <th>{tr("उपलब्धि %")}</th>
                <th>{tr("बजट उपयोग")}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["PMMSY", 240, 168, 70, 68],
                ["Boat / Net subsidy", 180, 122, 68, 62],
                ["Own-land pond", 90, 58, 64, 71],
                ["Biofloc", 60, 31, 52, 48],
              ].map(([scheme, target, sanctioned, pct, budget]) => (
                <tr key={String(scheme)}>
                  <td>
                    <strong>{tr(String(scheme))}</strong>
                  </td>
                  <td>{target}</td>
                  <td>{sanctioned}</td>
                  <td>
                    <div className="achievement-cell">
                      <i>
                        <b style={{ width: `${pct}%` }} />
                      </i>
                      <span>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="budget-cell">
                      <i>
                        <b style={{ width: `${budget}%` }} />
                      </i>
                      <span>{budget}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
