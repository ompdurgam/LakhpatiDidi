import { useTr } from "@/i18n/tr"

import { statusClass } from "./statusClass"

export type StatusTone = "green" | "blue" | "amber" | "red"

/** Coloured status pill (`.status.<tone>`). Tone defaults from the label. */
export function StatusBadge({ label, tone }: { label: string; tone?: StatusTone }) {
  const tr = useTr()
  return <span className={`status ${tone ?? statusClass[label] ?? "blue"}`}>{tr(label)}</span>
}
