// Phase 1: post-split edits that connect the ported prototype screens to the
// router. Run once, right after scripts/split-app.ts.
import fs from "node:fs"

function edit(file, pairs) {
  let s = fs.readFileSync(file, "utf8")
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`${file}: missing ${a.slice(0, 80)}`)
    s = s.split(a).join(b)
  }
  fs.writeFileSync(file, s)
}

// Block overview: the generated slice includes the page's closing </div>.
edit("src/features/monitoring/BlockOverviewLower.tsx", [
  ["          </section>\n        </div>\n    </>", "          </section>\n    </>"],
  ['onClick={() => setRole("department")}', "onClick={openDepartments}"],
  [
    "  onNotify: notify,\n  go,\n}: {\n  onNotify: (message: string) => void\n  go: (section: BlockSection) => void\n}) {",
    "  onNotify: notify,\n  go,\n  openDepartments,\n}: {\n  onNotify: (message: string) => void\n  go: (section: BlockSection) => void\n  /** Switch to the department role (prototype behaviour). */\n  openDepartments: () => void\n}) {",
  ],
])
edit("src/features/monitoring/BlockDashboard.tsx", [
  [
    "      <BlockOverviewLower onNotify={notify} go={go} />",
    "      <BlockOverviewLower onNotify={notify} go={go} openDepartments={openDepartments} />",
  ],
  ["  go,\n}: {", "  go,\n  openDepartments,\n}: {"],
  [
    "  go: (section: BlockSection) => void\n}) {",
    "  go: (section: BlockSection) => void\n  openDepartments: () => void\n}) {",
  ],
])

// Field app: screen comes from the URL.
edit("src/features/survey/FieldWorkspace.tsx", [
  [
    '  const [screen, setScreen] = useState("home")',
    "  const { screen, setScreen } = useFieldScreen()",
  ],
  [
    "export function FieldWorkspace",
    'import { useFieldScreen } from "./useFieldScreen"\n\nexport function FieldWorkspace',
  ],
])

// Department: department comes from /dept/:deptCode.
edit("src/features/department/DepartmentDashboard.tsx", [
  [
    '  const [dept, setDept] = useState("मत्स्य विभाग")',
    "  const { deptCode } = useParams()\n  const navigate = useNavigate()\n  const dept = (departmentByCode(deptCode) ?? departments[0]).name.hi\n  const setDept = (name: string) =>\n    navigate(`/dept/${departmentByHindiName(name)?.code ?? departments[0].code}`)",
  ],
  [
    "export function DepartmentWorkspace",
    'import { useNavigate, useParams } from "react-router"\n\nimport { departmentByCode, departmentByHindiName, departments } from "@/data/departments"\n\nexport function DepartmentWorkspace',
  ],
])

// Admin: tab comes from /admin/:module.
edit("src/features/admin/AdminWorkspace.tsx", [
  [
    '  const [activeAdmin, setActiveAdmin] = useState("schemes")',
    '  const { module = "schemes" } = useParams()\n  const navigate = useNavigate()\n  // URL /admin/survey ↔ internal "forms" tab\n  const activeAdmin = module === "survey" ? "forms" : module\n  const setActiveAdmin = (key: string) =>\n    navigate(`/admin/${key === "forms" ? "survey" : key}`)',
  ],
  [
    "export function AdminWorkspace",
    'import { useNavigate, useParams } from "react-router"\n\nexport function AdminWorkspace',
  ],
])

// Lint: unused map index params from the prototype.
edit("src/features/dpr/DprBuilder.tsx", [["].map(([a, b], index) => (", "].map(([a, b]) => ("]])
edit("src/features/reports/BlockReports.tsx", [
  ["].map(([title, summary], index) => (", "].map(([title, summary]) => ("],
])

// React.ReactNode → imported ReactNode.
for (const file of [
  "src/components/ui/ChipGroup.tsx",
  "src/components/ui/FormGroup.tsx",
  "src/components/ui/Icon.tsx",
]) {
  const s = fs.readFileSync(file, "utf8")
  fs.writeFileSync(file, s.replace(/React\.ReactNode/g, "ReactNode"))
}

// statusClass moves to its own module (fast-refresh friendly).
for (const file of [
  "src/features/applications/ApplicationDrawer.tsx",
  "src/features/applications/ApplicationTable.tsx",
  "src/features/department/DepartmentInboxTable.tsx",
]) {
  edit(file, [['from "@/components/ui/StatusBadge"', 'from "@/components/ui/statusClass"']])
}

for (const file of [
  "src/app/Portal.tsx",
  "src/app/LegacyApp.tsx",
  "src/app/navigation.tsx",
  "src/components/ui/StatusBadge.tsx",
]) {
  fs.rmSync(file)
}
console.log("phase 1 port edits applied")
