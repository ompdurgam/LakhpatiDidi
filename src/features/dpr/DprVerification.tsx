import { Icon } from "@/components/ui/Icon"

export function DprVerification() {
  return (
    <div className="verification-step">
      {[
        ["CRP सत्यापन", "गीता नेताम", "04 नवंबर 2026 • 10:15 AM"],
        ["CLF सत्यापन", "माँ दंतेश्वरी CLF", "04 नवंबर 2026 • 02:40 PM"],
        ["दीदी सहमति", "OTP ✔", "04 नवंबर 2026 • मोबाइल 98•••••412 से सत्यापित"],
      ].map(([title, name, meta]) => (
        <div className="verification-card" key={title}>
          <span>
            <Icon name="check" size={17} />
          </span>
          <div>
            <strong>{title} ✔</strong>
            <p>{name}</p>
            <small>{meta}</small>
          </div>
        </div>
      ))}
      <label className="verification-remarks">
        <span>सत्यापन टिप्पणी</span>
        <textarea defaultValue="लाभार्थी ने परियोजना लागत, ऋण और विभागीय प्रक्रिया समझ ली है। तालाब स्थल का GPS सत्यापित है।" />
      </label>
    </div>
  )
}
