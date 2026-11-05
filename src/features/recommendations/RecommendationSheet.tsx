import { useState } from "react"

import { Icon } from "@/components/ui/Icon"

export function RecommendationSheet({
  type,
  schemeName,
  onClose,
  onConfirm,
}: {
  type: "reason" | "later"
  schemeName: string
  onClose: () => void
  onConfirm: () => void
}) {
  const [reason, setReason] = useState("पैसा नहीं")
  const [date, setDate] = useState("2026-11-25")
  return (
    <>
      <div className="recommend-sheet-scrim" onClick={onClose} />
      <aside className="recommend-sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">
          <div>
            <span>{type === "reason" ? "रुचि नहीं" : "बाद में याद दिलाएँ"}</span>
            <h3>{schemeName}</h3>
          </div>
          <button onClick={onClose}>
            <Icon name="close" size={17} />
          </button>
        </div>
        {type === "reason" ? (
          <div className="reason-options">
            {["पैसा नहीं", "समय नहीं", "परिवार सहमत नहीं", "पहले से लाभ", "अन्य"].map((option) => (
              <button
                key={option}
                className={reason === option ? "active" : ""}
                onClick={() => setReason(option)}
              >
                <i>{reason === option && <span />}</i>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <label className="reminder-date">
            <span>याद दिलाने की तारीख</span>
            <input
              type="date"
              min="2026-11-01"
              max="2026-11-30"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <small>नवंबर 2026 में सर्वेयर होम पर रिमाइंडर दिखेगा।</small>
          </label>
        )}
        <button className="primary sheet-confirm" onClick={onConfirm}>
          {type === "reason" ? "कारण सुरक्षित करें" : "रिमाइंडर लगाएँ"}
        </button>
      </aside>
    </>
  )
}
