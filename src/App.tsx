import { useState } from "react"
import { RouterProvider } from "react-router"

import { Providers } from "@/app/providers"
import { createRouter } from "@/app/router"
import { InstallPrompt } from "@/components/ui/InstallPrompt"

/** Entry point: providers + router. Screens live in src/features. */
export default function App() {
  const [router] = useState(createRouter)
  return (
    <Providers>
      <RouterProvider router={router} />
      <InstallPrompt />
    </Providers>
  )
}
