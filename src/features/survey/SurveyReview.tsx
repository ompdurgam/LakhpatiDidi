import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import type { IncomeEntry } from "@/features/survey/types"

export function SurveyReview({
  sections,
  isApplicable,
  setStep,
  incomeEntries,
  onSubmit,
}: {
  sections: string[]
  isApplicable: (index: number) => boolean
  setStep: (index: number) => void
  incomeEntries: IncomeEntry[]
  onSubmit: (consentMethod: string) => void
}) {
  const [open, setOpen] = useState(0)
  const [photo, setPhoto] = useState(false)
  const [method, setMethod] = useState("OTP")
  const [otp, setOtp] = useState(["4", "8", "2", "1", "9", "6"])
  const [declaration, setDeclaration] = useState(false)
  const net = incomeEntries.reduce((sum, entry) => sum + entry.gross - entry.cost, 0)
  const applicableSections = sections
    .map((name, index) => ({ name, index }))
    .filter((item) => item.index < 11 && isApplicable(item.index))
  const warnings = [
    { section: "F पशुधन", detail: "खंड B ₹0 • विवरण ₹18,000" },
    { section: "G मत्स्य", detail: "खंड B ₹0 • विवरण ₹15,000" },
    { section: "I गैर-कृषि", detail: "खंड B ₹0 • विवरण ₹12,000" },
  ]
  const updateOtp = (index: number, value: string) =>
    setOtp(otp.map((digit, digitIndex) => (digitIndex === index ? value.slice(-1) : digit)))
  return (
    <div className="review-upgraded">
      <div className="review-intro">
        <span>
          <Icon name="file" size={19} />
        </span>
        <div>
          <strong>जमा करने से पहले जाँचें</strong>
          <p>अधूरे उत्तर और आय अंतर ठीक करें। अंतिम अपडेट: 18 नवंबर 2026</p>
        </div>
      </div>
      <div className="review-accordion">
        {applicableSections.map(({ name, index }) => {
          const incomplete = index === 2 || index === 6
          return (
            <section key={name} className={open === index ? "open" : ""}>
              <button
                className="review-accordion-head"
                onClick={() => setOpen(open === index ? -1 : index)}
              >
                <span className={incomplete ? "warning" : "complete"}>
                  {incomplete ? "!" : "✓"}
                </span>
                <strong>{name}</strong>
                <em className={incomplete ? "warning" : ""}>
                  {incomplete ? "⚠ 2 अधूरे" : "पूर्ण"}
                </em>
                <b>{open === index ? "−" : "+"}</b>
              </button>
              {open === index && (
                <div className="review-accordion-body">
                  <p>
                    {incomplete
                      ? "2 उत्तरों पर ध्यान देना आवश्यक है।"
                      : "सभी अनिवार्य उत्तर पूरे हैं।"}
                  </p>
                  <button onClick={() => setStep(index)}>
                    संपादित करें <Icon name="arrow" size={13} />
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
      <section className="review-warnings">
        <h4>
          आय मिलान चेतावनी <span>{warnings.length}</span>
        </h4>
        {warnings.map((item) => (
          <div key={item.section}>
            <Icon name="alert" size={14} />
            <p>
              <strong>{item.section}</strong>
              <span>{item.detail}</span>
            </p>
            <button
              onClick={() =>
                setStep(item.section.startsWith("F") ? 5 : item.section.startsWith("G") ? 6 : 8)
              }
            >
              संपादित करें
            </button>
          </div>
        ))}
      </section>
      <div className="review-meter">
        <div>
          <span>अंतिम लखपति मीटर</span>
          <strong>₹{net.toLocaleString("en-IN")} / ₹1,00,000</strong>
        </div>
        <div className="meter-scale">
          <i style={{ width: `${Math.min(net / 1000, 100)}%` }} />
          <b className="threshold-mark">
            <small>₹80K</small>
          </b>
          <b className="lakhpati-mark">
            <small>₹1L</small>
          </b>
        </div>
        <p>
          सक्रिय आय स्रोत: 3 • लक्ष्य तक ₹{Math.max(0, 100000 - net).toLocaleString("en-IN")} बाकी
        </p>
      </div>
      <section className="consent-panel">
        <h4>दीदी की पहचान और सहमति</h4>
        <button
          className={`photo-capture ${photo ? "captured" : ""}`}
          onClick={() => setPhoto(true)}
        >
          {photo ? (
            <>
              <span className="didi-photo">SK</span>
              <div>
                <strong>फोटो कैप्चर हुआ</strong>
                <small>18 नवंबर 2026 • 11:42 AM</small>
              </div>
              <Icon name="check" size={18} />
            </>
          ) : (
            <>
              <span>
                <Icon name="plus" size={18} />
              </span>
              <div>
                <strong>दीदी फोटो कैप्चर करें</strong>
                <small>कैमरा खोलने के लिए टैप करें</small>
              </div>
              <Icon name="chevron" size={16} />
            </>
          )}
        </button>
        <div className="consent-method">
          <span>अंगूठा / OTP से सहमति</span>
          <div>
            <button
              className={method === "अंगूठा" ? "active" : ""}
              onClick={() => setMethod("अंगूठा")}
            >
              अंगूठा
            </button>
            <button className={method === "OTP" ? "active" : ""} onClick={() => setMethod("OTP")}>
              OTP
            </button>
          </div>
        </div>
        {method === "OTP" ? (
          <>
            <p className="otp-note">98••• ••412 पर भेजा गया 6-अंकीय OTP</p>
            <div className="otp-boxes">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateOtp(index, event.target.value)}
                />
              ))}
            </div>
            <button className="resend-otp">OTP दोबारा भेजें</button>
          </>
        ) : (
          <button className="thumb-capture">
            <span className="thumb-mark">अं</span>
            <div>
              <strong>अंगूठे का निशान लें</strong>
              <small>बायोमेट्रिक डिवाइस जोड़ें</small>
            </div>
          </button>
        )}
      </section>
      <label className="surveyor-declaration">
        <input
          type="checkbox"
          checked={declaration}
          onChange={(event) => setDeclaration(event.target.checked)}
        />
        <span>
          मैं घोषणा करता/करती हूँ कि यह जानकारी परिवार के समक्ष सत्यापित की गई है।
          <small>गीता नेताम • CRP • 18 नवंबर 2026</small>
        </span>
      </label>
      <button
        className="submit-survey-final"
        disabled={!declaration || !photo || otp.some((digit) => !digit)}
        onClick={() => onSubmit(method === "OTP" ? "OTP" : "thumb")}
      >
        <Icon name="check" size={17} /> सर्वे जमा करें
      </button>
    </div>
  )
}
