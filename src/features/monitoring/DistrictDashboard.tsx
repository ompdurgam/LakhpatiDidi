import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { Kpi } from "@/components/ui/Kpi"

import { blockNames } from "./districtData"
import { DistrictReports } from "./DistrictReports"

export function DistrictWorkspace({ onNotify }: { onNotify: (message: string) => void }) {
  const [metric, setMetric] = useState("लखपति %")
  return (
    <div className="page role-page district-workspace">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">DMMU • जिला मिशन</span>
          <h2>बस्तर जिला अवलोकन</h2>
          <p>7 ब्लॉक • 418 ग्राम पंचायत • नवंबर 2026</p>
        </div>
        <button className="primary" onClick={() => onNotify("नवंबर जिला रिपोर्ट SMMU को भेजी गई")}>
          <Icon name="file" size={17} /> SMMU को रिपोर्ट भेजें
        </button>
      </div>
      <section className="monitor-kpis">
        <Kpi
          icon="people"
          color="green"
          label="सर्वेक्षित दीदी"
          value="68,426"
          meta="लक्ष्य का 72%"
          progress={72}
        />
        <Kpi
          icon="trend"
          color="saffron"
          label="PLD चिन्हित"
          value="25,184"
          meta="+8.4% इस माह"
          trend
        />
        <Kpi
          icon="check"
          color="emerald"
          label="लखपति हासिल"
          value="7,936"
          meta="लक्ष्य का 67%"
          progress={67}
        />
        <Kpi
          icon="scheme"
          color="blue"
          label="अभिसरण राशि"
          value="₹68.4 Cr"
          meta="14 विभाग सक्रिय"
        />
      </section>
      <section className="map-grid district-map-grid">
        <div className="card cg-map-card">
          <div className="card-head">
            <div>
              <h3>ब्लॉक प्रदर्शन मानचित्र</h3>
              <p>{metric} के अनुसार रंग</p>
            </div>
            <div className="map-metric-toggle">
              {["सर्वे %", "लखपति %", "अतिदेय"].map((item) => (
                <button
                  key={item}
                  className={metric === item ? "active" : ""}
                  onClick={() => setMetric(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="abstract-map district-map">
            {blockNames.map((name, index) => (
              <button
                key={name}
                className={
                  (metric === "अतिदेय" ? index % 3 === 0 : index % 4 === 0)
                    ? "high"
                    : index % 3 === 0
                      ? "medium"
                      : "low"
                }
                title={name}
              >
                <span>{index + 1}</span>
                <small>{name}</small>
              </button>
            ))}
          </div>
          <div className="map-legend">
            <i />
            कम <i />
            मध्यम <i />
            उच्च
          </div>
        </div>
        <div className="card ranking">
          <div className="card-head">
            <div>
              <h3>ब्लॉक रैंकिंग</h3>
              <p>लखपति उपलब्धि दर</p>
            </div>
          </div>
          {blockNames.slice(0, 5).map((name, index) => (
            <div key={name}>
              <b>{index + 1}</b>
              <span>
                {name}
                <small>{82 - index * 6}% सर्वे कवरेज</small>
              </span>
              <strong>{36 - index * 3}.2%</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="card district-matrix">
        <div className="card-head">
          <div>
            <h3>विभागीय अभिसरण मैट्रिक्स</h3>
            <p>विभाग × ब्लॉक</p>
          </div>
          <div className="matrix-triple-legend">
            <span>
              <i className="sanctioned" />
              स्वीकृत
            </span>
            <span>
              <i className="pending" />
              लंबित
            </span>
            <span>
              <i className="overdue" />
              अतिदेय
            </span>
          </div>
        </div>
        <div className="district-matrix-scroll">
          <div className="district-matrix-head">
            <span>विभाग</span>
            {blockNames.slice(0, 5).map((name) => (
              <b key={name}>{name}</b>
            ))}
          </div>
          {["कृषि", "उद्यानिकी", "पशुपालन", "मत्स्य", "वन"].map((dept, row) => (
            <div className="district-matrix-row" key={dept}>
              <strong>{dept}</strong>
              {[0, 1, 2, 3, 4].map((col) => (
                <div key={col}>
                  <b>{18 + row * 4 + col}</b>
                  <em>{4 + col}</em>
                  <small className={row + col > 5 ? "red" : ""}>{(row + col) % 5}</small>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="district-insights-grid">
        <div className="card candidate-villages">
          <div className="card-head">
            <div>
              <h3>लखपति ग्राम संभावित गाँव</h3>
              <p>50% से अधिक PLD ने ₹1 लाख पार किया</p>
            </div>
          </div>
          <div className="candidate-table">
            <div className="head">
              <span>गाँव</span>
              <b>PLD</b>
              <b>₹1L पार</b>
              <span />
            </div>
            {[
              ["बड़ांजी", 184, 68],
              ["नानगुर", 142, 64],
              ["धुरगुड़ा", 126, 59],
              ["आड़ावाल", 118, 55],
              ["कुम्हरावंड", 104, 52],
            ].map(([name, pld, pct]) => (
              <div key={String(name)}>
                <strong>{name}</strong>
                <b>{pld}</b>
                <b>{pct}%</b>
                <button onClick={() => onNotify(`${name} में आय ऑडिट शुरू हुआ`)}>
                  आय ऑडिट शुरू करें
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="card collector-escalations">
          <div className="card-head">
            <div>
              <h3>कलेक्टर स्तर एस्केलेशन</h3>
              <p>7 दिन में प्रतिक्रिया अपेक्षित</p>
            </div>
            <span className="count-badge">4</span>
          </div>
          {[
            ["APP-260142", "मत्स्य", "18 दिन", "तालाब पट्टा लंबित"],
            ["DEM-JGD-1123", "वन", "12 दिन", "बजट मैपिंग लंबित"],
            ["APP-260229", "पंचायत", "16 दिन", "PMAY स्वीकृति लंबित"],
            ["APP-260204", "श्रम", "17 दिन", "अधिकारी प्रतिक्रिया नहीं"],
          ].map((row) => (
            <div key={row[0]}>
              <span className="gap-icon red">
                <Icon name="alert" size={13} />
              </span>
              <p>
                <strong>
                  {row[0]} • {row[1]}
                </strong>
                <small>{row[3]}</small>
              </p>
              <b>{row[2]}</b>
            </div>
          ))}
        </div>
      </section>
      <DistrictReports onNotify={onNotify} />
    </div>
  )
}
