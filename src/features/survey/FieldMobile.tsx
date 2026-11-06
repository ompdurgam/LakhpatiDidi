import { Icon, type IconName } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { FieldScreen } from "./FieldScreen"
import type { FieldState } from "./fieldState"

const tabs: [screen: string, label: string, icon: IconName][] = [
  ["home", "होम", "home"],
  ["survey", "सर्वे", "file"],
  ["recommend", "सुझाव", "scheme"],
  ["dpr", "DPR", "building"],
  ["tracker", "ट्रैकर", "trend"],
]

/** Full-screen field app for phones: current screen + bottom tab bar. */
export function FieldMobile(s: FieldState) {
  const tr = useTr()
  return (
    <div className="field-mobile">
      <FieldScreen {...s} />
      <nav className="phone-nav">
        {tabs.map(([key, label, icon]) => (
          <button
            key={key}
            className={s.screen === key ? "active" : ""}
            onClick={() => s.setScreen(key)}
          >
            <Icon name={icon} size={17} />
            <span>{tr(label)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
