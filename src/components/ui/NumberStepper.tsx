import { useTr } from "@/i18n/tr"

export function NumberControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const tr = useTr()
  return (
    <div className="number-control">
      <span>{tr(label)}</span>
      <div>
        <button type="button" onClick={() => onChange(value - 1)}>
          −
        </button>
        <b>{value}</b>
        <button type="button" onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  )
}
