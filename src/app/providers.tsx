import { QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"

import i18n from "@/i18n"

import { createQueryClient } from "./queryClient"
import { persistQueries, restoreQueries } from "./queryPersist"

/** QueryClient + i18n. Auth/session lives in the zustand store (src/stores/session). */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const created = createQueryClient()
    restoreQueries(created) // last-seen figures, shown while fresh ones load
    return created
  })
  useEffect(() => persistQueries(client), [client])
  // API data is language-specific, so refetch it when the language changes.
  useEffect(() => {
    const refetch = () => void client.invalidateQueries()
    i18n.on("languageChanged", refetch)
    return () => i18n.off("languageChanged", refetch)
  }, [client])
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nextProvider>
  )
}
