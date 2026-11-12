import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"

import { api, ApiError } from "@/api/client"
import { useRefreshData } from "@/api/hooks"
import { SurveyDraftContext } from "@/components/ui/draft"
import { Icon } from "@/components/ui/Icon"
import { clearDraft, loadDraft, queueSurvey, saveDraft } from "@/features/survey/offlineSurvey"
import { IdentificationForm } from "@/features/survey/sections/IdentificationForm"
import { IncomeBaselineForm } from "@/features/survey/sections/IncomeBaselineForm"
import { LivelihoodSection } from "@/features/survey/sections/livelihood/LivelihoodSection"
import { LoansForm } from "@/features/survey/sections/LoansForm"
import { SchemeSaturationForm } from "@/features/survey/sections/schemes/SchemeSaturationForm"
import {
  prefillDraft,
  type SurveyHousehold,
  useRefreshSurveyList,
  useSurveyHousehold,
} from "@/features/survey/surveyHouseholds"
import { SurveyReview } from "@/features/survey/SurveyReview"
import { SurveySuccess } from "@/features/survey/SurveySuccess"
import type { IncomeEntry, SurveyResult } from "@/features/survey/types"
import { useTr } from "@/i18n/tr"

type SurveyFormProps = {
  step: number
  setStep: (step: number) => void
  sections: string[]
  selectedLivelihoods: string[]
  setSelectedLivelihoods: (items: string[]) => void
  onNotify: (message: string) => void
  onSeeRecommendations: () => void
  onNextFamily: () => void
}

/** /field/survey/:householdId opens a Didi on record prefilled; /field/survey a new one. */
export function SurveyForm(props: SurveyFormProps) {
  const tr = useTr()
  const { householdId } = useParams()
  const household = useSurveyHousehold(householdId)
  if (householdId && !household.data)
    return (
      <div className="phone-content survey-form">
        <p className="home-empty" role={household.isError ? "alert" : undefined}>
          {household.isError
            ? (household.error as Error).message
            : tr("दीदी का रिकॉर्ड लोड हो रहा है…")}
        </p>
      </div>
    )
  return <SurveyFormBody key={householdId ?? "new"} {...props} household={household.data} />
}

