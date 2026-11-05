import { useState } from "react"

import type { ApplicationDetail } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { todayIso } from "@/features/applications/applicationStatus"

export function ApplicationActionForm({
  action,
  detail,
  busy,
  onCancel,
  onSubmit,
}: {
  action: "info" | "sanction" | "reject" | "deliver"
  detail: ApplicationDetail
  busy: boolean
  onCancel: () => void
  onSubmit: (payload: Record<string, unknown>) => void
}) {
  const labels = {
    info: ["जानकारी माँगें", "अनुरोध भेजें"],
    sanction: ["आवेदन स्वीकृत करें", "स्वीकृति दर्ज करें"],
    reject: ["आवेदन अस्वीकार करें", "अस्वीकृति दर्ज करें"],
    deliver: ["डिलीवरी दर्ज करें", "डिलीवर चिह्नित करें"],
  }
  const missingDoc = detail.documents.find((d) => !d.verified)?.name
  const [message, setMessage] = useState(
    `कृपया ${missingDoc ?? "आवश्यक दस्तावेज़"} की स्पष्ट प्रति अपलोड करें।`,
  )
  const [orderNo, setOrderNo] = useState("")
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState(detail.subsidy.replace(/[^\d]/g, ""))
  const [reason, setReason] = useState("दस्तावेज़ अपूर्ण")
  const [note, setNote] = useState("आवश्यक प्रमाण उपलब्ध नहीं है।")
  const [asset, setAsset] = useState("")
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null)
  const [geoState, setGeoState] = useState("")
  const captureGeo = () => {
    if (!navigator.geolocation) {
      setGeoState("इस डिवाइस पर लोकेशन उपलब्ध नहीं")
      return
    }
    setGeoState("लोकेशन ली जा रही है…")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        })
        setGeoState("")
      },
      () => setGeoState("लोकेशन अनुमति नहीं मिली"),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  const payload = () =>
    action === "info"
      ? { message }
      : action === "sanction"
        ? { orderNo, date, amount }
        : action === "reject"
          ? { reason, note }
          : { date, asset, lat: geo?.lat ?? null, lng: geo?.lng ?? null }
  const valid =
    action === "info"
      ? Boolean(message.trim())
      : action === "sanction"
        ? Boolean(orderNo.trim() && date && Number(amount) > 0)
        : action === "reject"
          ? Boolean(reason)
          : Boolean(date && asset.trim())
  return (
    <section className={`drawer-section action-form ${action}`}>
      <div className="drawer-section-title">
        <h4>{labels[action][0]}</h4>
        <button onClick={onCancel} aria-label="बंद करें">
          <Icon name="close" size={14} />
        </button>
      </div>
      {action === "info" && (
        <label>
          <span>CRP के लिए संदेश</span>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
      )}
      {action === "sanction" && (
        <div className="action-form-grid">
          <label className="text-control">
            <span>आदेश सं.</span>
            <input
              value={orderNo}
              placeholder="FISH/JGD/2026/284"
              onChange={(event) => setOrderNo(event.target.value)}
            />
          </label>
          <label className="text-control">
            <span>दिनांक</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="text-control">
            <span>स्वीकृत राशि ₹ (लागत {detail.amount})</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
        </div>
      )}
      {action === "reject" && (
        <>
          <label>
            <span>कारण</span>
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option>दस्तावेज़ अपूर्ण</option>
              <option>पात्रता पूरी नहीं</option>
              <option>बजट उपलब्ध नहीं</option>
              <option>दोहरा लाभ</option>
            </select>
          </label>
          <label>
            <span>टिप्पणी</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
        </>
      )}
      {action === "deliver" && (
        <div className="action-form-grid">
          <label className="text-control">
            <span>डिलीवरी दिनांक</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="text-control">
            <span>परिसंपत्ति विवरण</span>
            <input
              value={asset}
              placeholder="5,000 फिंगरलिंग + जाल"
              onChange={(event) => setAsset(event.target.value)}
            />
          </label>
          <button type="button" className="action-upload" onClick={captureGeo}>
            <Icon name="camera" size={15} /> Geo-tag लोकेशन
          </button>
          <div className="geo-proof">
            <Icon name="map" size={14} />
            {geo ? `${geo.lat}, ${geo.lng}` : geoState || "लोकेशन नहीं ली गई"}
          </div>
        </div>
      )}
      <div className="action-form-buttons">
        <button className="secondary" onClick={onCancel} disabled={busy}>
          रद्द करें
        </button>
        <button className="primary" disabled={busy || !valid} onClick={() => onSubmit(payload())}>
          {busy ? "सहेजा जा रहा है…" : labels[action][1]}
        </button>
      </div>
    </section>
  )
}
