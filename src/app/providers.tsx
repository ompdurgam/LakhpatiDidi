import { QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
import { I18nextProvider } from "react-i18next"

import i18n from "@/i18n"

import { createQueryClient } from "./queryClient"

/** QueryClient + i18n. Auth/session lives in the zustand store (src/stores/session). */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient)
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nextProvider>
  )
}
