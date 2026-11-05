// One-off codemod: splits the Figma-exported src/App.tsx into feature modules.
// Each top-level declaration is moved verbatim into the file assigned below,
// exported, and given imports for the other declarations / libraries it uses.
//   node scripts/split-app.ts src/App.tsx
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const input = process.argv[2] ?? "src/App.tsx"
const text = fs.readFileSync(input, "utf8")
const source = ts.createSourceFile(input, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

// Target module (relative to src/, without extension) for every declaration.
const layout: Record<string, string[]> = {
  "components/ui/Icon": ["IconName", "Icon"],
  "components/ui/StatusBadge": ["statusClass"],
  "components/ui/Kpi": ["Kpi"],
  "components/ui/MiniStat": ["MiniStat"],
  "components/ui/FormDraftContext": ["SurveyDraftContext"],
  "components/ui/FormGroup": ["FormGroup"],
  "components/ui/ChipGroup": ["ChipField", "ChipGroup"],
  "components/ui/TextControl": ["TextControl"],
  "components/ui/Select": ["SelectControl", "FilterSelect"],
  "components/ui/NumberStepper": ["NumberControl"],
  "components/charts/Legend": ["Legend"],
  "app/navigation": ["roleNav"],
  "app/LegacyApp": ["App", "RoleWorkspace"],
  "app/Portal": ["Portal"],
  "features/auth/loginSlides": ["loginSlides"],
  "features/auth/LoginSlider": ["LoginSlider"],
  "features/auth/LoginScreen": ["LoginScreen"],
  "features/monitoring/widgets/OverviewStat": ["OverviewStat"],
  "features/monitoring/widgets/Task": ["Task"],
  "features/monitoring/DistrictDashboard": ["DistrictWorkspace"],
  "features/monitoring/StateDashboard": ["StateWorkspace"],
  "features/monitoring/CertificateModal": ["CertificateModal"],
  "features/monitoring/MonitoringWorkspace": ["MonitoringWorkspace"],
  "features/block/BlockModulePage": ["ModulePage"],
  "features/block/SchemeConvergence": ["SchemeConvergence"],
  "features/blcc/BlccRegister": ["Blcc"],
  "features/reports/BlockReports": ["BlockReports"],
  "features/applications/applicationStatus": ["OPEN_STATUSES", "todayIso"],
  "features/applications/ApplicationTable": ["ApplicationTable"],
  "features/applications/ApplicationDrawer": ["ApplicationDrawer"],
  "features/applications/ApplicationActionForm": ["ApplicationActionForm"],
  "features/applications/ApplicationPdfModal": ["ApplicationPdfModal"],
  "features/survey/FieldWorkspace": ["FieldWorkspace"],
  "features/survey/SurveyHome": ["SurveyHome"],
  "features/survey/SurveyForm": ["SurveyForm"],
  "features/survey/types": [
    "SurveyResult",
    "IncomeEntry",
    "LoanEntry",
    "CropRow",
    "NtfpRow",
    "WageRow",
  ],
  "features/survey/SurveyReview": ["SurveyReview"],
  "features/survey/SurveySuccess": ["SurveySuccess"],
  "features/survey/SurveyCompanion": ["SurveyCompanion"],
  "features/survey/village/VillageProfile": ["VillageProfile"],
  "features/survey/village/FacilityGroup": ["FacilityGroup", "FacilityRow"],
  "features/survey/village/InstitutionRow": ["InstitutionRow"],
  "features/survey/village/VillageProfileSummary": ["VillageProfileSummary"],
  "features/survey/sections/IdentificationForm": ["IdentificationForm"],
  "features/survey/sections/IncomeBaselineForm": ["IncomeBaselineForm"],
  "features/survey/sections/LoansForm": ["LoansForm"],
  "features/survey/sections/schemes/schemeGroups": ["schemeGroups"],
  "features/survey/sections/schemes/SchemeSaturationForm": [
    "SchemeSaturationForm",
    "SchemeDepartmentGroup",
  ],
  "features/survey/sections/schemes/SaturationSchemeCard": ["SaturationSchemeCard"],
  "features/survey/sections/schemes/ConvergenceDetails": ["ConvergenceDetails"],
  "features/survey/sections/livelihood/LivelihoodSection": ["LivelihoodSection"],
  "features/survey/sections/livelihood/shared": ["IncomeMismatch", "NeedsBlock"],
  "features/survey/sections/livelihood/AgricultureSection": ["AgricultureSection"],
  "features/survey/sections/livelihood/LivestockSection": ["LivestockSection"],
  "features/survey/sections/livelihood/FisheriesSection": ["FisheriesSection"],
  "features/survey/sections/livelihood/ForestProduceSection": ["ForestProduceSection"],
  "features/survey/sections/livelihood/NonFarmSection": ["NonFarmSection"],
  "features/survey/sections/livelihood/TourismSection": ["TourismSection"],
  "features/survey/sections/livelihood/WageSection": ["WageSection"],
  "features/recommendations/SchemeRecommendations": ["SchemeRecommendations"],
  "features/recommendations/types": ["RecommendationScheme"],
  "features/recommendations/RecommendationCard": ["RecommendationCard"],
  "features/recommendations/EntitlementGaps": ["EntitlementGaps"],
  "features/recommendations/RecommendationSheet": ["RecommendationSheet"],
  "features/recommendations/SchemeConsentModal": ["SchemeConsentModal"],
  "features/dpr/DprBuilder": ["DprBuilder"],
  "features/dpr/CostTable": ["CostTable"],
  "features/dpr/DprEconomics": ["DprEconomics"],
  "features/dpr/DprVerification": ["DprVerification"],
  "features/dpr/DprPdfPreview": ["DprPdfPreview"],
  "features/dpr/DprSuccess": ["DprSuccess"],
  "features/households/types": ["HouseholdRecord"],
  "features/households/HouseholdTracker": ["HouseholdTracker"],
  "features/households/HouseholdRegister": ["HouseholdRegister"],
  "features/department/DepartmentDashboard": ["DepartmentWorkspace"],
  "features/department/DepartmentInboxTable": ["DepartmentInboxRecord", "DepartmentInboxTable"],
  "features/admin/AdminWorkspace": ["AdminWorkspace"],
  "features/admin/AdminModule": ["AdminModule"],
  "features/admin/AdminMapping": ["AdminMapping"],
  "features/admin/AdminUsers": ["AdminUserRow", "AdminUsers"],
  "features/admin/AdminGeography": ["AdminGeography"],
  "features/admin/AdminSurveySettings": ["AdminSurveySettings"],
  "features/admin/AdminAuditLog": ["AdminAuditLog"],
}

// Libraries the moved code may reference.
const external: { from: string; names: string[]; types?: string[] }[] = [
  {
    from: "react",
    names: [
      "useState",
      "useEffect",
      "useMemo",
      "useRef",
      "useCallback",
      "createContext",
      "useContext",
    ],
    types: ["ReactNode"],
  },
  { from: "@/api/client", names: ["api", "ApiError"] },
  {
    from: "@/api/types",
    names: [],
    types: ["ApplicationRow", "ApplicationDetail", "HouseholdRow", "Meta", "User"],
  },
  { from: "@/api/hooks", names: ["useData", "useResource"] },
]

const moduleOf = new Map<string, string>()
for (const [mod, names] of Object.entries(layout)) for (const n of names) moduleOf.set(n, mod)

type Decl = { name: string; isType: boolean; text: string; node: ts.Statement }
const decls: Decl[] = []
for (const stmt of source.statements) {
  let name: string | null = null
  let isType = false
  if (ts.isFunctionDeclaration(stmt) && stmt.name) name = stmt.name.text
  else if (ts.isTypeAliasDeclaration(stmt) || ts.isInterfaceDeclaration(stmt))
    [name, isType] = [stmt.name.text, true]
  else if (ts.isVariableStatement(stmt)) {
    const d = stmt.declarationList.declarations[0]
    if (ts.isIdentifier(d.name)) name = d.name.text
  }
  if (!name) continue // imports and stray comments are dropped
  // Keep comments that sit directly above the declaration.
  const full = text.slice(stmt.getFullStart(), stmt.getEnd()).replace(/^\s+/, "")
  decls.push({ name, isType, text: full, node: stmt })
}

const missing = decls.filter((d) => !moduleOf.has(d.name)).map((d) => d.name)
if (missing.length) throw new Error(`No target module for: ${missing.join(", ")}`)

const typeNames = new Set(decls.filter((d) => d.isType).map((d) => d.name))
const allNames = new Set(decls.map((d) => d.name))

function identifiersIn(node: ts.Node) {
  const found = new Set<string>()
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n)) found.add(n.text)
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

