import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { CertificateModal } from "./CertificateModal"

/** State compliance grid and Lakhpati Gram certification kanban. */
export function StateCompliance() {
  const tr = useTr()
  const [certificate, setCertificate] = useState<string | null>(null)
  const stages = [
    ["C1 आय ऑडिट", ["बड़ांजी", "नानगुर", "बेलर"]],
    ["C2 50% जाँच", ["धुरगुड़ा", "चित्रकोट"]],
    ["C3 DMMU नामांकन", ["आड़ावाल", "कुम्हरावंड"]],
    ["C4 SMMU सत्यापन", ["भानपुरी"]],
    ["C5 सार्वजनिक सम्मान", ["मड़पाल"]],
  ]
  return (
    <>
      <section className="state-compliance-grid">
        <div className="card crp-mapping">
          <div className="card-head">
            <div>
              <h3>{tr("CRP मैपिंग")}</h3>
              <p>{tr("प्रशिक्षण और PLD जुड़ाव")}</p>
            </div>
          </div>
          <div className="crp-big-stats">
            <div>
              <strong>12,486</strong>
              <span>{tr("प्रशिक्षित CRP")}</span>
            </div>
            <div>
              <strong>82%</strong>
              <span>{tr("PLD से जुड़े")}</span>
            </div>
          </div>
          <i>
            <b style={{ width: "82%" }} />
          </i>
          <p>{tr("शेष 57,280 PLD को CRP मैपिंग आवश्यक")}</p>
        </div>
        <div className="card reporting-compliance">
          <div className="card-head">
            <div>
              <h3>{tr("जिला रिपोर्टिंग अनुपालन")}</h3>
              <p>{tr("नवंबर 2026")}</p>
            </div>
          </div>
          <div className="compliance-donut">
            <span>
              33<small>{tr("जिले")}</small>
            </span>
          </div>
          <div>
            <p>
              <i className="on-time" />
              {tr("समय पर")} <strong>27</strong>
            </p>
            <p>
              <i className="late" />
              {tr("देर")} <strong>6</strong>
            </p>
          </div>
        </div>
      </section>
      <section className="card certification-kanban">
        <div className="card-head">
          <div>
            <h3>{tr("लखपति ग्राम प्रमाणन कानबान")}</h3>
            <p>{tr("C1 आय ऑडिट से C5 सार्वजनिक सम्मान तक")}</p>
          </div>
          <button className="secondary" onClick={() => setCertificate("मड़पाल")}>
            <Icon name="file" size={14} /> {tr("प्रमाण पत्र पूर्वावलोकन")}
          </button>
        </div>
        <div className="kanban-columns">
          {stages.map(([stage, villages], stageIndex) => (
            <div key={String(stage)}>
              <h4>
                {tr(String(stage))}
                <span>{(villages as string[]).length}</span>
              </h4>
              {(villages as string[]).map((village, index) => (
                <button key={village} onClick={() => stageIndex === 4 && setCertificate(village)}>
                  <strong>{tr(village)}</strong>
                  <small>
                    {tr(["बस्तर", "कांकेर", "धमतरी"][index % 3])} • {52 + stageIndex * 8 + index}%
                  </small>
                  <span
                    className={`status ${
                      stageIndex === 4 ? "green" : stageIndex > 2 ? "blue" : "amber"
                    }`}
                  >
                    {stageIndex === 4 ? tr("प्रमाणित") : tr("प्रगति पर")}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
      {certificate && (
        <CertificateModal village={certificate} onClose={() => setCertificate(null)} />
      )}
    </>
  )
}
