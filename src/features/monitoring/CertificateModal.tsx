import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function CertificateModal({ village, onClose }: { village: string; onClose: () => void }) {
  const tr = useTr()
  return (
    <>
      <div className="scheme-consent-scrim" onClick={onClose} />
      <div className="certificate-modal">
        <button onClick={onClose}>
          <Icon name="close" size={17} />
        </button>
        <div className="certificate-sheet">
          <span>{tr("छत्तीसगढ़ राज्य ग्रामीण आजीविका मिशन")}</span>
          <small>{tr("महिला लखपति कार्यक्रम")}</small>
          <h2>{tr("लखपति ग्राम")}</h2>
          <p>{tr("प्रमाण पत्र")}</p>
          <div>{tr("यह प्रमाणित किया जाता है कि")}</div>
          <strong>
            {tr(village)} {tr("ग्राम")}
          </strong>
          <p>
            {tr(
              "में 50% से अधिक संभावित लखपति दीदी परिवारों ने सत्यापित वार्षिक घरेलू आय ₹1,00,000 से अधिक प्राप्त की है।",
            )}
          </p>
          <em>{tr("नवंबर 2026 • छत्तीसगढ़")}</em>
          <footer>
            <span>{tr("मिशन संचालक")}</span>
            <span>{tr("जिला मिशन प्रबंधक")}</span>
          </footer>
        </div>
        <button className="primary">
          <Icon name="download" size={15} /> {tr("प्रमाण पत्र डाउनलोड")}
        </button>
      </div>
    </>
  )
}
