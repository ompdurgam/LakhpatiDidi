# Prompt for Claude Code

Open this folder in Claude Code and paste the **MASTER PROMPT** below. Claude Code works in phases and stops after each phase so you can check the result. When it stops, reply "continue to phase N".

---

## MASTER PROMPT (paste this)

```
Read CLAUDE.md, docs/CONTENT_SPEC.md and docs/DESIGN_REVIEW.md first, then look at src/App.tsx and src/index.css.

CONTEXT
src/App.tsx is a 2,511-line single-file prototype exported from Figma Make (React 19 + Vite + Tailwind v4, no router, all data hardcoded, roles switched with a <select>). It shows 6 role views: Surveyor (mobile survey app), Block/CLF, Department, District, State, Admin. The visual design is good and must be kept. The structure is not scalable.

GOAL
Refactor it into a modular, scalable, production-ready frontend architecture, then complete the missing features. Keep the same look and feel.

TARGET STACK (add these)
- react-router v7 (data routers, lazy routes per feature)
- @tanstack/react-query for server state; zustand only for session/UI state
- react-hook-form + zod for forms and validation
- i18next + react-i18next (hi default, en)
- dexie (IndexedDB) for offline survey drafts + a sync queue
- msw for a mock API in dev/test (so the backend can be plugged in later via the same typed client)
- recharts for charts
- @react-pdf/renderer for the DPR PDF
- json-logic-js for scheme eligibility rules
- vitest + @testing-library/react for unit/component tests, playwright for e2e
- eslint (typescript-eslint, react-hooks, import order) + prettier
Use exact versions that work together; run a build after installing.

TARGET FOLDER STRUCTURE
src/
  app/            router.tsx, providers.tsx (QueryClient, i18n, auth), AppShell (sidebar+header), RoleGuard, error boundary
  components/ui/  Button, Card, Kpi, MiniStat, StatusBadge, Table, Drawer, Modal, Stepper, Timeline, ProgressBar, ChipGroup, YesNo, NumberStepper, Select, EmptyState, Toast, Icon (move the SVG Icon here)
  components/charts/ Funnel, Donut, BarRows, Heatmap, Matrix, ChoroplethPlaceholder
  domain/         pure TS + tests: income.ts (net income, active streams, lakhpati status), stacking.ts (SOP pathways), eligibility.ts (json-logic rule engine + match score + "why suggested" text), workflow.ts (status state machine), sla.ts (due dates, overdue, escalation level), certification.ts (Lakhpati Gram 50% check), format.ts (formatINR, dates)
  types/          Household, Member, SurveyResponse, SurveySection, Question, Scheme, Department, Application, BlccAction, Escalation, User, Role, GeoUnit
  data/           survey/schema/*.ts (one file per section A–K + village D3/D4/D5), schemes/*.json (one per department), departments.ts, geography.ts, seed/ (mock households, applications, users)
  api/            client.ts (fetch wrapper, typed), endpoints per resource, queryKeys.ts, hooks (useHouseholds, useApplications, ...)
  mocks/          msw handlers + in-memory db built from data/seed
  offline/        dexie db, draft store, sync queue, useOnlineStatus
  i18n/           index.ts, locales/hi/*.json, locales/en/*.json (namespaced per feature)
  features/
    auth/         login (mobile OTP mock), role + scope selection, session store, RoleGuard
    survey/       SurveyHome, SurveyWizard (schema-driven renderer), Review & Submit, success screen, VillageProfile
    recommendations/ SchemeSuggestions (livelihood tab + entitlement gap tab), consent modal
    dpr/          DprWizard (7 steps), cost table, economics, documents, verification, PdfDocument (react-pdf)
    households/   HouseholdRegister, HouseholdTracker, MonthlyIncomeRegister
    applications/ ApplicationTable, ApplicationDrawer (role-aware actions)
    blcc/         BlccRegister, MeetingMode
    department/   DepartmentDashboard (one template, config per department)
    monitoring/   BlockDashboard, DistrictDashboard, StateDashboard (separate pages, shared widgets)
    reports/      monthly report builder, register downloads (CSV/XLSX)
    admin/        SchemeMaster + rule builder, DeptOfficerMapping, Users, Geography, SurveySettings, AuditLog
  styles/         split index.css into tokens.css (CSS variables for colours/spacing/radius) + base.css + per-component CSS or Tailwind classes. Keep the visual output identical.

ROUTES (role-based; each role has its own sidebar menu)
/login
/field (home) · /field/survey/:householdId?/:section? · /field/village/:villageId · /field/households/:id · /field/recommendations/:householdId · /field/dpr/:applicationId · /field/income
/block (overview) · /block/households · /block/applications · /block/blcc · /block/schemes · /block/reports
/dept/:deptCode (dashboard + inbox) · /dept/:deptCode/applications/:id
/district · /district/blocks/:blockId · /district/lakhpati-gram · /district/escalations
/state · /state/districts/:districtId · /state/departments · /state/certification
/admin/schemes · /admin/mapping · /admin/users · /admin/geography · /admin/survey · /admin/audit
Drill-down breadcrumbs: State › District › Block › GP › Village › Household.

KEY DESIGN DECISIONS
1. Schema-driven survey: build the survey from typed config, not JSX. A Question has id, section, label {hi,en}, type (text|number|money|radio|multi|yesno|select|gps|photo|repeat-group|matrix|computed), options, validation (zod), visibleIf (json-logic on other answers), computed (formula), and reconcileWith (for example section E income must match the B row). Generate sections A–K and D1–D5 from docs/source-files/Swavalambi_Bastar_Livelihood_Survey_Hindi.xlsx (sheet "Sheet1"; column 1 = question, columns 2+ = options, last columns = logic notes). Write a script scripts/import-survey.ts that reads the xlsx with the xlsx package and emits src/data/survey/schema/*.ts, then review and hand-fix the output. Sections E–K show only when selected in A's livelihood categories.
2. Scheme rule engine: each scheme JSON has id, name {hi,en}, department, objective, benefit, subsidyByCategory, documents[], whereToApply, slaDays, dprTemplate, and eligibility (json-logic) + boosters (json-logic → score points + a "why" text template). recommend(household) returns ranked schemes with matchScore, reasons[] and failedRules[]. Entitlement gaps = D1/D2 rows where eligible > received.
3. Workflow + SLA: Application status is a state machine in domain/workflow.ts with allowed transitions per role. sla.ts computes sanctionDue (BLCC date + 15 days), deliveryDue (sanction + 30 days), and the escalation level (each level +7 days). The UI only calls domain functions.
4. Offline-first field app: survey drafts autosave to IndexedDB on every change. Submits queue while offline and sync when online, with a visible pending count. Show conflict handling as "server newer – keep mine/keep server".
5. RBAC + scope: user has role + scope (stateId/districtId/blockId/deptCode). All queries are scoped. RoleGuard protects routes.
6. API contract: write docs/api.md (REST endpoints, request/response types) matching src/api. MSW implements it now; a real backend can replace it later with no UI changes.

PHASES (stop after each phase, show me a summary + how to test, wait for "continue")
Phase 1 – Foundation: install the stack, lint/format/test setup, folder structure, tokens.css from index.css, ui components extracted from App.tsx, i18n with hi/en, AppShell + router + role-based menus, login mock. Port the existing screens 1:1 into features with the same visuals (no new features yet). App.tsx becomes a thin router entry. Acceptance: npm run build, lint and test pass; every existing screen is reachable by URL and looks the same as before.
Phase 2 – Domain + data: types, domain/* with unit tests (income, stacking, eligibility, workflow, sla, certification), survey schema import script + generated schema, scheme JSON for at least: PMMSY, fish boat/net subsidy, fingerling stocking, backyard poultry, state goat scheme, state poultry promotion, NHM micro-irrigation, NHM vegetable/spice expansion, PMFME, SMAM, PMFBY, PM-Kisan, KCC, Van Dhan/VDVK, lac development, tendu collector social security, PMEGP, PM Vishwakarma, Mudra, handloom workshed, CG Homestay Policy 2025-30, DDU-GKY, PMAY-G, MGNREGA job card, PMJJBY, PMSBY, APY, PMMVY. Mark subsidy amounts "TO VERIFY" where not certain. MSW mock API + seed data (Bastar district, 7 blocks, ~200 households, ~60 applications). Acceptance: domain tests ≥ 90% coverage; the API hooks return seed data.
Phase 3 – Field app: schema-driven SurveyWizard (all sections A–K, conditional sections, computed fields, validations, reconciliation banners, Lakhpati meter), Review & Submit with OTP consent + success screen with HH ID and QR, VillageProfile (D3/D4/D5 + resources), offline drafts + sync queue, SchemeSuggestions (stacking pathway, ranked cards with reasons/failed rules/documents/where to apply, entitlement gap tab, reasons for "not interested", consent modal), DPR wizard (7 steps incl. verification) + react-pdf DPR with all sections, send to department, success screen. Monthly income register. Acceptance: Playwright e2e "survey → suggestions → consent → DPR → submitted application visible in the department inbox".
Phase 4 – Department + Block: role-aware ApplicationDrawer (accept, request info, sanction with order no./date/amount/upload, reject with reason, mark delivered with geo-tagged photo; block: follow-up, escalate), full timeline + SLA strip + documents + comments. Department dashboard from config for all 16 departments (KPIs incl. ₹ sanctioned + income-active, filtered inbox with bulk sanction, escalations, funnel, awareness-vs-benefit gap, target vs achievement). Block overview additions, household register, schemes convergence page, BLCC register (full SOP columns) + meeting mode, monthly report builder + CSV/XLSX downloads. Acceptance: e2e "department sanctions → delivers → household tracker updates; overdue item escalates".
Phase 5 – District, State, Admin: separate District and State dashboards (as listed in docs/DESIGN_REVIEW.md sections 13–14), Lakhpati Gram candidates + certification kanban + certificate PDF, admin (scheme master editor with json-logic rule builder + "test on sample household", dept-officer mapping, users, geography tree, survey settings, audit log). Acceptance: drill-down works State → Household; admin rule changes immediately change recommendations.
Phase 6 – Quality: accessibility (labels, focus, contrast, 48px touch targets on mobile), responsive check at 360/768/1440, code-splitting (lazy routes, bundle report), error/empty/loading states everywhere, README with architecture diagram (mermaid) and "how to add a new scheme / department / survey question" guides.

RULES
- Database naming: master/reference tables are named master_<tablename> (e.g. master_villages, master_schemes, master_users); transactional tables are named tbl_<tablename> (e.g. tbl_households, tbl_applications, tbl_audit_logs); views use v_<name>. See database/README.md. Apply this to every new table, migration, seed and query.
- Don't change visual design unless needed; reuse the existing CSS classes/tokens.
- No file over ~300 lines; split components.
- No hardcoded user-facing strings; everything through i18n.
- Every domain function has tests. Run build + lint + tests at the end of each phase and fix failures before stopping.
- If something in the source documents is unclear (for example exact subsidy %), add a TODO with "VERIFY" and list it in the phase summary instead of guessing silently.
Start with Phase 1 now.
```

---

## Short follow-up prompts (use when needed)

- **Add a scheme:** `Add a new scheme <name> for department <dept> with eligibility <rule in words>, benefit <₹/%>, documents <list>. Follow the "how to add a scheme" guide, add a unit test for its eligibility, and show it in recommendations for a matching seed household.`
- **Add a survey question:** `Add question "<Hindi label>" (<type>, options: ...) to section <X>, visible only if <condition>. Update the schema, i18n, and the tests.`
- **Connect a real backend:** `Replace MSW with the real API at <base URL> using docs/api.md. Keep MSW for tests only. Add auth token handling and error retries.`
- **Fix after review:** `In phase <N> output, <screen> doesn't match the original design: <issue>. Fix it without changing other screens.`
