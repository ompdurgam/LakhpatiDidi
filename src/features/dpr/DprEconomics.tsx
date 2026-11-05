import { Icon } from "@/components/ui/Icon"

export function DprEconomics() {
  return (
    <div className="dpr-economics">
      <div className="economics-grid">
        <div>
          <span>वर्तमान वार्षिक आय</span>
          <strong>₹78,500</strong>
        </div>
        <div>
          <span>अपेक्षित अतिरिक्त आय</span>
          <strong>+ ₹37,500</strong>
        </div>
        <div className="goal">
          <span>परियोजना के बाद</span>
          <strong>₹1,16,000</strong>
          <small>लखपति लक्ष्य हासिल</small>
        </div>
        <div>
          <span>ब्रेक-ईवन</span>
          <strong>18 माह</strong>
        </div>
      </div>
      <div className="assumptions-table">
        <h4>परियोजना मान्यताएँ</h4>
        <div>
          <span>वार्षिक उत्पादन</span>
          <strong>1,800 किग्रा/वर्ष</strong>
        </div>
        <div>
          <span>औसत बिक्री दर</span>
          <strong>₹120/किग्रा</strong>
        </div>
        <div>
          <span>कुल बिक्री आय</span>
          <strong>₹2,16,000</strong>
        </div>
        <div>
          <span>संचालन लागत</span>
          <strong>₹1,78,500</strong>
        </div>
        <div className="net">
          <span>अनुमानित शुद्ध अतिरिक्त आय</span>
          <strong>₹37,500/वर्ष</strong>
        </div>
      </div>
      <div className="emi-line">
        <span>
          <Icon name="building" size={16} />
        </span>
        <div>
          <strong>ऋण पुनर्भुगतान</strong>
          <small>₹36,000 ऋण • 36 माह</small>
        </div>
        <b>~₹1,150/माह</b>
      </div>
      <div className="before-after-income">
        <div>
          <span>पहले</span>
          <strong>₹78,500</strong>
        </div>
        <Icon name="arrow" size={18} />
        <div className="after">
          <span>परियोजना के बाद</span>
          <strong>₹1,16,000</strong>
          <small>लखपति</small>
        </div>
        <i>
          <b />
        </i>
      </div>
    </div>
  )
}
