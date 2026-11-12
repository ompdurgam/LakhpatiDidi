import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { useTr } from "@/i18n/tr"
import { rupees } from "@/lib/money"
import { useUi } from "@/stores/ui"

import { DidiSchemeCard } from "./DidiSchemeCard"
import { useAnswerScheme, useDidiSchemes } from "./useDidiSchemes"

/** "My schemes": what suits her, how far it takes her income, and schemes she is entitled to. */
export function DidiSchemes() {
  const tr = useTr()
  const notify = useUi((s) => s.notify)
  const { data, isLoading, error } = useDidiSchemes()
  const answer = useAnswerScheme()
  if (error) return <EmptyState>{(error as Error).message}</EmptyState>
  if (isLoading || !data) return <PageSkeleton />

  const { leverage, recommendations, entitlements } = data
  const onAnswer = (code: string, value: "yes" | "no") =>
    answer.mutate(
      { code, answer: value },
      {
        onSuccess: (result) => notify(result.message),
        onError: (e) => notify(e.message),
      },
    )

  return (
    <div className="page didi-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{tr("आपके लिए")}</span>
          <h2>{tr("मेरी योजनाएँ")}</h2>
          <p>{tr("आपके सर्वे के आधार पर ये योजनाएँ आपकी आय बढ़ा सकती हैं")}</p>
        </div>
      </div>

      {recommendations.length > 0 && (
        <Card className="didi-scheme-summary">
          <div>
            <span>{tr("अभी की वार्षिक आय")}</span>
            <strong>{rupees(leverage.current)}</strong>
          </div>
          <Icon name="arrow" size={18} />
          <div>
            <span>{tr("योजनाओं के बाद संभावित आय")}</span>
            <strong className="positive">{rupees(leverage.projected)}</strong>
          </div>
          <p className={leverage.reachesTarget ? "yes" : ""}>
            {leverage.reachesTarget
              ? tr("इन योजनाओं से आप लखपति दीदी (₹1,00,000/वर्ष) बन सकती हैं")
              : tr("इन योजनाओं से आय +{{extra}} बढ़ सकती है", { extra: rupees(leverage.extra) })}
          </p>
        </Card>
      )}

      {recommendations.length ? (
        <div className="rec-cards">
          {recommendations.map((fit, index) => (
            <DidiSchemeCard
              key={fit.code}
              fit={fit}
              rank={index + 1}
              busy={answer.isPending}
              onAnswer={(value) => onAnswer(fit.code, value)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState>
            {tr("अभी आपके लिए कोई नई योजना नहीं है। सर्वे अपडेट होने पर यहाँ दिखेगी।")}
          </EmptyState>
        </Card>
      )}

      {entitlements.length > 0 && (
        <Card
          title={tr("आपके हक़ की योजनाएँ")}
          subtitle={tr("आप इनकी पात्र हैं पर अभी लाभ नहीं मिला — CRP से बात करें")}
        >
          <ul className="didi-sources">
            {entitlements.map((e) => (
              <li key={e.code}>
                <div>
                  <strong>{e.name}</strong>
                  <small>{e.department}</small>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
