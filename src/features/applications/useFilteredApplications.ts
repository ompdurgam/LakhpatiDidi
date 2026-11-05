import { useMemo } from "react"

import { useApplications } from "@/api/hooks"
import { useUi } from "@/stores/ui"

/** Applications filtered by the header search box. */
export function useFilteredApplications() {
  const { data = [] } = useApplications()
  const query = useUi((s) => s.query).toLowerCase()
  return useMemo(
    () =>
      data.filter((a) =>
        `${a.name} ${a.id} ${a.village} ${a.scheme}`.toLowerCase().includes(query),
      ),
    [data, query],
  )
}
