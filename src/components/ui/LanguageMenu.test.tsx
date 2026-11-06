import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import i18n from "@/i18n"

import { LanguageChooser } from "./LanguageChooser"
import { LanguageMenu } from "./LanguageMenu"

afterEach(async () => {
  await i18n.changeLanguage("hi")
  localStorage.clear()
})

describe("LanguageMenu", () => {
  it("shows the current language and lists each language in its own script", () => {
    render(<LanguageMenu />)
    const button = screen.getByRole("button", { name: /हिन्दी/ })
    expect(button).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(button)
    const english = screen.getByRole("menuitemradio", { name: "English" })
    expect(english).toHaveAttribute("lang", "en")
    expect(screen.getByRole("menuitemradio", { name: "हिन्दी" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
  })

  it("switches language, document lang and title, and remembers the choice", () => {
    render(<LanguageMenu />)
    fireEvent.click(screen.getByRole("button", { name: /हिन्दी/ }))
    fireEvent.click(screen.getByRole("menuitemradio", { name: "English" }))
    expect(i18n.language).toBe("en")
    expect(document.documentElement.lang).toBe("en")
    expect(document.title).toMatch(/Lakhpati Convergence Portal/)
    expect(localStorage.getItem("ld.lang")).toBe("en")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("closes on Escape", () => {
    render(<LanguageMenu />)
    fireEvent.click(screen.getByRole("button", { name: /हिन्दी/ }))
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" })
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })
})

describe("LanguageChooser", () => {
  it("asks on the first visit only", () => {
    localStorage.clear()
    const { unmount } = render(<LanguageChooser />)
    fireEvent.click(screen.getByRole("button", { name: /English/ }))
    expect(i18n.language).toBe("en")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    unmount()
    render(<LanguageChooser />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
