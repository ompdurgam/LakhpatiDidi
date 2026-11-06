import { Fragment } from "react"

import { Icon } from "@/components/ui/Icon"
import { Kpi } from "@/components/ui/Kpi"
import { useTr } from "@/i18n/tr"

import { StateCompliance } from "./StateCompliance"

export function StateWorkspace({ onNotify }: { onNotify: (message: string) => void }) {
  const tr = useTr()
  const regions = [
    [
      "उत्तर",
      [
        "सरगुजा",
        "सूरजपुर",
        "बलरामपुर",
        "कोरिया",
        "जशपुर",
        "मनेंद्रगढ़",
        "सक्ती",
        "रायगढ़",
        "कोरबा",
      ],
    ],
    [
      "मध्य",
      [
        "रायपुर",
        "दुर्ग",
        "धमतरी",
        "बालोद",
        "बेमेतरा",
        "कबीरधाम",
        "महासमुंद",
        "गरियाबंद",
        "बलौदाबाजार",
        "राजनांदगांव",
        "खैरागढ़",
        "मोहला-मानपुर",
        "बिलासपुर",
        "मुंगेली",
        "जांजगीर",
        "सारंगढ़",
      ],
    ],
    [
      "दक्षिण / बस्तर",
      [
        "बस्तर",
        "कोंडागांव",
        "कांकेर",
        "नारायणपुर",
        "दंतेवाड़ा",
        "बीजापुर",
        "सुकमा",
        "गौरेला-पेंड्रा",
      ],
    ],
  ]
  return (
    <div className="page role-page state-workspace">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{tr("SMMU • राज्य मिशन")}</span>
          <h2>{tr("छत्तीसगढ़ राज्य अवलोकन")}</h2>
          <p>{tr("33 जिले • 146 ब्लॉक • नवंबर 2026")}</p>
        </div>
        <button
          className="secondary"
          onClick={() => onNotify(tr("राज्य रिपोर्ट डाउनलोड तैयार है"))}
        >
          <Icon name="download" size={16} /> {tr("राज्य रिपोर्ट")}
        </button>
      </div>
      <section className="monitor-kpis">
        <Kpi
          icon="people"
          color="green"
          label="सर्वेक्षित दीदी"
          value="8,42,610"
          meta="लक्ष्य का 72%"
          progress={72}
        />
        <Kpi
          icon="trend"
          color="saffron"
          label="PLD चिन्हित"
          value="3,18,240"
          meta="+8.4% इस माह"
          trend
        />
        <Kpi
          icon="check"
          color="emerald"
          label="लखपति हासिल"
          value="94,620"
          meta="लक्ष्य का 67%"
          progress={67}
        />
        <Kpi
          icon="scheme"
          color="blue"
          label="अभिसरण राशि"
          value="₹842 Cr"
          meta="14 विभाग सक्रिय"
        />
      </section>
      <section className="state-top-grid">
        <div className="card state-map-card">
          <div className="card-head">
            <div>
              <h3>{tr("छत्तीसगढ़ • 33 जिले")}</h3>
              <p>{tr("क्षेत्र अनुसार जिला प्रदर्शन")}</p>
            </div>
            <div className="map-legend">
              <i />
              {tr("कम")} <i />
              {tr("मध्यम")} <i />
              {tr("उच्च")}
            </div>
          </div>
          <div className="state-regions">
            {regions.map(([region, districts], regionIndex) => (
              <div key={String(region)}>
                <h4>{tr(String(region))}</h4>
                <div>
                  {(districts as string[]).map((district, index) => (
                    <button
                      key={district}
                      className={
                        (index + regionIndex) % 4 === 0
                          ? "high"
                          : index % 3 === 0
                            ? "medium"
                            : "low"
                      }
                      title={tr(district)}
                    >
                      {tr(district).slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card statewide-funnel">
          <div className="card-head">
            <div>
              <h3>{tr("राज्यव्यापी फनल")}</h3>
              <p>{tr("सर्वे से लखपति तक")}</p>
            </div>
          </div>
          {[
            ["सर्वे", "8,42,610", 100],
            ["सुझाव", "5,96,420", 85],
            ["सहमति", "4,28,310", 72],
            ["DPR", "3,12,180", 61],
            ["स्वीकृत", "2,46,730", 50],
            ["वितरित", "1,89,420", 42],
            ["आय सक्रिय", "1,42,860", 34],
            ["लखपति", "94,620", 25],
          ].map(([label, value, width], index) => (
            <div key={String(label)}>
              <span>{tr(String(label))}</span>
              <i>
                <b style={{ width: `${width}%` }}>{value}</b>
              </i>
              <small>
                {index < 7
                  ? tr("{{n}}% अगला चरण", {
                      n: Math.round(Number(width) - Number([85, 72, 61, 50, 42, 34, 25, 0][index])),
                    })
                  : tr("लक्ष्य")}
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="card department-leaderboard">
        <div className="card-head">
          <div>
            <h3>{tr("विभाग प्रदर्शन लीडरबोर्ड")}</h3>
            <p>{tr("औसत समय, डिलीवरी और अभिसरण")}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>{tr("रैंक")}</th>
              <th>{tr("विभाग")}</th>
              <th>{tr("औसत स्वीकृति दिन")}</th>
              <th>{tr("समय पर डिलीवरी %")}</th>
              <th>{tr("₹ स्वीकृत")}</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["1", "कृषि", "8.2", "91%", "₹186 Cr"],
              ["2", "पशुपालन", "9.4", "87%", "₹142 Cr"],
              ["3", "मत्स्य", "10.1", "84%", "₹96 Cr"],
              ["4", "उद्यानिकी", "11.6", "79%", "₹118 Cr"],
              ["5", "वन / CGMFP", "13.2", "74%", "₹82 Cr"],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={index}>{index === 0 ? <b>{tr(cell)}</b> : tr(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="state-analysis-grid">
        <div className="card state-heatmap">
          <div className="card-head">
            <div>
              <h3>{tr("योजना × जिला जागरूकता-लाभ अंतर")}</h3>
              <p>{tr("अंतर प्रतिशत अंक • लाल = अधिक गैप")}</p>
            </div>
          </div>
          <div className="heatmap-grid">
            <div />
            <>
              {["बस्तर", "कांकेर", "सरगुजा", "रायपुर", "दुर्ग", "कोरबा"].map((item) => (
                <b key={item}>{tr(item)}</b>
              ))}
            </>
            {["PMMSY", "पोल्ट्री", "PMFBY", "वन धन", "PMEGP"].map((scheme, row) => (
              <Fragment key={scheme}>
                <strong key={`${scheme}-label`}>{tr(scheme)}</strong>
                {[0, 1, 2, 3, 4, 5].map((col) => {
                  const value = 12 + ((row * 7 + col * 5) % 34)
                  return (
                    <span
                      key={`${scheme}-${col}`}
                      className={value > 34 ? "high" : value > 22 ? "medium" : "low"}
                    >
                      {value}
                    </span>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="card financial-support">
          <div className="card-head">
            <div>
              <h3>{tr("वित्तीय सहायता")}</h3>
              <p>{tr("राशि और लाभार्थी")}</p>
            </div>
          </div>
          {[
            ["CIF", "₹214 Cr", "42,680"],
            ["CEF", "₹96 Cr", "18,420"],
            ["बैंक लिंकेज", "₹486 Cr", "72,840"],
            ["उद्यम निधि", "₹46 Cr", "8,760"],
          ].map(([name, amount, count]) => (
            <div key={name}>
              <span>
                <Icon name="scheme" size={15} />
              </span>
              <strong>{tr(name)}</strong>
              <b>{tr(amount)}</b>
              <small>
                {count} {tr("लाभार्थी")}
              </small>
            </div>
          ))}
        </div>
      </section>
      <StateCompliance />
    </div>
  )
}
