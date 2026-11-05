import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { Icon } from "@/components/ui/Icon"
import { AdminModule } from "@/features/admin/AdminModule"

export function AdminWorkspace({ onNotify }: { onNotify: (message: string) => void }) {
  const { module = "schemes" } = useParams()
  const navigate = useNavigate()
  // URL /admin/survey ↔ internal "forms" tab
  const activeAdmin = module === "survey" ? "forms" : module
  const setActiveAdmin = (key: string) => navigate(`/admin/${key === "forms" ? "survey" : key}`)
  const [ruleResult, setRuleResult] = useState<null | boolean>(null)
  const adminTabs = [
    ["schemes", "योजना मास्टर"],
    ["mapping", "विभाग मैपिंग"],
    ["users", "यूज़र व भूमिकाएँ"],
    ["geography", "भूगोल"],
    ["forms", "सर्वे सेटिंग"],
    ["village", "ग्राम प्रोफाइल"],
    ["audit", "ऑडिट लॉग"],
  ]
  return (
    <div className="page role-page admin-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">सिस्टम प्रशासन</span>
          <h2>पोर्टल कॉन्फ़िगरेशन</h2>
          <p>योजनाएँ, पात्रता नियम, उपयोगकर्ता और सर्वे फॉर्म प्रबंधित करें</p>
        </div>
        <button className="primary" onClick={() => onNotify("बदलाव प्रकाशित किए गए")}>
          <Icon name="check" size={17} /> बदलाव प्रकाशित करें
        </button>
      </div>
      <div className="admin-tabs">
        {adminTabs.map(([key, label]) => (
          <button
            key={key}
            className={activeAdmin === key ? "active" : ""}
            onClick={() => setActiveAdmin(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {activeAdmin === "schemes" ? (
        <div className="admin-grid">
          <section className="card scheme-master">
            <div className="card-head">
              <div>
                <h3>योजनाएँ</h3>
                <p>148 सक्रिय • 14 विभाग</p>
              </div>
              <button className="primary">
                <Icon name="plus" size={15} /> नई योजना
              </button>
            </div>
            <label className="admin-search">
              <Icon name="search" size={16} />
              <input placeholder="योजना खोजें..." />
            </label>
            {[
              "PMMSY",
              "बैकयार्ड पोल्ट्री",
              "NHM फल रोपण",
              "PMEGP",
              "वन धन / VDVK",
              "CG Homestay Policy",
            ].map((x, index) => (
              <button key={x} className={index === 0 ? "active" : ""}>
                <span className="scheme-glyph">
                  <Icon name="scheme" size={17} />
                </span>
                <div>
                  <strong>{x}</strong>
                  <small>
                    {["मत्स्य", "पशुपालन", "उद्यानिकी", "उद्योग", "वन", "पर्यटन"][index]} विभाग
                  </small>
                </div>
                <span className="status green">सक्रिय</span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </section>
          <section className="card scheme-editor">
            <div className="card-head">
              <div>
                <h3>PMMSY संपादित करें</h3>
                <p>अंतिम अपडेट 18 मई 2026</p>
              </div>
              <span className="toggle-on">
                <i /> सक्रिय
              </span>
            </div>
            <div className="editor-fields">
              <label>
                <span>योजना नाम (हिंदी)</span>
                <input defaultValue="प्रधानमंत्री मत्स्य संपदा योजना" />
              </label>
              <label>
                <span>Scheme name (English)</span>
                <input defaultValue="Pradhan Mantri Matsya Sampada Yojana" />
              </label>
              <label>
                <span>विभाग</span>
                <select defaultValue="मत्स्य विभाग">
                  <option>मत्स्य विभाग</option>
                </select>
              </label>
              <label>
                <span>SLA दिन</span>
                <input defaultValue="15" />
              </label>
              <label className="full">
                <span>लाभ / सब्सिडी</span>
                <textarea defaultValue="परियोजना लागत का 60% तक; अधिकतम ₹1,20,000" />
              </label>
              <label className="full">
                <span>उद्देश्य</span>
                <textarea defaultValue="ग्रामीण मत्स्य पालक परिवारों की आय बढ़ाने हेतु तालाब निर्माण, उन्नयन और मत्स्य इनपुट सहायता।" />
              </label>
              <div className="editor-chip-field full">
                <span>लाभार्थी वर्ग</span>
                <div>
                  {["ST", "SC", "OBC", "महिला SHG", "FRA अधिकारधारी"].map((item) => (
                    <button className="selected" key={item}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="editor-chip-field full">
                <span>आवश्यक दस्तावेज़</span>
                <div>
                  {[
                    "आधार",
                    "बैंक पासबुक",
                    "फोटो",
                    "तालाब पट्टा",
                    "जाति प्रमाण",
                    "SHG प्रस्ताव",
                  ].map((item) => (
                    <button className="selected" key={item}>
                      {item}
                      <Icon name="close" size={10} />
                    </button>
                  ))}
                  <button>
                    <Icon name="plus" size={11} /> जोड़ें
                  </button>
                </div>
              </div>
              <label className="full">
                <span>कहाँ / कैसे आवेदन करें</span>
                <textarea defaultValue="सहायक संचालक मत्स्य, संबंधित ब्लॉक कार्यालय। DPR और दस्तावेज़ पोर्टल से विभाग को भेजे जाएँ।" />
              </label>
              <div className="editor-chip-field full">
                <span>DPR टेम्पलेट फ़ील्ड</span>
                <div>
                  {[
                    "तालाब क्षेत्रफल",
                    "इकाई लागत",
                    "फिंगरलिंग संख्या",
                    "उत्पादन अनुमान",
                    "बाजार दर",
                    "संचालन लागत",
                  ].map((item) => (
                    <button className="selected" key={item}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="subsidy-by-class full">
                <span>वर्ग अनुसार अनुदान %</span>
                <div>
                  <label>
                    SC/ST/महिला
                    <input defaultValue="60%" />
                  </label>
                  <label>
                    अन्य
                    <input defaultValue="40%" />
                  </label>
                </div>
              </div>
            </div>
            <div className="rule-builder">
              <div>
                <h4>पात्रता नियम</h4>
                <span>1 सक्रिय शर्त</span>
              </div>
              <div className="rule">
                <span>survey.fisheries.pond_area</span>
                <b>≥</b>
                <span>0.25 acre</span>
                <button>×</button>
              </div>
              <button className="test-rule-button" onClick={() => setRuleResult(true)}>
                <Icon name="trend" size={14} /> नमूना परिवार पर नियम जाँचें
              </button>
              {ruleResult !== null && (
                <div className={`rule-test-result ${ruleResult ? "matched" : "not-matched"}`}>
                  <Icon name={ruleResult ? "check" : "close"} size={15} />
                  <div>
                    <strong>{ruleResult ? "नियम मिला" : "नियम नहीं मिला"}</strong>
                    <span>सुनीता कश्यप • pond_area 0.50 acre ≥ 0.25 acre</span>
                  </div>
                  <button onClick={() => setRuleResult(false)}>Not-matched देखें</button>
                </div>
              )}
            </div>
            <div className="editor-footer">
              <button className="secondary">पूर्वावलोकन</button>
              <button className="primary" onClick={() => onNotify("योजना मास्टर सुरक्षित हुआ")}>
                योजना सुरक्षित करें
              </button>
            </div>
          </section>
        </div>
      ) : (
        <AdminModule active={activeAdmin} onNotify={onNotify} />
      )}
    </div>
  )
}
