import { useUi } from "@/stores/ui"

import { Icon } from "./Icon"

/** Bottom toast driven by `useUi().notify()`. */
export function Toast() {
  const message = useUi((s) => s.toast)
  if (!message) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      <Icon name="check" size={18} />
      {message}
    </div>
  )
}
