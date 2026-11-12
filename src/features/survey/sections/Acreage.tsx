import { useDraftState } from "@/components/ui/draft"
import { useTr } from "@/i18n/tr"

const HELD = ["स्वामित्व एकड़", "पट्टा एकड़", "बटाई एकड़", "FRA एकड़"] as const
const WATER = ["सिंचित एकड़", "असिंचित एकड़"] as const

/** Land held by tenure (summed into the total) and by irrigation. */
export function Acreage() {
  const tr = useTr()
  const [acres, setAcres] = useDraftState<Record<string, string>>("भूमि (एकड़)", {})
  const total = HELD.reduce((sum, key) => sum + (Number(acres[key]) || 0), 0)
  const watered = WATER.reduce((sum, key) => sum + (Number(acres[key]) || 0), 0)
  const field = (label: string) => (
    <label className="text-control" key={label}>
      <span>{tr(label)}</span>
      <input
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        value={acres[label] ?? ""}
        onChange={(e) => setAcres({ ...acres, [label]: e.target.value })}
      />
    </label>
  )
  return (
    <>
      <div className="control-grid acreage">
        {HELD.map(field)}
        <label className="auto-control">
          <span>{tr("कुल एकड़ (स्वतः)")}</span>
          <div>{total.toFixed(2)}</div>
        </label>
        {WATER.map(field)}
      </div>
      {watered > 0 && Math.abs(watered - total) > 0.001 && (
        <p className="validation-error">
          {tr("सिंचित + असिंचित ({{w}}) कुल एकड़ ({{t}}) के बराबर होना चाहिए।", {
            w: watered.toFixed(2),
            t: total.toFixed(2),
          })}
        </p>
      )}
    </>
  )
}
