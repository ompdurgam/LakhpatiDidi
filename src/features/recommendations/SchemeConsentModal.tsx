import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import type { RecommendationScheme } from "@/features/recommendations/types"
import { useTr } from "@/i18n/tr"

export function SchemeConsentModal({
  schemes,
  onClose,
  onConfirm,
}: {
  schemes: RecommendationScheme[]
  onClose: () => void
  onConfirm: () => void
}) {
  const tr = useTr()
  const [method, setMethod] = useState<"OTP" | "thumb">("OTP")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [thumb, setThumb] = useState(false)
  const ready = method === "OTP" ? otp.every(Boolean) : thumb
  return (
    <>
      <div className="scheme-consent-scrim" onClick={onClose} />
      <div className="scheme-consent-modal">
        <div className="consent-modal-head">
          <div>
            <span>{tr("अंतिम चरण")}</span>
            <h3>{tr("दीदी की सहमति")}</h3>
          </div>
          <button onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="selected-scheme-list">
          <span>
            {tr("चयनित योजनाएँ (")}
            {schemes.length})
          </span>
          {schemes.map((scheme) => (
            <div key={scheme.key}>
              <Icon name="check" size={13} />
              <strong>{tr(scheme.name)}</strong>
              <small>{tr(scheme.dept)}</small>
            </div>
          ))}
        </div>
        <div className="consent-method modal-method">
          <button className={method === "OTP" ? "active" : ""} onClick={() => setMethod("OTP")}>
            {tr("6-अंकीय OTP")}
          </button>
          <button className={method === "thumb" ? "active" : ""} onClick={() => setMethod("thumb")}>
            {tr("अंगूठा निशान")}
          </button>
        </div>
        {method === "OTP" ? (
          <div className="modal-otp">
            <p>{tr("98•••••412 पर भेजा गया OTP दर्ज करें")}</p>
            <div className="otp-boxes">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    setOtp(
                      otp.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value.slice(-1) : item,
                      ),
                    )
                  }
                />
              ))}
            </div>
            <button>{tr("OTP दोबारा भेजें")}</button>
          </div>
        ) : (
          <button
            className={`consent-thumb ${thumb ? "captured" : ""}`}
            onClick={() => setThumb(true)}
          >
            <span className="thumb-mark">{tr("अं")}</span>
            <div>
              <strong>
                {thumb ? tr("अंगूठा निशान कैप्चर हुआ") : tr("अंगूठा निशान कैप्चर करें")}
              </strong>
              <small>
                {thumb ? tr("18 नवंबर 2026 • सत्यापित") : tr("बायोमेट्रिक डिवाइस पर टैप करें")}
              </small>
            </div>
            {thumb && <Icon name="check" size={17} />}
          </button>
        )}
        <label className="consent-record-note">
          <input type="checkbox" defaultChecked />{" "}
          {tr("दीदी ने चयनित योजनाओं और DPR निर्माण के लिए सहमति दी है।")}
        </label>
        <button className="primary consent-confirm" disabled={!ready} onClick={onConfirm}>
          {tr("सहमति दर्ज करें और DPR बनाएँ")} <Icon name="arrow" size={16} />
        </button>
      </div>
    </>
  )
}
