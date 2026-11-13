import { lazy, Suspense, useMemo } from "react"
import { useNavigate } from "react-router"

import { useGeoArea } from "@/features/geo/useGeo"
import { useTr } from "@/i18n/tr"

import { num, pct } from "../format"
import type { Overview } from "../useOverview"

const GeoMap = lazy(async () => ({ default: (await import("@/features/geo/GeoMap")).GeoMap }))

const CHILD_LABEL: Record<string, string> = {
  district: "जिले",
  block: "ब्लॉक",
  gram_panchayat: "ग्राम पंचायत",
}

/** The area's LGD map shaded by Lakhpati share, beside its child areas ranked. */
/** `role`: whose map pages a click opens (a state user viewing a district stays under /state). */
export function AreaMapCard({ data, role }: { data: Overview; role?: "state" | "district" }) {
  const tr = useTr()
  const navigate = useNavigate()
  const { area, children } = data
  const geo = useGeoArea(area.level, area.code)
  const stats = useMemo(
    () =>
      new Map(children.map((c) => [c.code, { households: c.households, lakhpati: c.lakhpati }])),
    [children],
  )
  // Ranked by Lakhpati share of surveyed Didis, then by survey coverage.
  const ranked = [...children]
    .sort(
      (a, b) =>
        pct(b.lakhpati, b.surveyed) - pct(a.lakhpati, a.surveyed) ||
        pct(b.surveyed, b.households) - pct(a.surveyed, a.households) ||
        b.households - a.households,
    )
    .slice(0, 6)
  const features = geo.data?.boundaries.features ?? []
  return (
    <>
      <div className="card state-map-card area-map-card">
        <div className="card-head">
          <div>
            <h3>
              {area.name} • {num(children.length)} {tr(CHILD_LABEL[area.childLevel])}
            </h3>
            <p>{tr("लखपति अनुपात के अनुसार रंग • क्लिक करें विवरण के लिए")}</p>
          </div>
        </div>
        {features.length ? (
          <Suspense fallback={<div className="geo-map-empty">{tr("मानचित्र लोड हो रहा है…")}</div>}>
            <GeoMap
              features={features}
              outline={geo.data?.outline ?? null}
              attribution={geo.data?.sources.join(" • ") ?? ""}
              stats={stats}
              onSelect={(code) => navigate(`/${role ?? area.level}/map/${area.childLevel}/${code}`)}
            />
          </Suspense>
        ) : (
          <p className="empty-note">
            {geo.isLoading
              ? tr("मानचित्र लोड हो रहा है…")
              : tr("इस क्षेत्र की सीमाएँ आयात नहीं हुई हैं")}
          </p>
        )}
      </div>
      <div className="card ranking">
        <div className="card-head">
          <div>
            <h3>{tr("क्षेत्र रैंकिंग")}</h3>
            <p>{tr("लखपति उपलब्धि दर • सर्वे कवरेज")}</p>
          </div>
        </div>
        {ranked.map((child, index) => (
          <div key={child.code}>
            <b>{index + 1}</b>
            <span>
              {child.name}
              <small>
                {pct(child.surveyed, child.households)}
                {tr("% सर्वे कवरेज")} • {num(child.households)} {tr("दीदी")}
              </small>
            </span>
            <strong>{pct(child.lakhpati, child.surveyed)}%</strong>
          </div>
        ))}
      </div>
    </>
  )
}
