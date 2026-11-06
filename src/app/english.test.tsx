import { QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

import i18n from "@/i18n"
import { type Role, useSession } from "@/stores/session"
import { stubFetch } from "@/test/fixtures"

import { createQueryClient } from "./queryClient"
import { routes } from "./router"

const user = { id: 1, name: "अनिल कश्यप", role: "block", designation: "BMMU", initials: "AK" }
const DEVANAGARI = /[ऀ-ॿ]/
// Nothing on screen may stay in Hindi in English mode.
const ALLOWED = new Set<string>()

const screens: [Role, string][] = [
  ["block", "/block"],
  ["block", "/block/households"],
  ["block", "/block/applications"],
  ["block", "/block/blcc"],
  ["block", "/block/schemes"],
  ["block", "/block/reports"],
  ["block", "/settings"],
  ["field", "/field"],
  ["field", "/field/survey"],
  ["field", "/field/village"],
  ["field", "/field/households"],
  ["field", "/field/recommendations"],
  ["field", "/field/dpr"],
  ["field", "/field/recommendations/HH-BST-JGD-000123"],
  ["department", "/dept/FISH"],
  ["department", "/dept/AH"],
  ["district", "/district"],
  ["district", "/district/lakhpati-gram"],
  ["state", "/state"],
  ["state", "/state/certification"],
  ["state", "/state/map"],
  ["didi", "/didi"],
  ["didi", "/didi/tasks"],
  ["didi", "/didi/applications"],
  ["district", "/district/map/district/374"],
  ["admin", "/admin/schemes"],
  ["admin", "/admin/mapping"],
  ["admin", "/admin/users"],
  ["admin", "/admin/geography"],
  ["admin", "/admin/survey"],
  ["admin", "/admin/village"],
  ["admin", "/admin/audit"],
]

/** Visible Hindi left on the page: text nodes plus user-facing attributes. */
function hindiOnPage() {
  const found = new Set<string>()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ""
    if (DEVANAGARI.test(text) && !ALLOWED.has(text)) found.add(text)
  }
  for (const el of document.body.querySelectorAll("[placeholder],[title],[aria-label],[alt]")) {
    for (const attr of ["placeholder", "title", "aria-label", "alt"]) {
      const value = el.getAttribute(attr) ?? ""
      if (DEVANAGARI.test(value)) found.add(`@${attr}: ${value}`)
    }
  }
  for (const option of document.body.querySelectorAll("option")) {
    if (DEVANAGARI.test(option.textContent ?? "")) found.add(`option: ${option.textContent}`)
  }
  return [...found]
}

async function renderScreen(role: Role, path: string) {
  useSession.setState({ token: "test-token", user, role })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  await waitFor(() => expect(document.querySelector(".app-shell")).toBeInTheDocument())
  // Let data load (fixtures resolve immediately) before checking.
  await waitFor(() => expect(document.querySelector(".page, .field-mobile")).toBeInTheDocument())
  await new Promise((resolve) => setTimeout(resolve, 50))
}

/** Clicks each button matched by `selector` in turn and collects Hindi from every state. */
async function hindiAcrossSteps(selector: string) {
  const found = new Set<string>()
  const count = document.querySelectorAll(selector).length
  expect(count).toBeGreaterThan(1)
  for (let index = 0; index < count; index++) {
    const step = document.querySelectorAll<HTMLButtonElement>(selector)[index]
    if (step.closest(".not-applicable") || step.classList.contains("not-applicable")) continue
    fireEvent.click(step)
    await new Promise((resolve) => setTimeout(resolve, 10))
    for (const text of hindiOnPage()) found.add(`step ${index + 1}: ${text}`)
  }
  return [...found]
}

describe("English mode", () => {
  beforeAll(() => i18n.changeLanguage("en"))
  afterAll(() => i18n.changeLanguage("hi"))
  beforeEach(() => stubFetch())

  it.each(screens)("%s %s shows no Hindi", async (role, path) => {
    await renderScreen(role, path)
    expect(hindiOnPage()).toEqual([])
  })

  it("every survey section shows no Hindi", async () => {
    await renderScreen("field", "/field/survey")
    expect(await hindiAcrossSteps(".section-directory button")).toEqual([])
  })

  it("every DPR step shows no Hindi", async () => {
    await renderScreen("field", "/field/dpr/HH-BST-JGD-000123/PMMSY_POND")
    expect(await hindiAcrossSteps(".dpr-steps button")).toEqual([])
  })
})
