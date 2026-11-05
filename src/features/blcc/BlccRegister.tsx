import { useState } from "react"

import { Icon } from "@/components/ui/Icon"

export function Blcc({ onNotify }: { onNotify: (s: string) => void }) {
  const [meetingMode, setMeetingMode] = useState(false)
  const [currentItem, setCurrentItem] = useState(0)
  const [showReason, setShowReason] = useState(false)
  const [attendance, setAttendance] = useState(["BDO", "CLF CEO"])
  const demands = [
    [
      "DEM-JGD-1107",
      "मत्स्य",
      "6 SHG / 24 इकाई",
      "₹28,80,000",
      "PMMSY",
      "मत्स्य",
      "आर. सिन्हा",
      "20 नव. 2026",
      "20 दिस. 2026",
      "GPDP/JGD/118",
      "लंबित",
    ],
    [
      "DEM-JGD-1112",
      "पोल्ट्री",
      "12 SHG / 180 इकाई",
      "₹86,40,000",
      "बैकयार्ड पोल्ट्री",
      "पशुपालन",
      "डॉ. सीमा नेताम",
      "22 नव. 2026",
      "22 दिस. 2026",
      "GPDP/JGD/124",
      "प्रगति पर",
    ],
    [
      "DEM-JGD-1118",
      "मशरूम",
      "8 SHG / 96 इकाई",
      "₹24,00,000",
      "NHM",
      "उद्यानिकी",
      "अनिता वर्मा",
      "25 नव. 2026",
      "24 दिस. 2026",
      "GPDP/JGD/131",
      "नया",
    ],
    [
      "DEM-JGD-1123",
      "NTFP",
      "9 SHG / 14 PG",
      "₹18,50,000",
      "वन धन",
      "वन / CGMFP",
      "के. नाग",
      "28 नव. 2026",
      "28 दिस. 2026",
      "GPDP/JGD/138",
      "अतिदेय",
    ],
  ]
  const toggleAttendance = (name: string) =>
    setAttendance(
      attendance.includes(name)
        ? attendance.filter((item) => item !== name)
        : [...attendance, name],
    )
  if (meetingMode) {
    const item = demands[currentItem]
    return (
      <section className="blcc-meeting-mode">
        <div className="meeting-mode-head">
          <div>
            <span className="eyebrow">BLCC बैठक मोड • 19 नवंबर 2026</span>
            <h2>
              लंबित मद {currentItem + 1} / {demands.length}
            </h2>
            <p>एक-एक मांग पर निर्णय दर्ज करें</p>
          </div>
          <button className="secondary" onClick={() => setMeetingMode(false)}>
            <Icon name="close" size={15} /> बैठक बंद करें
          </button>
        </div>
        <div className="meeting-progress">
          <i>
            <b
              style={{
                width: `${((currentItem + 1) / demands.length) * 100}%`,
              }}
            />
          </i>
        </div>
        <div className="meeting-layout">
          <div className="card current-demand">
            <div className="demand-id">
              <span>{item[0]}</span>
              <span className={`status ${item[10] === "अतिदेय" ? "red" : "amber"}`}>
                {item[10]}
              </span>
            </div>
            <h3>{item[1]} क्लस्टर</h3>
            <p>
              {item[2]} • {item[4]}
            </p>
            <dl>
              <div>
                <dt>अनुमानित लागत</dt>
                <dd>{item[3]}</dd>
              </div>
              <div>
                <dt>विभाग</dt>
                <dd>{item[5]}</dd>
              </div>
              <div>
                <dt>नामित अधिकारी</dt>
                <dd>{item[6]}</dd>
              </div>
              <div>
                <dt>स्वीकृति लक्ष्य</dt>
                <dd>{item[7]}</dd>
              </div>
              <div>
                <dt>GPDP संदर्भ</dt>
                <dd>{item[9]}</dd>
              </div>
            </dl>
            {showReason && (
              <label className="delay-reason">
                <span>विलंब का कारण</span>
                <select defaultValue="दस्तावेज़ लंबित">
                  <option>दस्तावेज़ लंबित</option>
                  <option>बजट उपलब्ध नहीं</option>
                  <option>विभागीय जाँच लंबित</option>
                  <option>GPDP प्रविष्टि लंबित</option>
                </select>
                <textarea placeholder="विवरण लिखें..." />
              </label>
            )}
            <div className="meeting-decision-buttons">
              <button
                className="complete"
                onClick={() => {
                  onNotify("मद पूर्ण दर्ज हुई")
                  setCurrentItem(Math.min(currentItem + 1, demands.length - 1))
                  setShowReason(false)
                }}
              >
                <Icon name="check" size={15} /> पूर्ण
              </button>
              <button className="delay" onClick={() => setShowReason(true)}>
                <Icon name="clock" size={15} /> विलंबित
              </button>
              <button
                className="escalate"
                onClick={() => onNotify("मांग DPM स्तर पर एस्केलेट की गई")}
              >
                <Icon name="alert" size={15} /> एस्केलेट
              </button>
            </div>
          </div>
          <aside>
            <div className="card attendance-card">
              <h3>उपस्थिति</h3>
              {["BDO", "विभाग अधिकारी", "CLF CEO"].map((name) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    checked={attendance.includes(name)}
                    onChange={() => toggleAttendance(name)}
                  />
                  <span>{name}</span>
                  <small>{attendance.includes(name) ? "उपस्थित" : "अनुपस्थित"}</small>
                </label>
              ))}
            </div>
            <div className="card previous-decisions">
              <h3>पिछली बैठक के निर्णय</h3>
              {[
                ["BDO", "GPDP सूची 15 नव. तक सत्यापित"],
                ["आर. सिन्हा", "6 मत्स्य स्थलों का निरीक्षण"],
                ["CLF CEO", "SHG प्रस्ताव संकलित करना"],
              ].map(([officer, decision]) => (
                <div key={officer}>
                  <strong>{officer}</strong>
                  <p>{decision}</p>
                  <span className="status green">पूर्ण</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    )
  }
  return (
    <section className="card blcc-card enhanced">
      <div className="meeting-banner">
        <div>
          <span>
            <Icon name="building" />
          </span>
          <div>
            <h3>BLCC बैठक मोड</h3>
            <p>पिछले माह के लंबित मुद्दों पर क्रमवार कार्यवाही करें</p>
          </div>
        </div>
        <button className="primary" onClick={() => setMeetingMode(true)}>
          बैठक शुरू करें <Icon name="arrow" size={17} />
        </button>
      </div>
      <div className="register-head">
        <div>
          <h3>BLCC कार्यवाही रजिस्टर</h3>
          <span>18 खुली मांगें • नवंबर 2026</span>
        </div>
        <button className="primary" onClick={() => onNotify("नई क्लस्टर मांग फॉर्म खोला गया")}>
          <Icon name="plus" size={15} /> नई मांग
        </button>
      </div>
      <div className="blcc-table-scroll">
        <table className="blcc-register-table">
          <thead>
            <tr>
              {[
                "मांग ID",
                "क्लस्टर",
                "SHG/इकाई",
                "अनुमानित लागत ₹",
                "योजना",
                "विभाग",
                "नामित अधिकारी",
                "स्वीकृति लक्ष्य तिथि",
                "डिलीवरी लक्ष्य तिथि",
                "GPDP संदर्भ",
                "स्थिति",
              ].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demands.map((row) => (
              <tr key={row[0]}>
                <td>
                  <b className="app-id">{row[0]}</b>
                </td>
                {row.slice(1, 10).map((cell, index) => (
                  <td key={`${row[0]}-${index}`}>{index === 2 ? <strong>{cell}</strong> : cell}</td>
                ))}
                <td>
                  <span
                    className={`status ${
                      row[10] === "अतिदेय" ? "red" : row[10] === "प्रगति पर" ? "amber" : "blue"
                    }`}
                  >
                    {row[10]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
