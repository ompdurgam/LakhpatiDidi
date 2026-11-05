import { Icon } from "@/components/ui/Icon"
import { Kpi } from "@/components/ui/Kpi"

export function MonitoringWorkspace({
  level,
  onNotify,
}: {
  level: "district" | "state"
  onNotify: (message: string) => void
}) {
  const state = level === "state"
  return (
    <div className="page role-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{state ? "SMMU • राज्य मिशन" : "DMMU • जिला मिशन"}</span>
          <h2>{state ? "छत्तीसगढ़ राज्य अवलोकन" : "बस्तर जिला अवलोकन"}</h2>
          <p>{state ? "33 जिले • 146 ब्लॉक" : "7 ब्लॉक • 418 ग्राम पंचायत"} • मई 2026</p>
        </div>
        <button
          className="primary"
          onClick={() =>
            onNotify(state ? "राज्य रिपोर्ट तैयार हुई" : "मासिक रिपोर्ट SMMU को भेजी गई")
          }
        >
          <Icon name="file" size={17} />
          {state ? "राज्य रिपोर्ट" : "SMMU को रिपोर्ट भेजें"}
        </button>
      </div>
      <section className="monitor-kpis">
        <Kpi
          icon="people"
          color="green"
          label="सर्वेक्षित दीदी"
          value={state ? "8,42,610" : "68,426"}
          meta="लक्ष्य का 72%"
          progress={72}
        />
        <Kpi
          icon="trend"
          color="saffron"
          label="PLD चिन्हित"
          value={state ? "3,18,240" : "25,184"}
          meta="+8.4% इस माह"
          trend
        />
        <Kpi
          icon="check"
          color="emerald"
          label="लखपति हासिल"
          value={state ? "94,620" : "7,936"}
          meta="लक्ष्य का 67%"
          progress={67}
        />
        <Kpi
          icon="scheme"
          color="blue"
          label="अभिसरण राशि"
          value={state ? "₹842 Cr" : "₹68.4 Cr"}
          meta="14 विभाग सक्रिय"
        />
      </section>
      <section className="map-grid">
        <div className="card cg-map-card">
          <div className="card-head">
            <div>
              <h3>{state ? "जिला प्रदर्शन मानचित्र" : "ब्लॉक प्रदर्शन मानचित्र"}</h3>
              <p>% PLD परिवार जिन्होंने ₹1 लाख पार किया</p>
            </div>
            <div className="map-legend">
              <i />
              कम <i />
              मध्यम <i />
              उच्च
            </div>
          </div>
          <div className="abstract-map">
            {Array.from({ length: state ? 33 : 7 }).map((_, index) => (
              <button
                key={index}
                className={index % 5 === 0 ? "high" : index % 3 === 0 ? "medium" : "low"}
                title={
                  state
                    ? `जिला ${index + 1}`
                    : ["जगदलपुर", "बकावंड", "लोहंडीगुड़ा", "तोकापाल", "दरभा", "बस्तानार", "बस्तर"][
                        index
                      ]
                }
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="card ranking">
          <div className="card-head">
            <div>
              <h3>{state ? "शीर्ष जिले" : "ब्लॉक रैंकिंग"}</h3>
              <p>लखपति उपलब्धि दर</p>
            </div>
          </div>
          {(state
            ? ["राजनांदगांव", "धमतरी", "बस्तर", "कांकेर", "कोरबा"]
            : ["जगदलपुर", "बकावंड", "तोकापाल", "बस्तर", "दरभा"]
          ).map((x, index) => (
            <div key={x}>
              <b>{index + 1}</b>
              <span>
                {x}
                <small>{82 - index * 6}% सर्वे कवरेज</small>
              </span>
              <strong>{36 - index * 3}.2%</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="monitor-bottom">
        <div className="card convergence-matrix">
          <div className="card-head">
            <div>
              <h3>विभागीय अभिसरण मैट्रिक्स</h3>
              <p>स्वीकृत / लंबित / अतिदेय</p>
            </div>
          </div>
          <div className="matrix-head">
            <span>विभाग</span>
            {["JGD", "BKW", "LHG", "TKP", "DRB"].map((x) => (
              <b key={x}>{x}</b>
            ))}
          </div>
          {["कृषि", "उद्यानिकी", "पशुपालन", "मत्स्य", "वन"].map((x, row) => (
            <div className="matrix-row" key={x}>
              <span>{x}</span>
              {[0, 1, 2, 3, 4].map((col) => (
                <i
                  key={col}
                  className={
                    (row + col) % 4 === 0 ? "gap" : (row + col) % 3 === 0 ? "pending" : "good"
                  }
                >
                  {18 + row * 3 + col}/{4 + col}
                </i>
              ))}
            </div>
          ))}
        </div>
        <div className="card certification">
          <span className="eyebrow">लखपति ग्राम</span>
          <h3>प्रमाणन पाइपलाइन</h3>
          {[
            "C1 आय ऑडिट",
            "C2 50% जाँच",
            "C3 DMMU नामांकन",
            "C4 SMMU सत्यापन",
            "C5 सार्वजनिक सम्मान",
          ].map((x, index) => (
            <div key={x}>
              <i className={index < 2 ? "done" : index === 2 ? "active" : ""}>
                {index < 2 ? "✓" : index + 1}
              </i>
              <span>{x}</span>
              <b>{[18, 12, 7, 4, 2][index]} गाँव</b>
            </div>
          ))}
          <button
            className="secondary"
            onClick={() => onNotify("प्रमाण पत्र पूर्वावलोकन खोला गया")}
          >
            प्रमाण पत्र देखें
          </button>
        </div>
      </section>
    </div>
  )
}
