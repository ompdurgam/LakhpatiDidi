import { useEffect, useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { EmptyState } from "@/components/ui/EmptyState"
import { useTr } from "@/i18n/tr"
import { useUi } from "@/stores/ui"

import {
  type Answer,
  COMMUNITY_FACILITIES,
  completion,
  emptyResponses,
  INSTITUTIONS,
  LIVELIHOOD_INFRA,
  RESOURCES,
  type VillageResponses,
} from "./catalog"
import { FacilityGroup } from "./FacilityGroup"
import { InstitutionRow } from "./InstitutionRow"
import {
  useSaveVillageProfile,
  useVillageDraft,
  useVillageOptions,
  useVillageProfile,
} from "./useVillageProfile"

/** Village profile: pick a village in the CRP's area, then fill and save its profile. */
export function VillageProfile({ setScreen }: { setScreen: (screen: string) => void }) {
  const [code, setCode] = useState<string>()
  return code ? (
    <VillageForm code={code} onBack={() => setCode(undefined)} />
  ) : (
    <VillagePicker onPick={setCode} onBack={() => setScreen("home")} />
  )
}

function VillagePicker({ onPick, onBack }: { onPick: (code: string) => void; onBack: () => void }) {
  const tr = useTr()
  const [q, setQ] = useState("")
  const { data, isLoading } = useVillageOptions(q)
  return (
    <div className="phone-content village-profile">
      <div className="village-header">
        <button onClick={onBack}>‹</button>
        <div>
          <small>{tr("ग्राम प्रोफ़ाइल")}</small>
          <strong>{tr("गाँव चुनें")}</strong>
        </div>
      </div>
      <label className="text-control">
        <input
          value={q}
          placeholder={tr("गाँव का नाम या LGD कोड")}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {isLoading ? (
        <p className="empty-note">{tr("लोड हो रहा है…")}</p>
      ) : data?.length ? (
        data.map((v) => (
          <button key={v.code} className="generic-row" onClick={() => onPick(v.code)}>
            <div>
              <strong>{v.name}</strong>
              <span>
                {v.panchayat} • LGD {v.code}
              </span>
            </div>
            <span className={`status ${v.savedAt ? "green" : "amber"}`}>
              {v.savedAt ? tr("सहेजा गया") : tr("बाकी")}
            </span>
          </button>
        ))
      ) : (
        <p className="empty-note">{tr("आपके क्षेत्र में कोई गाँव नहीं मिला")}</p>
      )}
    </div>
  )
}

function VillageForm({ code, onBack }: { code: string; onBack: () => void }) {
  const tr = useTr()
  const notify = useUi((s) => s.notify)
  const { data, isLoading, error } = useVillageProfile(code)
  const save = useSaveVillageProfile(code)
  const setDraft = useVillageDraft((s) => s.set)
  const [r, setR] = useState<VillageResponses>(emptyResponses)
  useEffect(() => {
    if (data) setR({ ...emptyResponses(), ...data.responses })
  }, [data])
  useEffect(() => {
    if (data) setDraft({ name: data.name, panchayat: data.panchayat, block: data.block }, r)
    return () => setDraft(null, emptyResponses())
  }, [data, r, setDraft])
  if (isLoading) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  if (error || !data) return <EmptyState>{error?.message ?? tr("डेटा नहीं मिला")}</EmptyState>

  const done = completion(r)
  const setFacility = (item: string, answer: Answer) =>
    setR({ ...r, facilities: { ...r.facilities, [item]: answer } })
  const setInstitution = (item: string, answer: Answer) =>
    setR({ ...r, institutions: { ...r.institutions, [item]: answer } })
  const setNeed = (index: number, value: string) => {
    const needs = [...r.needs]
    needs[index] = value
    setR({ ...r, needs: needs.filter(Boolean).slice(0, 3) })
  }
  const submit = async () => {
    try {
      notify((await save.mutateAsync(r)).message)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  return (
    <div className="phone-content village-profile">
      <div className="village-header">
        <button onClick={onBack}>‹</button>
        <div>
          <small>{tr("ग्राम प्रोफ़ाइल")}</small>
          <strong>{data.name}</strong>
          <span>
            {data.panchayat} • {data.block}
          </span>
        </div>
        <b>{done.pct}%</b>
      </div>
      <div className="village-progress">
        <i>
          <b style={{ width: `${done.pct}%` }} />
        </i>
        <span>
          {data.savedAt
            ? tr("{{n}}% पूर्ण • अंतिम अपडेट {{at}}", { n: done.pct, at: data.savedAt })
            : tr("{{n}}% पूर्ण • अभी सहेजा नहीं गया", { n: done.pct })}
        </span>
      </div>
      <FacilityGroup
        code="D3"
        title="सामुदायिक सुविधाएँ"
        items={COMMUNITY_FACILITIES}
        answers={r.facilities}
        onChange={setFacility}
      />
      <FacilityGroup
        code="D4"
        title="आजीविका अवसंरचना"
        items={LIVELIHOOD_INFRA}
        answers={r.facilities}
        onChange={setFacility}
      />
      <section className="ranked-needs">
        <h3>{tr("सबसे आवश्यक 3 आजीविका अवसंरचनाएँ")}</h3>
        {[0, 1, 2].map((index) => (
          <label key={index}>
            <b>{index + 1}</b>
            <select value={r.needs[index] ?? ""} onChange={(e) => setNeed(index, e.target.value)}>
              <option value="">{tr("चुनें")}</option>
              {LIVELIHOOD_INFRA.map((item) => (
                <option key={item} value={item}>
                  {tr(item)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
      <section className="village-section">
        <div className="village-section-title">
          <div>
            <span>D5</span>
            <h3>{tr("ग्राम संस्थाएँ")}</h3>
          </div>
          <small>
            {done.d5}/{INSTITUTIONS.length} {tr("मद")}
          </small>
        </div>
        <div className="institution-list">
          {INSTITUTIONS.map((item) => (
            <InstitutionRow
              key={item}
              name={item}
              answer={r.institutions[item] ?? {}}
              onChange={(answer) => setInstitution(item, answer)}
            />
          ))}
        </div>
      </section>
      <section className="village-section village-resources">
        <div className="village-section-title">
          <div>
            <span>{tr("संसाधन")}</span>
            <h3>{tr("ग्राम संसाधन")}</h3>
          </div>
        </div>
        <div className="resource-pond">
          {(["तालाब संख्या", "कुल क्षेत्रफल (एकड़)"] as const).map((label) => (
            <label className="text-control" key={label}>
              <span>{tr(label)}</span>
              <input
                type="number"
                min={0}
                value={r.resources[label] ?? ""}
                onChange={(e) =>
                  setR({ ...r, resources: { ...r.resources, [label]: Number(e.target.value) } })
                }
              />
            </label>
          ))}
        </div>
        {RESOURCES.map((item) => (
          <ChipField key={item} label={tr("{{item}} उपलब्ध?", { item: tr(item) })}>
            <ChipGroup
              options={["हाँ", "नहीं"]}
              selected={r.resources[item] ? [String(r.resources[item])] : []}
              onToggle={(value) => setR({ ...r, resources: { ...r.resources, [item]: value } })}
              single
            />
          </ChipField>
        ))}
      </section>
      <div className="village-save">
        <button className="primary" disabled={save.isPending} onClick={submit}>
          {tr("ग्राम प्रोफ़ाइल सहेजें")}
        </button>
      </div>
    </div>
  )
}
