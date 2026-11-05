import { statusClass } from "./statusClass"

export type StatusTone = "green" | "blue" | "amber" | "red"

/** Coloured status pill (`.status.<tone>`). Tone defaults from the label. */
export function StatusBadge({ label, tone }: { label: string; tone?: StatusTone }) {
  return <span className={`status ${tone ?? statusClass[label] ?? "blue"}`}>{label}</span>
}
