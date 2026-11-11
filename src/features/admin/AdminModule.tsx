import { useResource } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { AdminAuditLog } from "@/features/admin/AdminAuditLog"
import { AdminGeography } from "@/features/admin/AdminGeography"
import { AdminMapping } from "@/features/admin/AdminMapping"
import { AdminSurveySettings } from "@/features/admin/AdminSurveySettings"
import { AdminUsers } from "@/features/admin/AdminUsers"
import {
  COMMUNITY_FACILITIES,
  INSTITUTIONS,
  LIVELIHOOD_INFRA,
  RESOURCES,
} from "@/features/survey/village/catalog"
import { useTr } from "@/i18n/tr"

export function AdminModule({
  active,
  onNotify,
}: {
  active: string
  onNotify: (message: string) => void
}) {
  if (active === "mapping") return <AdminMapping />
  if (active === "users") return <AdminUsers onNotify={onNotify} />
  if (active === "geography") return <AdminGeography />
  if (active === "forms") return <AdminSurveySettings onNotify={onNotify} />
  if (active === "audit") return <AdminAuditLog />
  if (active === "village") return <AdminVillageProfiles />
  return null
}

type ProfileSummary = {
  total: number
  recent: {
    code: string
    village: string
    block: string
    updatedAt: string
    updatedBy: string | null
  }[]
}

/** The village profile form's sections, and the villages profiled so far. */
function AdminVillageProfiles() {
  const tr = useTr()
  const { data } = useResource<ProfileSummary>("/village-profiles")
  const sections: [string, string, number][] = [
    ["D3", "सामुदायिक सुविधाएँ", COMMUNITY_FACILITIES.length],
    ["D4", "आजीविका अवसंरचना", LIVELIHOOD_INFRA.length],
    ["D5", "ग्राम संस्थाएँ", INSTITUTIONS.length],
    [tr("संसाधन"), "ग्राम संसाधन", RESOURCES.length + 2],
  ]
  return (
    <section className="card admin-module">
      <div className="card-head">
        <div>
          <h3>{tr("ग्राम प्रोफाइल")}</h3>
          <p>
            {tr("{{n}} गाँव की प्रोफ़ाइल सहेजी गई", {
              n: (data?.total ?? 0).toLocaleString("en-IN"),
            })}
          </p>
        </div>
      </div>
      {sections.map(([code, title, count]) => (
        <div className="admin-module-row" key={title}>
          <span className="generic-icon">
            <Icon name="settings" size={18} />
          </span>
          <div>
            <strong>
              {code}. {tr(title)}
            </strong>
            <small>{tr("{{n}} मद", { n: count })}</small>
          </div>
        </div>
      ))}
      {data?.recent?.map((row) => (
        <div className="admin-module-row" key={row.code}>
          <span className="generic-icon">
            <Icon name="map" size={18} />
          </span>
          <div>
            <strong>
              {row.village} • {row.block}
            </strong>
            <small>
              {row.updatedAt}
              {row.updatedBy ? ` • ${row.updatedBy}` : ""}
            </small>
          </div>
          <span className="status green">{tr("सहेजा गया")}</span>
        </div>
      ))}
    </section>
  )
}
