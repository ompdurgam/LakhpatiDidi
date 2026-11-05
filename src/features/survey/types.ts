export type SurveyResult = {
  hhCode: string
  name: string
  village: string
  created: boolean
  submittedAt: string
}

export type IncomeEntry = {
  name: string
  months: string[]
  gross: number
  cost: number
}

export type LoanEntry = {
  source: string
  taken: string
  purpose: string
  principal: number
  outstanding: number
  rate: number
  year: number
}

export type CropRow = {
  crop: string
  season: string
  acres: number
  production: number
  sold: number
  consumed: number
}

export type NtfpRow = { produce: string; months: string; days: number; gap: string }

export type WageRow = { member: string; skill: string; months: number }
