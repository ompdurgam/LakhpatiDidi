import { AgricultureSection } from "@/features/survey/sections/livelihood/AgricultureSection"
import { FisheriesSection } from "@/features/survey/sections/livelihood/FisheriesSection"
import { ForestProduceSection } from "@/features/survey/sections/livelihood/ForestProduceSection"
import { LivestockSection } from "@/features/survey/sections/livelihood/LivestockSection"
import { NonFarmSection } from "@/features/survey/sections/livelihood/NonFarmSection"
import { TourismSection } from "@/features/survey/sections/livelihood/TourismSection"
import { WageSection } from "@/features/survey/sections/livelihood/WageSection"
import type { IncomeEntry } from "@/features/survey/types"

export function LivelihoodSection({
  step,
  baselineEntries,
}: {
  step: number
  baselineEntries: IncomeEntry[]
}) {
  const baseline = (names: string[]) =>
    baselineEntries
      .filter((entry) => names.includes(entry.name))
      .reduce((sum, entry) => sum + entry.gross - entry.cost, 0)
  if (step === 4)
    return <AgricultureSection baseline={baseline(["फसल/खेती", "अन्य कृषि/बागवानी"])} />
  if (step === 5) return <LivestockSection baseline={baseline(["पशुपालन"])} />
  if (step === 6) return <FisheriesSection baseline={baseline(["मत्स्य पालन"])} />
  if (step === 7) return <ForestProduceSection baseline={baseline(["वन उपज"])} />
  if (step === 8) return <NonFarmSection baseline={baseline(["गैर-कृषि उद्यम"])} />
  if (step === 9) return <TourismSection baseline={baseline(["पर्यटन"])} />
  return <WageSection baseline={baseline(["स्थानीय मजदूरी", "प्रवासन/रोजगार"])} />
}
