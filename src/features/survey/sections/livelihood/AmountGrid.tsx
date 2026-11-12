import { useDraftState } from "@/components/ui/draft"
import { useTr } from "@/i18n/tr"

/** A number per item (₹ per produce, acres per crop…), saved in the survey draft as one answer. */
export function AmountGrid({
  name,
  items,
  className,
  step,
}: {
  /** The draft key for the whole grid. */
  name: string
  items: string[]
  className: string
  step?: string
}) {
  const tr = useTr()
  const [values, setValues] = useDraftState<Record<string, string>>(name, {})
  return (
    <div className={className}>
      {items.map((item) => (
        <label key={item}>
          <span>{tr(item)}</span>
          <input
            type="number"
            min={0}
            step={step}
            inputMode="decimal"
            value={values[item] ?? ""}
            onChange={(e) => setValues({ ...values, [item]: e.target.value })}
          />
        </label>
      ))}
    </div>
  )
}
