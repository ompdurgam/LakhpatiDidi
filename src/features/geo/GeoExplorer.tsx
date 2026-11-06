import { lazy, Suspense, useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"

import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { AreaList } from "./AreaList"
import { levelLabel } from "./labels"
import { type GeoLevel, isGeoLevel, useGeoArea } from "./useGeo"
import { VillagePanel } from "./VillagePanel"

// Leaflet is large; load it only when the map page opens.
const GeoMap = lazy(async () => ({ default: (await import("./GeoMap")).GeoMap }))

/**
 * Chhattisgarh map explorer: state → district → block → gram panchayat →
 * village, by LGD code. `base` is the role's map URL (e.g. "/state/map") and
 * `root` the area it opens on.
 */
export function GeoExplorer({ base, root }: { base: string; root: [GeoLevel, string] }) {
  const tr = useTr()
  const navigate = useNavigate()
  const params = useParams()
  const [search, setSearch] = useSearchParams()
  const level = isGeoLevel(params.level) ? params.level : root[0]
  const code = params.code ?? root[1]
  const village = search.get("village") ?? undefined
  const { data, isLoading, error } = useGeoArea(level, code)

  const stats = useMemo(
    () =>
      new Map(
        (data?.children ?? []).flatMap((c) =>
          c.code ? [[c.code, { households: c.households, lakhpati: c.lakhpati }] as const] : [],
        ),
      ),
    [data],
  )
  const totals = (data?.children ?? []).reduce(
    (sum, c) => ({
      households: sum.households + c.households,
      lakhpati: sum.lakhpati + c.lakhpati,
    }),
    { households: 0, lakhpati: 0 },
  )

  const open = (childCode: string) => {
    if (!data) return
    if (data.childLevel === "village") setSearch({ village: childCode })
    else navigate(`${base}/${data.childLevel}/${childCode}`)
  }
  const rootIndex = data?.path.findIndex((a) => a.level === root[0] && a.code === root[1]) ?? 0
  const crumbs = data?.path.slice(Math.max(0, rootIndex)) ?? []
  const features = data?.boundaries.features ?? []

  return (
    <div className="page geo-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{tr("LGD भौगोलिक मानचित्र")}</span>
          <h2>{data?.path.at(-1)?.name ?? "…"}</h2>
          <nav className="geo-crumbs" aria-label={tr("क्षेत्र पथ")}>
            {crumbs.map((area, index) => (
              <span key={area.code}>
                {index > 0 && <Icon name="chevron" size={13} />}
                {index < crumbs.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => navigate(`${base}/${area.level}/${area.code}`)}
                  >
                    {area.name}
                  </button>
                ) : (
                  <b>{area.name}</b>
                )}
              </span>
            ))}
          </nav>
        </div>
        {data && (
          <div className="geo-summary">
            <div>
              <strong>{data.children.length.toLocaleString("en-IN")}</strong>
              <span>{tr(levelLabel[data.childLevel])}</span>
            </div>
            <div>
              <strong>{totals.households.toLocaleString("en-IN")}</strong>
              <span>{tr("सर्वेक्षित परिवार")}</span>
            </div>
            <div>
              <strong>{totals.lakhpati.toLocaleString("en-IN")}</strong>
              <span>{tr("लखपति दीदी")}</span>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <EmptyState>{(error as Error).message}</EmptyState>
      ) : isLoading || !data ? (
        <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
      ) : (
        <div className="geo-layout">
          <section className="card geo-map-card">
            {features.length || data.outline ? (
              <Suspense
                fallback={<div className="geo-map-empty">{tr("मानचित्र लोड हो रहा है…")}</div>}
              >
                <GeoMap
                  features={features}
                  outline={data.outline}
                  attribution={data.sources.join(" • ")}
                  stats={stats}
                  selected={village}
                  onSelect={open}
                />
              </Suspense>
            ) : (
              <div className="geo-map-empty">
                <Icon name="map" size={34} />
              </div>
            )}
            {!features.length && (
              <div className="geo-map-note" role="note">
                <Icon name="alert" size={15} />
                <span>
                  {tr(
                    "{{level}} की सीमाएँ अभी मानचित्र में उपलब्ध नहीं हैं। सूची से क्षेत्र चुनें।",
                    {
                      level: tr(levelLabel[data.childLevel]),
                    },
                  )}
                </span>
              </div>
            )}
            <div className="geo-legend" aria-hidden={!features.length}>
              <span>{tr("लखपति अनुपात")}</span>
              <i style={{ background: "#e3e8e3" }} /> {tr("सर्वे नहीं")}
              <i style={{ background: "#cfe3d4" }} /> 0%
              <i style={{ background: "#9cc5a8" }} /> &lt;25%
              <i style={{ background: "#4b875f" }} /> 25–50%
              <i style={{ background: "#1f6b3a" }} /> 50%+
            </div>
          </section>
          <section className="card geo-side">
            <h3>
              {tr(levelLabel[data.childLevel])}{" "}
              <span>{data.children.length.toLocaleString("en-IN")}</span>
            </h3>
            <AreaList
              level={data.childLevel}
              areas={data.children}
              selected={village}
              onSelect={(area) => area.code && open(area.code)}
            />
          </section>
          {village && <VillagePanel code={village} onClose={() => setSearch({})} />}
        </div>
      )}
    </div>
  )
}
