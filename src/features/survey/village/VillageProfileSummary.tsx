import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function VillageProfileSummary() {
  const tr = useTr()
  return (
    <>
      <div className="detail-hero">
        <span className="eyebrow">{tr("एक बार प्रति गाँव")}</span>
        <h2>{tr("ग्राम प्रोफ़ाइल – बड़ांजी")}</h2>
        <p>
          {tr(
            "सामुदायिक सुविधाएँ, आजीविका अवसंरचना, ग्राम संस्थाएँ और प्राकृतिक संसाधन क्लस्टर योजना के लिए दर्ज किए जाते हैं।",
          )}
        </p>
      </div>
      <div className="card village-summary-card">
        <div className="village-summary-score">
          <strong>70%</strong>
          <span>{tr("पूर्ण")}</span>
        </div>
        <div>
          <h3>{tr("अभी 23 उत्तर बाकी")}</h3>
          <p>{tr("D3 सुविधाएँ 18/29 • D4 अवसंरचना 22/35 • D5 संस्थाएँ 13/15")}</p>
          <i>
            <b />
          </i>
        </div>
      </div>
      <div className="card village-priorities">
        <h3>{tr("शीर्ष अवसंरचना जरूरतें")}</h3>
        {["1. कोल्ड स्टोरेज", "2. SHG कार्यशेड", "3. धान सुखाने का प्लेटफॉर्म"].map((item) => (
          <p key={item}>
            <Icon name="check" size={14} />
            {tr(item)}
          </p>
        ))}
      </div>
    </>
  )
}
