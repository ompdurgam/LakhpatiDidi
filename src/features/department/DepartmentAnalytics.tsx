import { Icon } from "@/components/ui/Icon"

/** Department funnel, awareness gap and target-vs-achievement panels. */
export function DepartmentAnalytics() {
  return (
    <>
      <section className="analytics-grid department-analytics">
        <div className="card bar-chart">
          <div className="card-head">
            <div>
              <h3>योजना-वार फनल</h3>
              <p>प्राप्त → स्वीकृत → डिलीवर</p>
            </div>
          </div>
          <div className="funnel-legend">
            <span>
              <i className="received" />
              प्राप्त
            </span>
            <span>
              <i className="sanctioned" />
              स्वीकृत
            </span>
            <span>
              <i className="delivered" />
              डिलीवर
            </span>
          </div>
          {["PMMSY", "Boat / Net", "Pond", "Biofloc", "Ice Box"].map((x, index) => (
            <div className="bar-row" key={x}>
              <span>{x}</span>
              <i>
                <b style={{ width: `${92 - index * 10}%` }} />
                <em style={{ width: `${68 - index * 7}%` }} />
                <small style={{ width: `${49 - index * 5}%` }} />
              </i>
            </div>
          ))}
        </div>
        <div className="card sla-gauge">
          <h3>औसत स्वीकृति समय</h3>
          <strong>
            11.4 <small>दिन</small>
          </strong>
          <div>
            <i />
          </div>
          <p>लक्ष्य 15 दिन • 78% समय पर</p>
        </div>
        <div className="card awareness-gap-card">
          <div className="card-head">
            <div>
              <h3>जागरूकता बनाम लाभ अंतर</h3>
              <p>सर्वे D सेक्शन से प्रतिशत</p>
            </div>
          </div>
          {[
            ["PMMSY", 78, 34],
            ["Boat / Net", 64, 29],
            ["Pond construction", 71, 41],
            ["Biofloc", 46, 18],
          ].map(([scheme, aware, received]) => (
            <div className="awareness-row" key={String(scheme)}>
              <strong>{scheme}</strong>
              <div>
                <span>
                  जागरूक <b>{aware}%</b>
                </span>
                <i>
                  <em style={{ width: `${aware}%` }} />
                </i>
              </div>
              <div>
                <span>
                  लाभ मिला <b>{received}%</b>
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
            <h3>योजना लक्ष्य बनाम उपलब्धि</h3>
            <p>वित्तीय वर्ष 2026–27 • नवंबर तक</p>
          </div>
          <button className="filter-button">
            <Icon name="download" size={14} /> निर्यात
          </button>
        </div>
        <div className="target-table-scroll">
          <table>
            <thead>
              <tr>
                <th>योजना</th>
                <th>वार्षिक लक्ष्य</th>
                <th>स्वीकृत</th>
                <th>उपलब्धि %</th>
                <th>बजट उपयोग</th>
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
                    <strong>{scheme}</strong>
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
