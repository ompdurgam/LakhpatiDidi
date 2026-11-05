import { Icon } from "@/components/ui/Icon"

export function SchemeConvergence() {
  const rows = [
    ["PMMSY तालाब", "मत्स्य", 284, 198, 142, 96, 58, "₹69.6L"],
    ["बैकयार्ड पोल्ट्री", "पशुपालन", 362, 274, 186, 144, 112, "₹53.8L"],
    ["NHM सूक्ष्म सिंचाई", "उद्यानिकी", 218, 156, 118, 82, 61, "₹32.4L"],
    ["वन धन / लाख", "वन", 196, 142, 96, 72, 54, "₹18.9L"],
    ["PM फसल बीमा", "कृषि", 442, 318, 224, 186, 0, "₹21.2L"],
  ]
  const clusters = [
    ["धान", 42, 680, "₹1.84 Cr"],
    ["NTFP", 28, 410, "₹92L"],
    ["मशरूम", 18, 216, "₹54L"],
    ["पोल्ट्री", 32, 480, "₹1.26 Cr"],
    ["मत्स्य", 16, 74, "₹88L"],
    ["बकरी", 24, 192, "₹1.08 Cr"],
    ["कौशल", 14, 286, "₹36L"],
    ["गैर-कृषि", 19, 128, "₹74L"],
    ["उद्यानिकी", 26, 312, "₹96L"],
  ]
  return (
    <div className="scheme-convergence-page">
      <section className="card convergence-table-card">
        <div className="card-head">
          <div>
            <h3>योजना अभिसरण</h3>
            <p>सुझाव से वितरण तक • नवंबर 2026</p>
          </div>
          <button className="filter-button">
            <Icon name="download" size={14} /> निर्यात
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>योजना</th>
                <th>विभाग</th>
                <th>सुझाए</th>
                <th>सहमति</th>
                <th>DPR</th>
                <th>स्वीकृत</th>
                <th>वितरित</th>
                <th>₹ स्वीकृत</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row[0])}>
                  {row.map((cell, index) => (
                    <td key={index}>
                      {index === 0 || index === 7 ? <strong>{cell}</strong> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="scheme-analysis-grid">
        <div className="card block-awareness-chart">
          <div className="card-head">
            <div>
              <h3>जागरूकता बनाम लाभ अंतर</h3>
              <p>परिवार सर्वे के आधार पर</p>
            </div>
          </div>
          {[
            ["PMMSY", 76, 34],
            ["पोल्ट्री", 68, 41],
            ["सूक्ष्म सिंचाई", 59, 28],
            ["वन धन", 72, 46],
            ["फसल बीमा", 84, 52],
          ].map(([name, aware, benefit]) => (
            <div key={String(name)}>
              <strong>{name}</strong>
              <span>जागरूक {aware}%</span>
              <i>
                <b className="aware" style={{ width: `${aware}%` }} />
                <b className="benefit" style={{ width: `${benefit}%` }} />
              </i>
              <small>लाभ {benefit}%</small>
            </div>
          ))}
        </div>
        <div className="card cluster-demand">
          <div className="card-head">
            <div>
              <h3>क्लस्टर मांग</h3>
              <p>SHG, इकाई और अनुमानित निवेश</p>
            </div>
          </div>
          {clusters.map(([name, shg, units, cost]) => (
            <div key={String(name)}>
              <span className="cluster-icon">
                <Icon name="scheme" size={14} />
              </span>
              <strong>{name}</strong>
              <p>
                <b>{shg}</b> SHG <b>{units}</b> इकाई
              </p>
              <em>{cost}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
