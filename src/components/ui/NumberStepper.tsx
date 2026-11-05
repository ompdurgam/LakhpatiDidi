export function NumberControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="number-control">
      <span>{label}</span>
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
