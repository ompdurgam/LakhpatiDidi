import { useState } from "react"
import { Link } from "react-router"

import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { CostStep } from "./CostStep"
import { BeneficiaryStep, DocumentsStep, ProjectStep, VerifyStep } from "./DprSteps"
import { DprSuccess } from "./DprSuccess"
import { EconomicsStep } from "./EconomicsStep"
import { financing, totalOf } from "./finance"
import { PreviewStep } from "./PreviewStep"
import type { CostItem, DprData, SentDpr } from "./types"
import { useDprActions, useDprData } from "./useDpr"

const STEPS = ["लाभार्थी", "परियोजना", "लागत", "अर्थशास्त्र", "दस्तावेज़", "सत्यापन", "पूर्वावलोकन"]

/** Loads one Didi's DPR for a scheme and shows the step-by-step builder. */
export function DprBuilder({
  code,
  scheme,
  compact,
}: {
  code: string
  scheme: string
  compact: boolean
}) {
  const tr = useTr()
  const { data, error, loading } = useDprData(code, scheme)
  if (error || !data) {
    return (
      <div className={compact ? "phone-content" : "dpr-workspace"}>
        <Link to="/field/dpr" className="back-link">
          <Icon name="arrow" size={14} className="flip" /> DPR
        </Link>
        <EmptyState>{error || (loading ? tr("लोड हो रहा है…") : "")}</EmptyState>
      </div>
    )
  }
  return <DprForm key={`${code}/${scheme}`} data={data} compact={compact} />
}

function DprForm({ data, compact }: { data: DprData; compact: boolean }) {
  const tr = useTr()
  const { save, send } = useDprActions(data.household.code, data.scheme.code)
  const [step, setStep] = useState(Math.min(7, Math.max(1, data.draft.step)))
  const [items, setItems] = useState<CostItem[]>(data.draft.items)
  const [remarks, setRemarks] = useState(data.draft.remarks)
  const [documents, setDocuments] = useState(data.draft.documents)
  const [sent, setSent] = useState<SentDpr | null>(null)
  const [problem, setProblem] = useState("")

  const money = financing(totalOf(items), data.scheme.subsidyPercent, data.scheme.maxCost)
  const busy = save.isPending || send.isPending

  if (data.application || sent) {
    return (
      <DprSuccess
        compact={compact}
        sent={
          sent ?? {
            applicationCode: data.application?.code ?? "",
            department: data.scheme.department,
            office: data.scheme.office,
            officer: null,
            slaDue: "",
            scheme: data.scheme.name,
            didi: data.household.name,
          }
        }
      />
    )
  }

  const persist = (to: number) => save.mutateAsync({ step: to, items, remarks, documents })
  const fail = (e: unknown) => setProblem(e instanceof Error ? e.message : tr("अनुरोध विफल रहा"))

  const next = async () => {
    setProblem("")
    if (step === 3 && money.total <= 0) return setProblem(tr("परियोजना लागत शून्य नहीं हो सकती"))
    try {
      if (step < 7) {
        await persist(step + 1)
        setStep(step + 1)
      } else {
        await persist(7)
        setSent(await send.mutateAsync())
      }
    } catch (e) {
      fail(e)
    }
  }
  const saveDraft = async () => {
    setProblem("")
    try {
      await persist(step)
    } catch (e) {
      fail(e)
    }
  }
  const toggleDoc = (doc: string) =>
    setDocuments(documents.includes(doc) ? documents.filter((d) => d !== doc) : [...documents, doc])

  const statusLabel = data.draft.status === "filled" ? tr("भरा हुआ") : tr("ड्राफ्ट")
  return (
    <div className={compact ? "phone-content compact-dpr" : "dpr-workspace"}>
      <Link to="/field/dpr" className="back-link">
        <Icon name="arrow" size={14} className="flip" /> {tr("DPR सूची")}
      </Link>
      <div className="dpr-title">
        <div>
          <span className="eyebrow">{data.household.code}</span>
          <h2>{data.scheme.name}</h2>
          <p>
            {data.household.name} • {data.scheme.department}
          </p>
        </div>
        {!compact && <span className="status amber">{statusLabel}</span>}
      </div>
      <div className="dpr-steps">
        {STEPS.map((name, index) => (
          <button
            key={name}
            type="button"
            className={index + 1 === step ? "active" : index + 1 < step ? "done" : ""}
            onClick={() => setStep(index + 1)}
          >
            <i>{index + 1 < step ? "✓" : index + 1}</i>
            <span>{tr(name)}</span>
          </button>
        ))}
      </div>
      <div className="dpr-panel">
        <h3>
          {step}. {tr(STEPS[step - 1])}
        </h3>
        {step === 1 && <BeneficiaryStep data={data} />}
        {step === 2 && <ProjectStep data={data} />}
        {step === 3 && (
          <CostStep
            items={items}
            setItems={setItems}
            money={money}
            subsidyPercent={data.scheme.subsidyPercent}
          />
        )}
        {step === 4 && <EconomicsStep data={data} money={money} />}
        {step === 5 && <DocumentsStep docs={data.fit.docs} have={documents} onToggle={toggleDoc} />}
        {step === 6 && (
          <VerifyStep checks={data.fit.checks} remarks={remarks} onRemarks={setRemarks} />
        )}
        {step === 7 && (
          <PreviewStep
            data={data}
            items={items}
            money={money}
            documents={documents}
            remarks={remarks}
          />
        )}
      </div>
      {problem && (
        <p className="dpr-problem" role="alert">
          {problem}
        </p>
      )}
      <div className="dpr-actions">
        <button
          type="button"
          className="secondary"
          disabled={step === 1 || busy}
          onClick={() => setStep(step - 1)}
        >
          {tr("पीछे")}
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={saveDraft}>
          {tr("ड्राफ्ट सहेजें")}
        </button>
        <button type="button" className="primary" disabled={busy} onClick={next}>
          {step < 7 ? tr("सहेजें और आगे") : tr("विभाग को भेजें")} <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  )
}
