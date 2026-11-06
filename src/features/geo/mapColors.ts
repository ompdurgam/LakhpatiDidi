/** Fill colour by share of surveyed households that are Lakhpati. */
export function shade(households: number, lakhpati: number) {
  if (!households) return "#e3e8e3"
  const share = lakhpati / households
  return share >= 0.5 ? "#1f6b3a" : share >= 0.25 ? "#4b875f" : share > 0 ? "#9cc5a8" : "#cfe3d4"
}
