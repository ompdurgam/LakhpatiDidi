import { useTr } from "@/i18n/tr"

import type { DashLevel, Overview } from "./useOverview"

export type PickedArea = { level: DashLevel; code: string } | undefined

/** Lets a user who covers several districts / blocks choose which one the dashboard shows. */
export function AreaPicker({
  data,
  onPick,
}: {
  data: Overview
  onPick: (area: PickedArea) => void
}) {
  const tr = useTr()
  if (data.areas.length < 2) return null
  return (
    <label className="workspace-select-label">
      <span>{tr("क्षेत्र")}</span>
      <select
        className="workspace-select"
        value={`${data.area.level}:${data.area.code}`}
        onChange={(e) => {
          const [level, code] = e.target.value.split(":")
          onPick({ level: level as DashLevel, code })
        }}
      >
        {data.areas.map((a) => (
          <option key={`${a.level}:${a.code}`} value={`${a.level}:${a.code}`}>
            {a.name}
          </option>
        ))}
      </select>
    </label>
  )
}