function exported(d: Decl) {
  if (/^(export\s+)/.test(d.text)) return d.text
  return d.text.replace(
    /^((?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*)(function|const|type|interface|let)\b/,
    "$1export $2",
  )
}

const written: string[] = []
for (const [mod, names] of Object.entries(layout)) {
  const own = decls.filter((d) => names.includes(d.name))
  if (!own.length) continue
  const used = new Set<string>()
  for (const d of own) for (const id of identifiersIn(d.node)) used.add(id)

  const imports = new Map<string, { values: Set<string>; types: Set<string> }>()
  const add = (from: string, name: string, isType: boolean) => {
    if (!imports.has(from)) imports.set(from, { values: new Set(), types: new Set() })
    imports.get(from)![isType ? "types" : "values"].add(name)
  }
  for (const id of used) {
    if (allNames.has(id) && !names.includes(id)) add(`@/${moduleOf.get(id)}`, id, typeNames.has(id))
  }
  for (const lib of external) {
    for (const n of lib.names) if (used.has(n)) add(lib.from, n, false)
    for (const n of lib.types ?? []) if (used.has(n)) add(lib.from, n, true)
  }

  const importLines = [...imports.entries()]
    .sort(
      ([a], [b]) =>
        (a.startsWith("@/") ? 1 : 0) - (b.startsWith("@/") ? 1 : 0) || a.localeCompare(b),
    )
    .map(([from, { values, types }]) => {
      const parts = [...[...values].sort(), ...[...types].sort().map((t) => `type ${t}`)]
      const onlyTypes = values.size === 0
      return onlyTypes
        ? `import type { ${[...types].sort().join(", ")} } from "${from}"`
        : `import { ${parts.join(", ")} } from "${from}"`
    })

  const body = own.map(exported).join("\n\n")
  const outFile = path.join("src", `${mod}.${/<[A-Za-z]/.test(body) ? "tsx" : "ts"}`)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, `${importLines.join("\n")}${importLines.length ? "\n\n" : ""}${body}\n`)
  written.push(`${String(body.split("\n").length).padStart(5)}  ${outFile}`)
}
console.log(written.join("\n"))
console.log(`\n${written.length} modules written from ${decls.length} declarations`)
