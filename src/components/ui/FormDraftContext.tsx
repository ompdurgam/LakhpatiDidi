import { createContext } from "react"

export const SurveyDraftContext = createContext<Record<string, string> | null>(null)
