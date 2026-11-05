import { Icon } from "@/components/ui/Icon"

export function CertificateModal({ village, onClose }: { village: string; onClose: () => void }) {
  return (
    <>
      <div className="scheme-consent-scrim" onClick={onClose} />
      <div className="certificate-modal">
        <button onClick={onClose}>
          <Icon name="close" size={17} />
        </button>
        <div className="certificate-sheet">
          <span>छत्तीसगढ़ राज्य ग्रामीण आजीविका मिशन</span>
          <small>महिला लखपति कार्यक्रम</small>
          <h2>लखपति ग्राम</h2>
          <p>प्रमाण पत्र</p>
          <div>यह प्रमाणित किया जाता है कि</div>
          <strong>{village} ग्राम</strong>
          <p>
            में 50% से अधिक संभावित लखपति दीदी परिवारों ने सत्यापित वार्षिक घरेलू आय ₹1,00,000 से
            अधिक प्राप्त की है।
          </p>
          <em>नवंबर 2026 • छत्तीसगढ़</em>
          <footer>
            <span>मिशन संचालक</span>
            <span>जिला मिशन प्रबंधक</span>
          </footer>
        </div>
        <button className="primary">
          <Icon name="download" size={15} /> प्रमाण पत्र डाउनलोड
        </button>
      </div>
    </>
  )
}
