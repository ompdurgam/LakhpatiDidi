import { useMeta } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { type GeoLevel, useGeoArea } from "@/features/geo/useGeo"
import { useTr } from "@/i18n/tr"

import {
  type AssignmentDraft,
  CHAIN,
  LEVEL_LABEL,
  ROLE_LEVELS,
  ROLE_OPTIONS,
} from "./assignmentRules"

/** Rows of role × area; add as many as the person covers. */
export function AssignmentEditor({
  value,
  onChange,
}: {
  value: AssignmentDraft[]
  onChange: (next: AssignmentDraft[]) => void
}) {
  const tr = useTr()
  const update = (index: number, patch: Partial<AssignmentDraft>) =>
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  return (
    <div className="assignment-editor">
      <span className="assignment-editor-title">{tr("भूमिकाएँ और कार्यक्षेत्र")}</span>
      {value.map((draft, index) => (
        <AssignmentRow
          key={index}
          draft={draft}
          onChange={(patch) => update(index, patch)}
          onRemove={
            value.length > 1 ? () => onChange(value.filter((_, i) => i !== index)) : undefined
          }
        />
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() => onChange([...value, { role: "field", level: "block" }])}
      >
        <Icon name="plus" size={14} /> {tr("एक और भूमिका / क्षेत्र जोड़ें")}
      </button>
    </div>
  )
}

function AssignmentRow({
  draft,
  onChange,
  onRemove,
}: {
  draft: AssignmentDraft
  onChange: (patch: Partial<AssignmentDraft>) => void
  onRemove?: () => void
}) {
  const tr = useTr()
  const meta = useMeta().data
  const levels = ROLE_LEVELS[draft.role] ?? ["state"]
  const depth = CHAIN.indexOf(draft.level as (typeof CHAIN)[number])
  return (
    <div className="assignment-row">
      <label className="text-control">
        <span>{tr("भूमिका")}</span>
        <select
          value={draft.role}
          onChange={(e) => {
            const role = e.target.value
            const allowed = ROLE_LEVELS[role]
            onChange({ role, level: allowed.includes(draft.level) ? draft.level : allowed[0] })
          }}
        >
          {ROLE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {tr(label)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-control">
        <span>{tr("क्षेत्र स्तर")}</span>
        <select value={draft.level} onChange={(e) => onChange({ level: e.target.value })}>
          {levels.map((level) => (
            <option key={level} value={level}>
              {tr(LEVEL_LABEL[level])}
            </option>
          ))}
        </select>
      </label>
      {CHAIN.slice(0, depth + 1).map((level, i) => (
        <AreaSelect
          key={level}
          level={level}
          parent={i === 0 ? ["state", "CG"] : [CHAIN[i - 1], draft[CHAIN[i - 1]]]}
          value={draft[level]}
          // Choosing a higher level clears the levels below it.
          onChange={(code) =>
            onChange(
              Object.fromEntries([
                [level, code],
                ...CHAIN.slice(i + 1).map((below) => [below, undefined]),
              ]),
            )
          }
        />
      ))}
      {draft.role === "department" && (
        <label className="text-control">
          <span>{tr("विभाग")}</span>
          <select
            value={draft.department ?? ""}
            onChange={(e) => onChange({ department: e.target.value })}
          >
            <option value="">{tr("चुनें")}</option>
            {(meta?.departments ?? []).map((d) => (
              <option key={d.code} value={d.code}>
                {tr(d.name)}
              </option>
            ))}
          </select>
        </label>
      )}
      {onRemove && (
        <button type="button" className="icon-button" title={tr("हटाएँ")} onClick={onRemove}>
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )
}

/** The children of the chosen parent area at one level (loaded once the parent is chosen). */
function AreaSelect({
  level,
  parent,
  value,
  onChange,
}: {
  level: (typeof CHAIN)[number]
  parent: [GeoLevel, string | undefined]
  value?: string
  onChange: (code: string) => void
}) {
  const tr = useTr()
  const [parentLevel, parentCode] = parent
  const { data, isLoading } = useGeoArea(parentLevel, parentCode ?? "")
  const options = parentCode ? (data?.children ?? []).filter((c) => c.code) : []
  return (
    <label className="text-control">
      <span>{tr(LEVEL_LABEL[level])}</span>
      <select
        value={value ?? ""}
        disabled={!parentCode || isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{parentCode ? tr("चुनें") : "—"}</option>
        {options.map((c) => (
          <option key={c.code!} value={c.code!}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  )
}
