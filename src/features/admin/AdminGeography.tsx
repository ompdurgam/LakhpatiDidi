import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { type GeoLevel, useGeoArea } from "@/features/geo/useGeo"
import { useTr } from "@/i18n/tr"

const CHILD_LABEL: Record<string, string> = {
  district: "ब्लॉक",
  block: "GP",
  gram_panchayat: "गाँव",
}

/** The LGD geography master (state → district → block → GP → village), loaded level by level. */
export function AdminGeography() {
  const tr = useTr()
  return (
    <section className="card geography-admin">
      <div className="card-head">
        <div>
          <h3>{tr("भूगोल मास्टर")}</h3>
          <p>{tr("जिला → ब्लॉक → GP → गाँव • LGD कोड सहित")}</p>
        </div>
      </div>
      <div className="geo-tree">
        <Children level="state" code="CG" />
      </div>
    </section>
  )
}

/** The child areas of one area; each can be expanded in turn. */
function Children({ level, code }: { level: GeoLevel; code: string }) {
  const tr = useTr()
  const { data, isLoading, error } = useGeoArea(level, code)
  if (isLoading) return <p className="empty-note">{tr("लोड हो रहा है…")}</p>
  if (error || !data) return <p className="empty-note">{error?.message ?? tr("डेटा नहीं मिला")}</p>
  return (
    <div>
      {data.children.map((child) => (
        <Node
          key={child.code ?? child.name}
          level={data.childLevel}
          code={child.code}
          name={child.name}
          childCount={child.childCount}
          households={child.households}
        />
      ))}
    </div>
  )
}

function Node({
  level,
  code,
  name,
  childCount,
  households,
}: {
  level: GeoLevel
  code: string | null
  name: string
  childCount: number
  households: number
}) {
  const tr = useTr()
  const [open, setOpen] = useState(false)
  const expandable = Boolean(code) && level !== "village"
  const levelClass = level === "gram_panchayat" ? "gp" : level
  return (
    <>
      <button
        className={`level ${levelClass}`}
        onClick={() => expandable && code && setOpen(!open)}
      >
        <Icon name={level === "village" ? "map" : "chevron"} size={level === "village" ? 13 : 14} />
        <strong>{name}</strong>
        <span>
          {code ? `LGD ${code}` : tr("LGD कोड नहीं")}
          {CHILD_LABEL[level]
            ? ` • ${childCount.toLocaleString("en-IN")} ${tr(CHILD_LABEL[level])}`
            : ""}
          {` • ${households.toLocaleString("en-IN")} ${tr("दीदी")}`}
        </span>
      </button>
      {open && code && <Children level={level} code={code} />}
    </>
  )
}
