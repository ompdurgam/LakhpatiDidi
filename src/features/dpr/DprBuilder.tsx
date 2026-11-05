import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { CostTable } from "@/features/dpr/CostTable"
import { DprEconomics } from "@/features/dpr/DprEconomics"
import { DprPdfPreview } from "@/features/dpr/DprPdfPreview"
import { DprSuccess } from "@/features/dpr/DprSuccess"
import { DprVerification } from "@/features/dpr/DprVerification"

export function DprBuilder({
  compact = false,
  onNotify,
  onTrack,
}: {
  compact?: boolean
  onNotify: (message: string) => void
  onTrack?: () => void
}) {
  const [step, setStep] = useState(1)
  const [sent, setSent] = useState(false)
  const steps = [
    "लाभार्थी",
    "परियोजना",
    "लागत",
    "अर्थशास्त्र",
    "दस्तावेज़",
    "सत्यापन",
    "पूर्वावलोकन",
  ]
  if (sent)
    return (
      <DprSuccess
        compact={compact}
        onTrack={() => (onTrack ? onTrack() : onNotify("ट्रैकिंग पेज खोला गया"))}
        onNext={() => {
          setSent(false)
          setStep(1)
          onNotify("अगली चयनित योजना का DPR खोला गया")
        }}
      />
    )
  return (
    <div className={compact ? "phone-content compact-dpr" : "dpr-workspace"}>
      <div className="dpr-title">
        <div>
          <span className="eyebrow">DPR-2026-00142</span>
          <h2>PMMSY तालाब मत्स्य इकाई</h2>
          <p>सुनीता कश्यप • आवेदन स्वतः भरा गया</p>
        </div>
        {!compact && <span className="status amber">ड्राफ्ट</span>}
      </div>
      <div className="dpr-steps">
        {steps.map((name, index) => (
          <button
            key={name}
            className={index + 1 === step ? "active" : index + 1 < step ? "done" : ""}
            onClick={() => setStep(index + 1)}
          >
            <i>{index + 1 < step ? "✓" : index + 1}</i>
            <span>{name}</span>
          </button>
        ))}
      </div>
      <div className="dpr-panel">
        <h3>
          {step}. {steps[step - 1]}
        </h3>
        {step === 1 && (
          <div className="dpr-fields">
            {[
              ["लाभार्थी नाम", "सुनीता कश्यप"],
              ["पिता / पति", "राम कश्यप"],
              ["आधार", "XXXX-XXXX-4831"],
              ["मोबाइल", "98••• ••412"],
              ["LokOS ID", "LK-BST-440921"],
              ["बैंक खाता", "•••• 4831"],
              ["बैंक नाम", "SBI जगदलपुर"],
              ["IFSC", "SBIN0001234"],
              ["SHG / VO", "माँ दंतेश्वरी / शक्ति VO"],
              ["सामाजिक वर्ग", "ST"],
              ["विशेष समुदाय", "FRA अधिकारधारी"],
              ["GPS", "19.0748, 82.0080"],
              ["पूरा पता", "बड़ांजी, GP बड़ांजी, जगदलपुर, बस्तर"],
            ].map(([a, b]) => (
              <label key={a} className={a === "पूरा पता" ? "full-field" : ""}>
                <span>
                  {a} <small>सर्वे से</small>
                </span>
                <div className="dpr-locked">
                  <span>{b}</span>
                  <button onClick={() => onNotify(`${a} के लिए सुधार अनुरोध भेजा गया`)}>
                    सुधार अनुरोध
                  </button>
                </div>
              </label>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="dpr-fields">
            {[
              ["योजना", "PMMSY"],
              ["गतिविधि / इकाई", "0.5 एकड़ मत्स्य तालाब"],
              ["मांग क्लस्टर", "मत्स्य"],
              ["उप-घटक", "तालाब निर्माण/उन्नयन"],
              ["स्थान", "बड़ांजी, जगदलपुर"],
              ["मौजूदा संपत्ति", "निजी तालाब"],
              ["VPRP संदर्भ", "VPRP/2026/184"],
              ["BLCC कार्रवाई संदर्भ", "BLCC/JGD/11-2026/07"],
              ["GPDP संदर्भ", "GPDP प्रविष्टि आवश्यक – SOP चरण 3"],
            ].map(([a, b]) => (
              <label key={a}>
                <span>{a}</span>
                <div className={a === "GPDP संदर्भ" ? "field-warning" : ""}>{b}</div>
              </label>
            ))}
          </div>
        )}
        {step === 3 && <CostTable />}
        {step === 4 && <DprEconomics />}
        {step === 5 && (
          <div className="document-grid">
            {[
              "आधार कार्ड",
              "बैंक पासबुक",
              "लाभार्थी फोटो",
              "भूमि रिकॉर्ड B1-P2",
              "जाति प्रमाण पत्र",
              "SHG प्रस्ताव",
              "कोटेशन",
              "तालाब पट्टा/स्वामित्व प्रमाण",
            ].map((x, index) => (
              <button key={x} className={index >= 6 ? "missing" : ""}>
                <span className="document-status">
                  <Icon name={index >= 6 ? "alert" : "check"} size={15} />
                </span>
                <span>{x}</span>
                <span className="document-actions">
                  <i>
                    <Icon name="camera" size={14} />
                  </i>
                  <i>
                    <Icon name="upload" size={14} />
                  </i>
                </span>
                <small>{index >= 6 ? "दस्तावेज़ जोड़ें" : "सत्यापित"}</small>
              </button>
            ))}
          </div>
        )}
        {step === 6 && <DprVerification />}
        {step === 7 && <DprPdfPreview />}
      </div>
      <div className="dpr-actions">
        <button className="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>
          पीछे
        </button>
        <button
          className="primary"
          onClick={() => {
            if (step < 7) setStep(step + 1)
            else {
              setSent(true)
              onNotify("आवेदन APP-260142 मत्स्य विभाग को भेजा गया")
            }
          }}
        >
          {step < 7 ? "सहेजें और आगे" : "विभाग को भेजें"} <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  )
}
