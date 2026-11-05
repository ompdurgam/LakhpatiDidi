import { Icon } from "@/components/ui/Icon"

import { blockNames } from "./districtData"

/** District charts and report tiles (lower half of the district dashboard). */
export function DistrictReports({ onNotify }: { onNotify: (message: string) => void }) {
  return (
    <>
      <section className="district-charts-grid">
        <div className="card sector-donut-card">
          <div className="card-head">
            <div>
              <h3>सेक्टर वितरण</h3>
              <p>PLD आजीविका स्रोत</p>
            </div>
          </div>
          <div className="district-donut-wrap">
            <div className="sector-donut">
              <span>
                25,184<small>PLD</small>
              </span>
            </div>
            <div className="sector-legend">
              {[
                "कृषि 28%",
                "उद्यानिकी 12%",
                "पशुधन 16%",
                "मत्स्य 8%",
                "वन उपज 14%",
                "गैर-कृषि 9%",
                "पर्यटन 4%",
                "मजदूरी 9%",
              ].map((item, index) => (
                <span key={item}>
                  <i
                    style={{
                      background: [
                        "#4b875f",
                        "#85a965",
                        "#dca63b",
                        "#5b8fa9",
                        "#8a7058",
                        "#b77a59",
                        "#8d7ab5",
                        "#718a79",
                      ][index],
                    }}
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="card income-band-chart">
          <div className="card-head">
            <div>
              <h3>आय बैंड</h3>
              <p>PLD परिवारों का वार्षिक आय स्तर</p>
            </div>
          </div>
          {[
            ["<50K", 5240, 42],
            ["50–80K", 8496, 68],
            ["80K–1L", 3512, 28],
            ["1L+", 7936, 64],
          ].map(([band, count, pct], index) => (
            <div key={String(band)}>
              <span>{band}</span>
              <i>
                <b className={`band-${index}`} style={{ width: `${pct}%` }} />
              </i>
              <strong>{Number(count).toLocaleString("en-IN")}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="district-report-grid">
        <div className="card block-report-status">
          <div className="card-head">
            <div>
              <h3>ब्लॉक रिपोर्ट स्थिति</h3>
              <p>नवंबर मासिक रिपोर्ट</p>
            </div>
          </div>
          {blockNames.map((name, index) => (
            <div key={name}>
              <strong>{name}</strong>
              <span>{index < 5 ? "08 दिस. 2026" : "अभी जमा नहीं"}</span>
              <em className={`status ${index < 5 ? "green" : "red"}`}>
                {index < 5 ? "समय पर" : "देर"}
              </em>
            </div>
          ))}
        </div>
        <div className="card district-due-card">
          <span>
            <Icon name="clock" size={22} />
          </span>
          <div>
            <small>SMMU रिपोर्ट देय</small>
            <strong>10 दिसंबर</strong>
            <p>5/7 ब्लॉक रिपोर्ट प्राप्त</p>
          </div>
          <em className="status amber">ड्राफ्ट</em>
          <button
            className="primary"
            onClick={() => onNotify("जिला रिपोर्ट समीक्षा के लिए तैयार है")}
          >
            रिपोर्ट तैयार करें
          </button>
        </div>
        <div className="card certification district-certification">
          <span className="eyebrow">लखपति ग्राम</span>
          <h3>प्रमाणन पाइपलाइन</h3>
          {[
            "C1 आय ऑडिट",
            "C2 50% जाँच",
            "C3 DMMU नामांकन",
            "C4 SMMU सत्यापन",
            "C5 सार्वजनिक सम्मान",
          ].map((item, index) => (
            <div key={item}>
              <i className={index < 2 ? "done" : index === 2 ? "active" : ""}>
                {index < 2 ? "✓" : index + 1}
              </i>
              <span>{item}</span>
              <b>{[18, 12, 7, 4, 2][index]} गाँव</b>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
