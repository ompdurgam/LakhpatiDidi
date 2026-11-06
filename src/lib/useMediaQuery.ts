import { useSyncExternalStore } from "react"

/** Live result of a CSS media query (re-renders when it flips). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Matches the app's phone breakpoint (see the 760px rules in the styles). */
export const MOBILE_QUERY = "(max-width: 760px)"

export const useIsMobile = () => useMediaQuery(MOBILE_QUERY)
