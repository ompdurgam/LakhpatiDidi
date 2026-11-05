export type RecommendationScheme = {
  key: string
  name: string
  dept: string
  benefit: string
  score: string
  why: string
  eligibility: [boolean, string][]
  docs: string[]
  apply: string
}
