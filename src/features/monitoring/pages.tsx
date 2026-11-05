import { useUi } from "@/stores/ui"

import { DistrictWorkspace } from "./DistrictDashboard"
import { StateWorkspace } from "./StateDashboard"

// TODO(phase 5): district/state sub-pages (blocks, departments, Lakhpati Gram,
// escalations, drill-down) become separate screens; for now every menu item
// shows the single dashboard from the prototype, exactly as before.

export function DistrictPage() {
  const notify = useUi((s) => s.notify)
  return <DistrictWorkspace onNotify={notify} />
}

export function StatePage() {
  const notify = useUi((s) => s.notify)
  return <StateWorkspace onNotify={notify} />
}
