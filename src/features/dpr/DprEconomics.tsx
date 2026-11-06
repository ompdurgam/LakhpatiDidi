import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function DprEconomics() {
  const tr = useTr()
  return (
    <div className="dpr-economics">
      <div className="economics-grid">
        <div>
          <span>{tr("वर्तमान वार्षिक आय")}</span>
          <strong>₹78,500</strong>
        </div>
        <div>
          <span>{tr("अपेक्षित अतिरिक्त आय")}</span>
          <strong>+ ₹37,500</strong>
        </div>
        <div className="goal">
          <span>{tr("परियोजना के बाद")}</span>
          <strong>₹1,16,000</strong>
          <small>{tr("लखपति लक्ष्य हासिल")}</small>
        </div>
        <div>
          <span>{tr("ब्रेक-ईवन")}</span>
          <strong>{tr("18 माह")}</strong>
        </div>
      </div>
      <div className="assumptions-table">
        <h4>{tr("परियोजना मान्यताएँ")}</h4>
        <div>
          <span>{tr("वार्षिक उत्पादन")}</span>
          <strong>{tr("1,800 किग्रा/वर्ष")}</strong>
        </div>
        <div>
          <span>{tr("औसत बिक्री दर")}</span>
          <strong>{tr("₹120/किग्रा")}</strong>
        </div>
        <div>
          <span>{tr("कुल बिक्री आय")}</span>
          <strong>₹2,16,000</strong>
        </div>
        <div>
          <span>{tr("संचालन लागत")}</span>
          <strong>₹1,78,500</strong>
        </div>
        <div className="net">
          <span>{tr("अनुमानित शुद्ध अतिरिक्त आय")}</span>
          <strong>{tr("₹37,500/वर्ष")}</strong>
        </div>
      </div>
      <div className="emi-line">
        <span>
          <Icon name="building" size={16} />
        </span>
        <div>
          <strong>{tr("ऋण पुनर्भुगतान")}</strong>
          <small>{tr("₹36,000 ऋण • 36 माह")}</small>
        </div>
        <b>{tr("~₹1,150/माह")}</b>
      </div>
      <div className="before-after-income">
        <div>
          <span>{tr("पहले")}</span>
          <strong>₹78,500</strong>
        </div>
        <Icon name="arrow" size={18} />
        <div className="after">
          <span>{tr("परियोजना के बाद")}</span>
          <strong>₹1,16,000</strong>
          <small>{tr("लखपति")}</small>
        </div>
        <i>
          <b />
        </i>
      </div>
    </div>
  )
}
