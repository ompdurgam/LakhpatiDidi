export function DprPdfPreview() {
  const costs = [
    ["तालाब तैयारी", "₹30,000"],
    ["फिंगरलिंग बीज", "₹25,000"],
    ["मछली आहार", "₹40,000"],
    ["जाल और उपकरण", "₹25,000"],
  ]
  const docs = [
    "आधार",
    "बैंक पासबुक",
    "लाभार्थी फोटो",
    "तालाब स्वामित्व",
    "जाति प्रमाण",
    "SHG प्रस्ताव",
  ]
  return (
    <div className="pdf-preview detailed-pdf">
      <div className="pdf-sheet">
        <div className="pdf-head">
          <span>महिला लखपति कार्यक्रम – CGSRLM</span>
          <strong>विस्तृत परियोजना प्रतिवेदन</strong>
          <small>प्रधानमंत्री मत्स्य संपदा योजना</small>
        </div>
        <div className="pdf-meta">
          <div>
            <span>आवेदन संख्या</span>
            <strong>APP-260142</strong>
          </div>
          <div>
            <span>दिनांक</span>
            <strong>05 नवंबर 2026</strong>
          </div>
        </div>
        <div className="pdf-recipient">
          <strong>प्राप्तकर्ता:</strong> सहायक संचालक मत्स्य, जगदलपुर
        </div>
        <div className="pdf-person">
          <div className="didi-photo">SK</div>
          <p>
            <b>सुनीता कश्यप</b>
            <br />
            HH-BST-JGD-000123
            <br />
            ग्राम बड़ांजी, GP बड़ांजी, जगदलपुर, बस्तर
          </p>
          <span className="qr">▦</span>
        </div>
        <h4>परियोजना: 0.5 एकड़ तालाब मत्स्य इकाई</h4>
        <div className="pdf-cost-table">
          <div>
            <b>लागत मद</b>
            <b>राशि</b>
          </div>
          {costs.map((row) => (
            <div key={row[0]}>
              <span>{row[0]}</span>
              <strong>{row[1]}</strong>
            </div>
          ))}
          <div className="total">
            <b>कुल परियोजना लागत</b>
            <b>₹1,20,000</b>
          </div>
        </div>
        <p className="pdf-finance">सब्सिडी ₹72,000 • बैंक ऋण ₹36,000 • स्वयं अंश ₹12,000</p>
        <div className="pdf-income-projection">
          <span>
            वर्तमान आय <b>₹78,500</b>
          </span>
          <i>→</i>
          <span>
            परियोजना के बाद <b>₹1,16,000</b>
          </span>
          <strong>+₹37,500/वर्ष</strong>
        </div>
        <div className="pdf-checklist">
          <h4>दस्तावेज़ चेकलिस्ट</h4>
          {docs.map((doc) => (
            <span key={doc}>✓ {doc}</span>
          ))}
        </div>
        <p className="pdf-declaration">
          <b>घोषणा:</b> मैं प्रमाणित करती हूँ कि इस DPR में दी गई जानकारी सही है। परियोजना लागत,
          बैंक ऋण, स्वयं अंश और विभागीय शर्तें मुझे समझाई गई हैं और मैं परियोजना संचालन के लिए सहमत
          हूँ।
        </p>
        <div className="signature-boxes">
          {["लाभार्थी अंगूठा", "CRP", "CLF", "BMMU"].map((item) => (
            <div key={item}>
              <span />
              <strong>{item}</strong>
              <small>दिनांक / हस्ताक्षर</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
