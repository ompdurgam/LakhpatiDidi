# स्वावलंबी दीदी – लखपति अभिसरण पोर्टल

React 19 + Vite PWA frontend, Node/Express API, MySQL (MariaDB) database.

```
src/
  app/          router, providers, AppShell (sidebar + header), RoleGuard, route errors, navigation
  api/          typed fetch client, React Query hooks, query keys, API types
  components/   ui/ (Icon, Button, Card, Drawer, Modal, Table, StatusBadge, ...) and charts/
  data/         static master data (departments)
  features/     auth, block, blcc, applications, department, households, survey,
                recommendations, dpr, monitoring, reports, admin — each with pages.tsx
  i18n/         i18next setup + locales/hi, locales/en (hi is default)
  stores/       zustand: session (token, user, role) and ui (toast, search, drawer)
  styles/       tokens.css, base.css and per-area stylesheets (imported in order)
server/
  index.ts      bootstrap (listen + graceful shutdown); app.ts builds the Express app
  routes.ts     mounts each module router under /api (public routes before requireAuth)
  config.ts     environment settings
  db/           pool.ts (query/exec/transaction helpers), migrate.ts (migration runner)
  middleware/   auth (bearer session), errorHandler
  shared/       errors, zod validation helpers, formatting, shared types
  modules/      one folder per resource: auth, applications, households, surveys,
                users, admin, meta, audit — each split into
                *.routes.ts → *.service.ts → *.repository.ts, plus schemas/mappers/labels
                (applications.workflow.ts holds one entry per workflow action)
database/       migrations/, seeds/, README.md (schema design + ER diagram)
e2e/            Playwright tests (run against the real API + MySQL)
scripts/        one-off codemods used for the Phase 1 refactor
```

## Setup

Requires Node 22.18+ (it runs the server's `.ts` files directly) and MySQL 8 or MariaDB 10.4+ (XAMPP is fine).

```bash
npm install
cp .env.example .env        # edit DB_* if your MySQL is not root with no password
npm run db:reset            # create database, run migrations, load demo data
npm run dev                 # API on :4000 + Vite on :5173 (proxies /api)
```

Open http://localhost:5173 and log in with **9826143412**. While `OTP_DEV_MODE=true`, the OTP is shown on screen, because no SMS gateway is connected yet.

Other demo mobile numbers: `9752314412` (CRP), `9425118881` (fisheries officer), `9301245176` (DPM), `9993000001` (admin). `9752300099` is a locked account.

## Quality checks

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (typescript-eslint, react-hooks, import order)
npm run format      # Prettier
npm test            # Vitest: client (jsdom) + server (node) projects, no server needed
npm run e2e         # Playwright UI + API contract tests on a separate, freshly seeded
                    # `lakhpati_didi_test` database (ports 4100/5273); needs MySQL running
```

## Production

```bash
npm run build               # type-check + build PWA into dist/
npm start                   # API on :4000 also serves dist/ (single origin)
```

Before going live:

- Set `OTP_DEV_MODE=false` and send the OTP through an SMS provider (see `/api/auth/otp` in `server/index.ts`).
- Use a dedicated MySQL user instead of `root`.
- Serve over HTTPS. The PWA needs it to install.
- The design lets any logged-in user switch roles from the header, so the API records who did each action but does not yet restrict actions by role. Add per-role checks in `server/index.ts` once role switching is limited to admins.

## What is live vs. still static

These are read from and written to MySQL:

- OTP login and sessions
- Application lists, the application panel (sanction / reject / request info / deliver / follow up / escalate / comments) and bulk sanction
- The department inbox and its KPI cards
- The household register (filters, CRP assignment, reminders, CSV export)
- Survey submission (creates or updates a household, its income sources and the survey record)
- Admin users (add, lock/unlock, OTP reset), survey section toggles and the audit log

These still show the design's sample figures: the block, district and state overview charts and totals, scheme recommendations, the DPR builder, village profile, BLCC meeting mode and reports. Their tables exist (or are straightforward to add) and can be connected the same way.
