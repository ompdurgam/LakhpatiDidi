/** What kind of livelihood an income source is (derived from the survey's source name). */
export type SourceKind =
  | "farming"
  | "horticulture"
  | "livestock"
  | "fisheries"
  | "forest"
  | "nonfarm"
  | "tourism"
  | "wage"
  | "migration"
  | "other"

/** Everything the rules know about a Didi. */
export type Profile = {
  income: number
  activeSources: number
  category: string
  special: string
  kinds: Set<SourceKind>
  /** Block name in the request language (for "where to apply"). */
  block: string
}

/** How well a scheme fits one Didi, with the reasons shown to her and the surveyor. */
export type Fit = {
  score: number
  why: string
  /** Eligibility checks: true = confirmed from her data, false = still to be verified. */
  checks: [boolean, string][]
  docs: string[]
  office: string
}

export type Rule = {
  code: string
  /** Estimated extra annual income (₹) when the scheme is taken up. */
  gain: number
  fit: (profile: Profile) => Fit | null
}

export type Recommendation = Fit & { code: string; gain: number }
