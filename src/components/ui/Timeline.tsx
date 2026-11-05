import { Icon } from "./Icon"

export type TimelineStep = { label: string; date: string; state: "done" | "active" | "" | string }

/** Vertical progress timeline (`.timeline`). */
export function Timeline({ steps, className = "" }: { steps: TimelineStep[]; className?: string }) {
  return (
    <div className={`timeline ${className}`.trim()}>
      {steps.map(({ label, date, state }) => (
        <div key={label} className={state}>
          <i>{state === "done" && <Icon name="check" size={12} />}</i>
          <div>
            <strong>{label}</strong>
            <span>{date}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
