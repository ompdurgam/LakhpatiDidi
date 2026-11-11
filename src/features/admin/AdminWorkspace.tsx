import { useNavigate, useParams } from "react-router"

import { AdminModule } from "@/features/admin/AdminModule"
import { AdminSchemes } from "@/features/admin/AdminSchemes"
import { useTr } from "@/i18n/tr"

export function AdminWorkspace({ onNotify }: { onNotify: (message: string) => void }) {
  const tr = useTr()
  const { module = "schemes" } = useParams()
  const navigate = useNavigate()
  // URL /admin/survey ↔ internal "forms" tab
  const activeAdmin = module === "survey" ? "forms" : module
  const setActiveAdmin = (key: string) => navigate(`/admin/${key === "forms" ? "survey" : key}`)
  const adminTabs = [
    ["schemes", "योजना मास्टर"],
    ["mapping", "विभाग मैपिंग"],
    ["users", "यूज़र व भूमिकाएँ"],
    ["geography", "भूगोल"],
    ["forms", "सर्वे सेटिंग"],
    ["village", "ग्राम प्रोफाइल"],
    ["audit", "ऑडिट लॉग"],
  ]
  return (
    <div className="page role-page admin-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{tr("सिस्टम प्रशासन")}</span>
          <h2>{tr("पोर्टल कॉन्फ़िगरेशन")}</h2>
          <p>{tr("योजनाएँ, पात्रता नियम, उपयोगकर्ता और सर्वे फॉर्म प्रबंधित करें")}</p>
        </div>
      </div>
      <div className="admin-tabs">
        {adminTabs.map(([key, label]) => (
          <button
            key={key}
            className={activeAdmin === key ? "active" : ""}
            onClick={() => setActiveAdmin(key)}
          >
            {tr(label)}
          </button>
        ))}
      </div>
      {activeAdmin === "schemes" ? (
        <AdminSchemes />
      ) : (
        <AdminModule active={activeAdmin} onNotify={onNotify} />
      )}
    </div>
  )
}
