// Name matching between the PLD list (LokOS spellings) and the LGD-based master
// tables. Pure functions — the database side lives in resolvePlaces.ts.

/** Upper-case letters and digits only: "Bade Kilepal-02" → "BADEKILEPAL02". */
export const normalise = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, "")

/** Characters in common blocks (Ratcliff/Obershelp, as Python's difflib). */
function matchingChars(a: string, b: string): number {
  if (!a || !b) return 0
  let best = 0
  let endA = 0
  let endB = 0
  let prev = new Array<number>(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1).fill(0)
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] !== b[j - 1]) continue
      row[j] = prev[j - 1] + 1
      if (row[j] > best) [best, endA, endB] = [row[j], i, j]
    }
    prev = row
  }
  if (!best) return 0
  return (
    best +
    matchingChars(a.slice(0, endA - best), b.slice(0, endB - best)) +
    matchingChars(a.slice(endA), b.slice(endB))
  )
}

/** 0…1 similarity of two normalised names. */
export const similarity = (a: string, b: string) =>
  a === b ? 1 : (2 * matchingChars(a, b)) / (a.length + b.length || 1)

/**
 * The candidate whose (normalised) name equals `name`, else the single clearly
 * best fuzzy match: at least `cutoff` similar and `margin` ahead of the runner-up.
 */
export function bestMatch<T>(
  name: string,
  candidates: Map<string, T>,
  cutoff = 0.8,
  margin = 0.05,
): T | undefined {
  const exact = candidates.get(name)
  if (exact !== undefined) return exact
  const scored = [...candidates.keys()]
    .map((key) => ({ key, score: similarity(name, key) }))
    .sort((x, y) => y.score - x.score)
  const [first, second] = scored
  if (!first || first.score < cutoff) return undefined
  if (second && first.score - second.score < margin) return undefined
  return candidates.get(first.key)
}

/**
 * Picks the block whose panchayats share the most names with the sheet's
 * panchayats for that block (spellings like GHARGODA / GHARGHODA, or
 * GAURELLA / GAURELLA-1, differ too much to trust the block name alone).
 */
export function pickByOverlap<T>(
  name: string,
  childNames: Set<string>,
  options: { id: T; name: string; childNames: Set<string> }[],
): T | undefined {
  const scored = options.map((o) => ({
    id: o.id,
    overlap: [...childNames].filter((c) => o.childNames.has(c)).length,
    score: similarity(name, o.name),
  }))
  scored.sort((x, y) => y.overlap - x.overlap || y.score - x.score)
  const top = scored[0]
  return top && (top.overlap > 0 || top.score >= 0.8) ? top.id : undefined
}

/** LokOS district names that differ from LGD beyond spelling. */
export const districtAliases: Record<string, string> = { KAWARDHA: "KABIRDHAM" }

const categories: Record<string, "ST" | "SC" | "OBC" | "GEN" | "OTHER"> = {
  ST: "ST",
  SC: "SC",
  OBC: "OBC",
  GEN: "GEN",
  GENERAL: "GEN",
  OTHER: "OTHER",
}

export const socialCategory = (value: string) => categories[normalise(value)] ?? "OTHER"
