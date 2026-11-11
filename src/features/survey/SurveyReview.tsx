import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import type { IncomeEntry } from "@/features/survey/types"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"

/** Income-baseline (section B) sources each livelihood section (E–K, by step index) covers. */
const SECTION_SOURCES: Record<number, string[]> = {
  4: ["फसल/खेती", "अन्य कृषि/बागवानी"],
  5: ["पशुपालन"],
  6: ["मत्स्य पालन"],
  7: ["वन उपज"],
  8: ["गैर-कृषि उद्यम"],
  9: ["पर्यटन"],
  10: ["स्थानीय मजदूरी", "प्रवासन/रोजगार"],
}

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
  const tr = useTr()
  const [open, setOpen] = useState(0)
  const [photo, setPhoto] = useState(false)
  const [method, setMethod] = useState("OTP")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [photoAt, setPhotoAt] = useState("")
  const user = useSession((s) => s.user)
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const [declaration, setDeclaration] = useState(false)
  const net = incomeEntries.reduce((sum, entry) => sum + entry.gross - entry.cost, 0)
  const applicableSections = sections
    .map((name, index) => ({ name, index }))
    .filter((item) => item.index < 11 && isApplicable(item.index))
  // A livelihood section filled in (E–K) whose income baseline (section B) is still ₹0.
  const baseline = (names: string[]) =>
    incomeEntries
      .filter((e) => names.includes(e.name))
      .reduce((sum, e) => sum + e.gross - e.cost, 0)
  const warnings = Object.entries(SECTION_SOURCES)
    .filter(([index, names]) => isApplicable(Number(index)) && baseline(names) <= 0)
    .map(([index]) => ({ index: Number(index), section: sections[Number(index)] }))
  const activeSources = incomeEntries.filter((e) => e.gross - e.cost > 0).length
  const updateOtp = (index: number, value: string) =>
    setOtp(otp.map((digit, digitIndex) => (digitIndex === index ? value.slice(-1) : digit)))
  return (
    <div className="review-upgraded">
      <div className="review-intro">
        <span>
          <Icon name="file" size={19} />
        </span>
        <div>
          <strong>{tr("जमा करने से पहले जाँचें")}</strong>
          <p>{tr("अधूरे उत्तर और आय अंतर ठीक करें।")}</p>
        </div>
      </div>
      <div className="review-accordion">
        {applicableSections.map(({ name, index }) => {
          return (
            <section key={name} className={open === index ? "open" : ""}>
              <button
                className="review-accordion-head"
                onClick={() => setOpen(open === index ? -1 : index)}
              >
                <span className="complete">{index + 1}</span>
                <strong>{name}</strong>
                <em />
                <b>{open === index ? "−" : "+"}</b>
              </button>
              {open === index && (
                <div className="review-accordion-body">
                  <p>{tr("इस खंड के उत्तर बदलने के लिए संपादित करें।")}</p>
                  <button onClick={() => setStep(index)}>
                    {tr("संपादित करें")} <Icon name="arrow" size={13} />
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
      <section className="review-warnings">
        <h4>
          {tr("आय मिलान चेतावनी")} <span>{warnings.length}</span>
        </h4>
        {warnings.length === 0 && <p className="empty-note">{tr("कोई आय अंतर नहीं")}</p>}
        {warnings.map((item) => (
          <div key={item.index}>
            <Icon name="alert" size={14} />
            <p>
              <strong>{item.section}</strong>
              <span>{tr("आजीविका चुनी गई पर खंड B में आय ₹0")}</span>
            </p>
            <button onClick={() => setStep(1)}>{tr("संपादित करें")}</button>
          </div>
        ))}
      </section>
      <div className="review-meter">
        <div>
          <span>{tr("अंतिम लखपति मीटर")}</span>
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
          {tr("सक्रिय आय स्रोत: {{n}} • लक्ष्य तक ₹{{amount}} बाकी", {
            n: activeSources,
            amount: Math.max(0, 100000 - net).toLocaleString("en-IN"),
          })}
        </p>
      </div>
      <section className="consent-panel">
        <h4>{tr("दीदी की पहचान और सहमति")}</h4>
        <button
          className={`photo-capture ${photo ? "captured" : ""}`}
          onClick={() => {
            setPhoto(true)
            setPhotoAt(
              new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
            )
          }}
        >
          {photo ? (
            <>
              <span className="didi-photo">
                <Icon name="check" size={16} />
              </span>
              <div>
                <strong>{tr("फोटो कैप्चर हुआ")}</strong>
                <small>{photoAt}</small>
              </div>
              <Icon name="check" size={18} />
            </>
          ) : (
            <>
              <span>
                <Icon name="plus" size={18} />
              </span>
              <div>
                <strong>{tr("दीदी फोटो कैप्चर करें")}</strong>
                <small>{tr("कैमरा खोलने के लिए टैप करें")}</small>
              </div>
              <Icon name="chevron" size={16} />
            </>
          )}
        </button>
        <div className="consent-method">
          <span>{tr("अंगूठा / OTP से सहमति")}</span>
          <div>
            <button
              className={method === "अंगूठा" ? "active" : ""}
              onClick={() => setMethod("अंगूठा")}
            >
              {tr("अंगूठा")}
            </button>
            <button className={method === "OTP" ? "active" : ""} onClick={() => setMethod("OTP")}>
              OTP
            </button>
          </div>
        </div>
        {method === "OTP" ? (
          <>
            <p className="otp-note">{tr("दीदी से प्राप्त 6-अंकीय OTP दर्ज करें")}</p>
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
          </>
        ) : (
          <button className="thumb-capture">
            <span className="thumb-mark">{tr("अं")}</span>
            <div>
              <strong>{tr("अंगूठे का निशान लें")}</strong>
              <small>{tr("बायोमेट्रिक डिवाइस जोड़ें")}</small>
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
          {tr("मैं घोषणा करता/करती हूँ कि यह जानकारी परिवार के समक्ष सत्यापित की गई है।")}
          <small>
            {tr(user?.name ?? "")} • {tr(user?.designation ?? "")} • {today}
          </small>
        </span>
      </label>
      <button
        className="submit-survey-final"
        disabled={!declaration || !photo || otp.some((digit) => !digit)}
        onClick={() => onSubmit(method === "OTP" ? "OTP" : "thumb")}
      >
        <Icon name="check" size={17} /> {tr("सर्वे जमा करें")}
      </button>
    </div>
  )
}
