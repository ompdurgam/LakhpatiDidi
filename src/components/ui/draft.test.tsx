import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ChipField, ChipGroup } from "./ChipGroup"
import { SurveyDraftContext } from "./draft"
import { DraftScope } from "./DraftScope"

afterEach(cleanup)

function Field({ draft }: { draft: Record<string, string> }) {
  return (
    <SurveyDraftContext.Provider value={draft}>
      <DraftScope name="E">
        <ChipField label="कहाँ बेचते हैं">
          <ChipGroup options={["मंडी", "हाट"]} selected={[]} single />
        </ChipField>
      </DraftScope>
    </SurveyDraftContext.Provider>
  )
}

describe("survey draft", () => {
  it("saves a chip answer under its section and restores it", () => {
    const draft: Record<string, string> = {}
    render(<Field draft={draft} />)
    fireEvent.click(screen.getByRole("button", { name: /मंडी/ }))
    expect(draft["E • कहाँ बेचते हैं"]).toBe("मंडी")

    // Leaving the section and coming back shows the saved answer.
    cleanup()
    render(<Field draft={draft} />)
    expect(screen.getByRole("button", { name: /मंडी/ })).toHaveAttribute("aria-pressed", "true")
  })
})
