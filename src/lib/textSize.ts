import { useSyncExternalStore } from "react"

/**
 * Text-size setting (GIGW "A− A A+"). Every font size in the stylesheets is
 * `calc(<size> * var(--text-scale))`, so changing the variable resizes all text.
 */
export const TEXT_SIZES = { small: 0.9, normal: 1, large: 1.15, larger: 1.3 } as const
export type TextSize = keyof typeof TEXT_SIZES
const ORDER: TextSize[] = ["small", "normal", "large", "larger"]
const STORAGE_KEY = "ld.textSize"

const listeners = new Set<() => void>()

function saved(): TextSize {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value && value in TEXT_SIZES ? (value as TextSize) : "normal"
  } catch {
    return "normal"
  }
}

let current: TextSize = saved()

function apply(size: TextSize) {
  document.documentElement.style.setProperty("--text-scale", String(TEXT_SIZES[size]))
  document.documentElement.dataset.textSize = size
}
apply(current)

export function setTextSize(size: TextSize) {
  current = size
  apply(size)
  try {
    localStorage.setItem(STORAGE_KEY, size)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((listener) => listener())
}

/** One step smaller / larger, clamped to the available sizes. */
export function stepTextSize(direction: -1 | 1) {
  const index = ORDER.indexOf(current) + direction
  if (index >= 0 && index < ORDER.length) setTextSize(ORDER[index])
}

export const canStep = (size: TextSize, direction: -1 | 1) => {
  const index = ORDER.indexOf(size) + direction
  return index >= 0 && index < ORDER.length
}

export function useTextSize() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
