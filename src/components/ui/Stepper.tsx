/** Compact step indicator (`.mini-stepper`) for wizards. */
export function Stepper({
  steps,
  current,
  onSelect,
}: {
  steps: string[]
  current: number
  onSelect?: (index: number) => void
}) {
  return (
    <div className="mini-stepper">
      {steps.map((label, index) => (
        <button
          key={label}
          type="button"
          className={index === current ? "active" : index < current ? "done" : ""}
          aria-current={index === current ? "step" : undefined}
          onClick={() => onSelect?.(index)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
