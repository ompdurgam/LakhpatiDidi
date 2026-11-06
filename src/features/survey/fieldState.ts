/** Shared state the field workspace hands to its mobile and desktop views. */
export type FieldState = {
  onNotify: (message: string) => void
  screen: string
  setScreen: (screen: string) => void
  surveyStep: number
  setSurveyStep: (step: number) => void
  sections: string[]
  selectedLivelihoods: string[]
  setSelectedLivelihoods: (ids: string[]) => void
}
