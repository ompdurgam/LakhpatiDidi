import { useUi } from "@/stores/ui"

import { FieldWorkspace } from "./FieldWorkspace"

/** All /field/* URLs render the field app; the screen is read from the path. */
export function FieldPage() {
  const notify = useUi((s) => s.notify)
  return <FieldWorkspace onNotify={notify} />
}
