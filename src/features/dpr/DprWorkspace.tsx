import { useParams } from "react-router"

import { DprBoard } from "./DprBoard"
import { DprBuilder } from "./DprBuilder"

/** DPR tab: the Didi list with KPIs, or the builder for one Didi + scheme from the URL. */
export function DprWorkspace({ compact = false }: { compact?: boolean }) {
  const { householdId, schemeCode } = useParams()
  return householdId && schemeCode ? (
    <DprBuilder code={householdId} scheme={schemeCode} compact={compact} />
  ) : (
    <DprBoard compact={compact} />
  )
}