function SurveyFormBody({
  household,
  step,
  setStep,
  sections,
  selectedLivelihoods,
  setSelectedLivelihoods,
  onNotify,
  onSeeRecommendations,
  onNextFamily,
}: SurveyFormProps & { household?: SurveyHousehold }) {
  const tr = useTr()
  const [submitted, setSubmitted] = useState<SurveyResult | null>(null)
  const [queued, setQueued] = useState(false)
  const [submitError, setSubmitError] = useState("")
  // The copy of this survey saved on the phone, if the CRP left it unfinished.
  const [local] = useState(() => loadDraft(household?.code))
  // Every TextControl / SelectControl in the form writes its value here (keyed by label).
  // A Didi on record starts from her details (name, place, SHG…), then any saved draft.
  const [draft] = useState<Record<string, string>>(() => ({
    ...(household ? prefillDraft(household) : {}),
    ...(local?.responses ?? {}),
  }))
  const refreshData = useRefreshData()
  const refreshList = useRefreshSurveyList()
  const submitSurvey = async (consentMethod: string) => {
    setSubmitError("")
    const body = {
      householdCode: household?.code,
      responses: draft,
      incomeEntries,
      sections: sections.map((name) => name.trim().charAt(0)),
      consentMethod,
    }
    try {
      const result = await api<SurveyResult>("/surveys", { body })
      clearDraft(household?.code)
      setSubmitted(result)
      onNotify(
        result.created
          ? tr("सर्वे जमा • नया परिवार {{code}}", { code: result.hhCode })
          : tr("सर्वे जमा • {{code}} अपडेट हुआ", { code: result.hhCode }),
      )
      void refreshData()
      void refreshList()
    } catch (e) {
      // No network: keep it in the phone's outbox; it is sent when the connection returns.
      if (e instanceof ApiError && e.status === 0) {
        queueSurvey(draft["SHG सदस्य का नाम"] || household?.name || "", body)
        clearDraft(household?.code)
        setQueued(true)
        onNotify(tr("इंटरनेट नहीं — सर्वे फोन में सुरक्षित, नेटवर्क आते ही अपने आप भेजा जाएगा"))
        return
      }
      setSubmitError((e as Error).message)
      onNotify((e as Error).message)
    }
  }
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(
    () =>
      local?.incomeEntries ?? [
        { name: "फसल/खेती", months: [], gross: 0, cost: 0 },
        { name: "अन्य कृषि/बागवानी", months: [], gross: 0, cost: 0 },
        { name: "पशुपालन", months: [], gross: 0, cost: 0 },
        { name: "मत्स्य पालन", months: [], gross: 0, cost: 0 },
        { name: "वन उपज", months: [], gross: 0, cost: 0 },
        { name: "गैर-कृषि उद्यम", months: [], gross: 0, cost: 0 },
        { name: "पर्यटन", months: [], gross: 0, cost: 0 },
        { name: "स्थानीय मजदूरी", months: [], gross: 0, cost: 0 },
        { name: "प्रवासन/रोजगार", months: [], gross: 0, cost: 0 },
        { name: "अन्य", months: [], gross: 0, cost: 0 },
      ],
  )

  // Reopening an unfinished survey returns to where the CRP stopped.
  useEffect(() => {
    if (!local) return
    setStep(local.step)
    setSelectedLivelihoods(local.livelihoods)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the form opens
  }, [])
  // Save the survey on the phone every few seconds while it is being filled.
  const latest = useRef({ incomeEntries, step, selectedLivelihoods })
  latest.current = { incomeEntries, step, selectedLivelihoods }
  const done = Boolean(submitted) || queued
  useEffect(() => {
    if (done) return
    const save = () =>
      saveDraft(household?.code, {
        responses: draft,
        incomeEntries: latest.current.incomeEntries,
        step: latest.current.step,
        livelihoods: latest.current.selectedLivelihoods,
        savedAt: new Date().toISOString(),
      })
    const timer = window.setInterval(save, 3000)
    return () => {
      window.clearInterval(timer)
      save()
    }
  }, [done, draft, household?.code])
  const conditionalCodes = ["E", "F", "G", "H", "I", "J", "K"]
  const isApplicable = (index: number) =>
    index < 4 || index === 11 || selectedLivelihoods.includes(conditionalCodes[index - 4])
  // A new section opens at its first field: reset the form's own scroll (phone frame)
  // and bring the form's top into view (when the page itself scrolls).
  const formTop = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = formTop.current
    if (!el) return
    el.scrollTop = 0
    if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" })
  }, [step])
  const nextStep = () => {
    for (let index = step + 1; index < sections.length; index += 1) {
      if (isApplicable(index)) {
        setStep(index)
        return
      }
    }
  }
  const previousStep = () => {
    for (let index = step - 1; index >= 0; index -= 1) {
      if (isApplicable(index)) {
        setStep(index)
        return
      }
    }
  }
  const fields =
    step === 1
      ? [
          ["फसल / खेती आय", "₹32,000"],
          ["NTFP आय", "₹18,500"],
          ["मजदूरी आय", "₹28,000"],
          ["वार्षिक शुद्ध आय", "₹78,500"],
        ]
      : step === 2
        ? [
            ["ऋण स्रोत", "SHG / CIF"],
            ["बकाया राशि", "₹12,000"],
            ["ऋण उद्देश्य", "कृषि निवेश"],
            ["वर्ष", "2025"],
          ]
        : step === 3
          ? [
              ["MGNREGA जॉब कार्ड", "प्राप्त"],
              ["PMAY-G", "आवेदन लंबित"],
              ["जन धन खाता", "प्राप्त"],
              ["आयुष्मान कार्ड", "आवेदन नहीं"],
            ]
          : [
              ["मुख्य गतिविधि", sections[step]],
              ["वार्षिक शुद्ध आय", step === 7 ? "₹18,500" : "₹32,000"],
              ["सहायता चाहिए", "उपकरण / बाजार संपर्क"],
              ["प्रशिक्षण / ऋण", "हाँ / हाँ"],
            ]
  const heading =
    step === 0
      ? tr("A. पहचान और परिवार")
      : step === 1
        ? tr("B. आय बेसलाइन")
        : step === 2
          ? tr("C. ऋण और वित्तीय जोखिम")
          : step === 3
            ? tr("D. योजना संतृप्ति")
            : step === 11
              ? tr("समीक्षा और सहमति")
              : sections[step]
  if (queued)
    return (
      <div className="phone-content survey-form">
        <div className="survey-queued">
          <Icon name="clock" size={28} />
          <h3>{tr("सर्वे फोन में सुरक्षित")}</h3>
          <p>{tr("अभी इंटरनेट नहीं है। नेटवर्क मिलते ही यह सर्वे अपने आप भेज दिया जाएगा।")}</p>
          <button className="primary" onClick={onNextFamily}>
            {tr("अगली दीदी")}
          </button>
        </div>
      </div>
    )
  if (submitted)
    return (
      <SurveySuccess
        result={submitted}
        onSeeRecommendations={onSeeRecommendations}
        onNextFamily={onNextFamily}
      />
    )
  return (
    <SurveyDraftContext.Provider value={draft}>
      <div className="phone-content survey-form" ref={formTop}>
        <div className="form-top">
          <button onClick={previousStep}>‹</button>
          <div>
            <strong>{tr("परिवार सर्वे")}</strong>
            <span>
              {household ? `${household.name} • ${household.code}` : tr("ड्राफ्ट स्वतः सुरक्षित")}
            </span>
          </div>
          <b>
            {step + 1}/{sections.length}
          </b>
        </div>
        {local && (
          <div className="draft-restored" role="status">
            <Icon name="check" size={14} />
            <span>
              {tr("फोन में सहेजा अधूरा सर्वे खोला गया • {{at}}", {
                at: new Date(local.savedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </span>
            <button
              className="text-button"
              onClick={() => {
                clearDraft(household?.code)
                window.location.reload()
              }}
            >
              {tr("नया शुरू करें")}
            </button>
          </div>
        )}
        <div className="mini-stepper">
          {sections.map((section, index) => (
            <button
              key={section}
              className={`${index <= step && isApplicable(index) ? "done" : ""} ${
                !isApplicable(index) ? "not-applicable" : ""
              }`}
              onClick={() => isApplicable(index) && setStep(index)}
            >
              <i>{index < step ? "✓" : index + 1}</i>
              <span>{section}</span>
              {!isApplicable(index) && <small>{tr("लागू नहीं")}</small>}
            </button>
          ))}
        </div>
        <h3>{heading}</h3>
        {step === 0 ? (
          <IdentificationForm
            household={household}
            selectedLivelihoods={selectedLivelihoods}
            setSelectedLivelihoods={setSelectedLivelihoods}
            onNotify={onNotify}
          />
        ) : step === 1 ? (
          <IncomeBaselineForm entries={incomeEntries} setEntries={setIncomeEntries} />
        ) : step === 2 ? (
          <LoansForm />
        ) : step === 3 ? (
          <SchemeSaturationForm />
        ) : step >= 4 && step <= 10 ? (
          <LivelihoodSection step={step} baselineEntries={incomeEntries} />
        ) : step < 11 ? (
          <div className="mobile-form-fields">
            {fields.map(([label, value]) => (
              <label key={label}>
                <span>{tr(label)}</span>
                <div>
                  {tr(value)}
                  <Icon name="chevron" size={15} />
                </div>
              </label>
            ))}
          </div>
        ) : (
          <SurveyReview
            sections={sections}
            isApplicable={isApplicable}
            setStep={setStep}
            incomeEntries={incomeEntries}
            onSubmit={submitSurvey}
          />
        )}
        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}
        {step < 11 && (
          <div className="mobile-form-actions">
            <button className="secondary" onClick={() => onNotify(tr("ड्राफ्ट सुरक्षित किया गया"))}>
              {tr("ड्राफ्ट")}
            </button>
            <button className="primary" onClick={nextStep}>
              {tr("सहेजें और आगे")} <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
      </div>
    </SurveyDraftContext.Provider>
  )
}
