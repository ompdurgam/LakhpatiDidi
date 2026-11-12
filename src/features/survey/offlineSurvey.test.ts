import { beforeEach, describe, expect, it, vi } from "vitest"

const post = vi.fn()
vi.mock("@/api/client", () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  }
  return { ApiError, api: (...args: unknown[]) => post(...args) }
})

const { ApiError } = await import("@/api/client")
const { clearDraft, flushOutbox, loadDraft, queueSurvey, readOutbox, saveDraft } =
  await import("./offlineSurvey")

describe("offline surveys", () => {
  beforeEach(() => {
    localStorage.clear()
    post.mockReset()
  })

  it("keeps a draft per household until it is cleared", () => {
    saveDraft("HH-1", {
      responses: { आयु: "34" },
      incomeEntries: [],
      step: 3,
      livelihoods: ["E"],
      savedAt: "2026-11-12T10:00:00Z",
    })
    expect(loadDraft("HH-1")?.step).toBe(3)
    expect(loadDraft("HH-2")).toBeNull()
    clearDraft("HH-1")
    expect(loadDraft("HH-1")).toBeNull()
  })

  it("sends queued surveys once the network is back", async () => {
    queueSurvey("रीना", { householdCode: "HH-1" })
    post.mockRejectedValueOnce(new ApiError(0, "offline"))
    expect(await flushOutbox()).toBe(0)
    expect(readOutbox()).toHaveLength(1)

    post.mockResolvedValueOnce({ hhCode: "HH-1" })
    expect(await flushOutbox()).toBe(1)
    expect(readOutbox()).toHaveLength(0)
  })

  it("keeps a survey the server refused, with the reason, instead of retrying it", async () => {
    queueSurvey("रीना", { householdCode: "HH-1" })
    post.mockRejectedValueOnce(new ApiError(400, "गाँव चुनें"))
    await flushOutbox()
    expect(readOutbox()[0].error).toBe("गाँव चुनें")
    await flushOutbox()
    expect(post).toHaveBeenCalledTimes(1)
  })
})
