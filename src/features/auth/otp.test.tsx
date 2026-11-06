import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { OtpStep } from "./LoginSteps"
import { useOtpLogin } from "./useOtpLogin"

function Harness() {
  const login = useOtpLogin("9826143412")
  return <OtpStep login={login} />
}

const boxes = () => screen.getAllByRole("textbox") as HTMLInputElement[]
const values = () => boxes().map((box) => box.value)

let verifyCalls: string[] = []
/** What the fake server answers to a code: reject (default) or accept. */
let acceptCode = false

beforeEach(() => {
  verifyCalls = []
  acceptCode = false
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).endsWith("/auth/verify")) verifyCalls.push(String(init?.body))
    return acceptCode
      ? new Response(JSON.stringify({ token: "t", user: { id: 1, role: "field" } }), {
          status: 200,
        })
      : new Response(JSON.stringify({ error: "गलत OTP" }), { status: 401 })
  }) as typeof fetch
})
afterEach(() => vi.restoreAllMocks())

describe("OTP boxes", () => {
  it("moves to the next box as digits are typed", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.keyboard("12")
    expect(values()).toEqual(["1", "2", "", "", "", ""])
    expect(boxes()[2]).toHaveFocus()
  })

  it("Backspace on an empty box goes back and clears the previous digit", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.keyboard("123")
    expect(boxes()[3]).toHaveFocus()
    await user.keyboard("{Backspace}")
    expect(values()).toEqual(["1", "2", "", "", "", ""])
    expect(boxes()[2]).toHaveFocus()
    await user.keyboard("{Backspace}")
    expect(values()).toEqual(["1", "", "", "", "", ""])
    expect(boxes()[1]).toHaveFocus()
  })

  it("Backspace on a filled box clears just that digit", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.keyboard("12")
    await user.click(boxes()[0])
    await user.keyboard("{Backspace}")
    expect(values()).toEqual(["", "2", "", "", "", ""])
  })

  it("Backspace on the first empty box does nothing harmful", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.keyboard("{Backspace}{Backspace}")
    expect(values()).toEqual(["", "", "", "", "", ""])
    expect(boxes()[0]).toHaveFocus()
  })

  it("arrow keys move between boxes", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.keyboard("12{ArrowLeft}")
    expect(boxes()[1]).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(boxes()[2]).toHaveFocus()
  })

  it("typing over a selected digit replaces it", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.keyboard("12")
    await user.click(boxes()[0]) // focusing selects its content
    await user.keyboard("9")
    expect(values().slice(0, 2)).toEqual(["9", "2"])
  })

  it("pasting a code fills every box and verifies it", async () => {
    acceptCode = true
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.paste("482 916")
    expect(values()).toEqual(["4", "8", "2", "9", "1", "6"])
    await waitFor(() => expect(verifyCalls).toHaveLength(1))
    expect(verifyCalls[0]).toContain("482916")
  })

  it("ignores pasted text with no digits", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.paste("abc")
    expect(values()).toEqual(["", "", "", "", "", ""])
  })

  it("after a wrong code the boxes clear and the first one is focused again", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(boxes()[0])
    await user.keyboard("111111")
    await waitFor(() => expect(verifyCalls).toHaveLength(1))
    await waitFor(() => expect(values()).toEqual(["", "", "", "", "", ""]))
    await waitFor(() => expect(boxes()[0]).toHaveFocus())
    fireEvent.keyDown(boxes()[0], { key: "Backspace" })
    expect(values()).toEqual(["", "", "", "", "", ""])
  })
})
