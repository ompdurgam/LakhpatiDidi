import { QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { beforeEach, describe, expect, it } from "vitest"

import { type Role, useSession } from "@/stores/session"
import { stubFetch } from "@/test/fixtures"

import { roleNav } from "./navigation"
import { createQueryClient } from "./queryClient"
import { routes } from "./router"

const user = { id: 1, name: "अनिल कश्यप", role: "block", designation: "BMMU", initials: "AK" }

function renderAt(path: string, role: Role) {
  useSession.setState({ token: "test-token", user, role })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

// Every screen of the prototype, by URL, with something unique it renders.
const screens: [Role, string, RegExp][] = [
  ["block", "/block", /नमस्ते, अनिल जी/],
  ["block", "/block/households", /परिवार और दीदी रजिस्टर/],
  ["block", "/block/applications", /APP-260142/],
  ["block", "/block/blcc", /BLCC/],
  ["block", "/block/schemes", /योजना/],
  ["block", "/block/reports", /रिपोर्ट/],
  ["block", "/settings", /सेटिंग्स/],
  ["field", "/field", /सर्वे/],
  ["field", "/field/survey", /परिवार सर्वे/],
  ["field", "/field/village", /ग्राम/],
  ["field", "/field/households", /HH-BST-JGD-000123/],
  ["field", "/field/recommendations", /योजना/],
  ["field", "/field/dpr", /DPR/],
  ["field", "/field/income", /HH-BST-JGD-000123/],
  ["department", "/dept/FISH", /आवेदन इनबॉक्स/],
  ["department", "/dept/FISH/sanctioned", /आवेदन इनबॉक्स/],
  ["department", "/dept/AH", /पशुपालन विभाग/],
  ["district", "/district", /जिला/],
  ["district", "/district/lakhpati-gram", /जिला/],
  ["state", "/state", /राज्य/],
  ["state", "/state/certification", /राज्य/],
  ["admin", "/admin/schemes", /योजना मास्टर/],
  ["admin", "/admin/mapping", /विभाग एवं अधिकारी मैपिंग/],
  ["admin", "/admin/users", /यूज़र और भूमिकाएँ/],
  ["admin", "/admin/geography", /भूगोल मास्टर/],
  ["admin", "/admin/survey", /सर्वे सेक्शन/],
  ["admin", "/admin/village", /ग्राम प्रोफाइल/],
  ["admin", "/admin/audit", /ऑडिट लॉग/],
]

describe("routes", () => {
  beforeEach(() => {
    stubFetch()
    // Every test starts signed out; renderAt() signs in as the role it needs.
    useSession.setState({ token: null, user: null })
  })

  it.each(screens)("%s %s renders", async (role, path, text) => {
    renderAt(path, role)
    await waitFor(() => expect(document.querySelector(".app-shell")).toBeInTheDocument())
    await waitFor(() => expect(screen.getAllByText(text).length).toBeGreaterThan(0), {
      timeout: 4000,
    })
    expect(screen.queryByText("कुछ गलत हो गया")).not.toBeInTheDocument()
  })

  // Renders every menu item of every role (~45 apps), so it needs more than the
  // 5 s default; a timeout would leave the loop running into the next tests.
  it("every sidebar link resolves to a screen", { timeout: 60_000 }, async () => {
    for (const [role, items] of Object.entries(roleNav)) {
      for (const item of items) {
        const router = renderAt(item.path, role as Role)
        await waitFor(() => expect(router.state.location.pathname).toBe(item.path))
        expect(screen.queryByText("यह पेज नहीं मिला")).not.toBeInTheDocument()
        cleanup()
      }
    }
  })

  it("redirects signed-out users to /login", async () => {
    useSession.setState({ token: null, user: null })
    const router = createMemoryRouter(routes, { initialEntries: ["/block"] })
    render(
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"))
  })

  it("sends a role to its own home when it opens another role's URL", async () => {
    const router = renderAt("/admin/users", "block")
    await waitFor(() => expect(router.state.location.pathname).toBe("/block"))
  })

  it("shows not-found for unknown URLs", async () => {
    renderAt("/block/nope/really", "block")
    await waitFor(() => expect(screen.getByText("यह पेज नहीं मिला")).toBeInTheDocument())
  })
})
