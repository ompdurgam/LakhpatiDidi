import { createContext, useContext, useEffect, useState } from "react"

/**
 * The survey being filled: every answer, keyed by its (scoped) label. The whole
 * object is submitted as the survey's responses, and a section reads its answers
 * back from it when the CRP returns to that section.
 */
export const SurveyDraftContext = createContext<Record<string, string> | null>(null)

/** Prefix for draft keys, so the same label in two sections / rows keeps two answers. */
export const DraftScopeContext = createContext("")

/** The draft key for a label in the current scope. */
export function useDraftKey(label: string) {
  const scope = useContext(DraftScopeContext)
  return scope ? `${scope} • ${label}` : label
}

const encode = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value))

function decode<T>(raw: string | undefined, initial: T): T {
  if (raw === undefined) return initial
  if (typeof initial === "string") return raw as T
  try {
    return JSON.parse(raw) as T
  } catch {
    return initial
  }
}

/**
 * useState whose value is also kept in the survey draft under `label`: it is
 * submitted with the survey and restored when the section is opened again.
 * Outside a survey it behaves like plain useState.
 */
export function useDraftState<T>(label: string, initial: T) {
  const draft = useContext(SurveyDraftContext)
  const key = useDraftKey(label)
  const [value, setValue] = useState<T>(() => decode(draft?.[key], initial))
  useEffect(() => {
    if (draft) draft[key] = encode(value)
  }, [draft, key, value])
  return [value, setValue] as const
}
