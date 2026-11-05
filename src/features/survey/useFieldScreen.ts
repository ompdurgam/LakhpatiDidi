import { useLocation, useNavigate } from "react-router"

/** Field-app screens and their URLs (/field/...). */
const screenPaths: Record<string, string> = {
  home: "/field",
  village: "/field/village",
  survey: "/field/survey",
  recommend: "/field/recommendations",
  dpr: "/field/dpr",
  tracker: "/field/households",
}

const pathScreens: [string, string][] = [
  ["/field/village", "village"],
  ["/field/survey", "survey"],
  ["/field/recommendations", "recommend"],
  ["/field/dpr", "dpr"],
  ["/field/households", "tracker"],
  // TODO(phase 3): MonthlyIncomeRegister replaces the tracker here.
  ["/field/income", "tracker"],
]

/** The prototype kept the field screen in state; it now lives in the URL. */
export function useFieldScreen() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const screen =
    pathScreens.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ??
    "home"
  const setScreen = (next: string) => navigate(screenPaths[next] ?? "/field")
  return { screen, setScreen }
}
