# Ikpe Worldcup Visual-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the event app in an order where each step can be seen or manually verified in the browser.

**Architecture:** Start with the Vite React mobile UI, then attach the Hono API, then replace mock behavior with cookies and Supabase. Keep each step small enough to run locally and inspect by eye before moving on.

**Tech Stack:** pnpm workspace, Turborepo, Vite React, React Router, Hono, Cloudflare Workers, Supabase, Valibot, TanStack Query, Tailwind/shadcn later, OXC/oxlint.

---

## Principle

Build in this order:

```txt
visible screen
-> API status
-> mock form success/failure
-> cookie session
-> Supabase persistence
-> real event workflows
```

This keeps learning concrete. Every milestone should answer: "What can I open in the browser and see now?"

## Milestone 0: Current Workspace Commit

**Goal:** Finish the already-created monorepo cleanup before adding feature code.

**Files:**

- `.gitignore`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `turbo.json`
- `docs/superpowers/plans/2026-07-06-ikpe-worldcup-event-build-step-by-step.md`

- [ ] **Step 1: Check current status**

Run:

```bash
git status --short
```

Expected:

```txt
No accidental my-turborepo, node_modules, or .pnpm-store files should be untracked.
```

- [ ] **Step 2: Verify workspace command**

Run:

```bash
pnpm typecheck
```

Expected:

```txt
Turbo runs successfully. It may report no package tasks yet.
```

- [ ] **Step 3: Commit if not already committed**

Run:

```bash
git add .
git commit -m "chore: configure monorepo workspace"
```

Expected:

```txt
Commit succeeds or there is nothing to commit.
```

## Milestone 1: Visible Web Skeleton

**Goal:** Open the app in a browser and see all main mobile pages.

**Why first:** This gives immediate feedback and makes the rest of the project feel real.

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/routes.tsx`
- Create: `apps/web/src/styles/globals.css`
- Create: `apps/web/src/pages/AudiencePage.tsx`
- Create: `apps/web/src/pages/EnterPage.tsx`
- Create: `apps/web/src/pages/RegisterPage.tsx`
- Create: `apps/web/src/pages/AdminPage.tsx`
- Create: `apps/web/src/pages/HostPage.tsx`
- Create: `apps/web/src/pages/SoundPage.tsx`

- [ ] **Step 1: Create Vite React package**

Write `apps/web/package.json`:

```json
{
  "name": "@ikpe/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.6.3"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "typescript": "^5.9.2",
    "vite": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create Vite entry files**

Write `apps/web/index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ikpe Worldcup</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Write `apps/web/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: Create TypeScript config**

Write `apps/web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
```

- [ ] **Step 4: Create mobile placeholder pages**

Each page should be intentionally plain. The goal is routing, not design polish.

Write `apps/web/src/pages/AudiencePage.tsx`:

```tsx
export function AudiencePage() {
  return (
    <main className="screen">
      <h1>관객 홈</h1>
      <p>현재 경기, 투표, 결과가 여기에 표시됩니다.</p>
    </main>
  );
}
```

Write `apps/web/src/pages/EnterPage.tsx`:

```tsx
export function EnterPage() {
  return (
    <main className="screen">
      <h1>입장 코드</h1>
      <p>팔찌나 QR의 코드를 입력하는 화면입니다.</p>
    </main>
  );
}
```

Write the remaining pages with the same simple shape:

```tsx
export function RegisterPage() {
  return <main className="screen"><h1>참가자 등록</h1></main>;
}
```

```tsx
export function AdminPage() {
  return <main className="screen"><h1>관리자</h1></main>;
}
```

```tsx
export function HostPage() {
  return <main className="screen"><h1>사회자</h1></main>;
}
```

```tsx
export function SoundPage() {
  return <main className="screen"><h1>사운드 큐시트</h1></main>;
}
```

- [ ] **Step 5: Create routes**

Write `apps/web/src/app/routes.tsx`:

```tsx
import { createBrowserRouter } from "react-router";
import { AdminPage } from "../pages/AdminPage";
import { AudiencePage } from "../pages/AudiencePage";
import { EnterPage } from "../pages/EnterPage";
import { HostPage } from "../pages/HostPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SoundPage } from "../pages/SoundPage";

export const router = createBrowserRouter([
  { path: "/", element: <AudiencePage /> },
  { path: "/enter", element: <EnterPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/admin", element: <AdminPage /> },
  { path: "/host", element: <HostPage /> },
  { path: "/sound", element: <SoundPage /> },
]);
```

Write `apps/web/src/app/App.tsx`:

```tsx
import { RouterProvider } from "react-router";
import { router } from "./routes";

export function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 6: Create app entry and mobile CSS**

Write `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Write `apps/web/src/styles/globals.css`:

```css
:root {
  color: #171717;
  background: #fafafa;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.screen {
  width: min(100%, 430px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px 16px;
}

a,
button,
input,
textarea,
select {
  font: inherit;
}
```

- [ ] **Step 7: Install and run**

Run:

```bash
pnpm install
pnpm --filter @ikpe/web dev
```

Expected:

```txt
Vite starts.
Open /, /enter, /register, /admin, /host, /sound and see each page.
```

- [ ] **Step 8: Typecheck and commit**

Run:

```bash
pnpm --filter @ikpe/web typecheck
git add apps/web package.json pnpm-lock.yaml
git commit -m "chore: add visible web skeleton"
```

## Milestone 2: API Health Visible From Web

**Goal:** See API connectivity on the web page.

**Files:**

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/wrangler.toml`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/routes/health.ts`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/src/pages/EnterPage.tsx`

- [ ] **Step 1: Create minimal Hono API**

Create `/api/health` returning:

```json
{ "ok": true, "service": "ikpe-worldcup-api" }
```

- [ ] **Step 2: Proxy web `/api` to Worker**

Update Vite config:

```ts
server: {
  proxy: {
    "/api": "http://localhost:8787"
  }
}
```

- [ ] **Step 3: Show API status on `/enter`**

Add a small button or effect on `EnterPage`:

```txt
API 상태 확인
-> fetch("/api/health")
-> 화면에 "API OK" 표시
```

- [ ] **Step 4: Run both servers and verify**

Run two terminals:

```bash
pnpm --filter @ikpe/api dev
pnpm --filter @ikpe/web dev
```

Expected:

```txt
/enter shows API OK after clicking or loading status.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api apps/web package.json pnpm-lock.yaml
git commit -m "chore: connect web to api health"
```

## Milestone 3: Mock Entrance Code Form

**Goal:** Submit a code and see success/failure before any database work.

**Visible behavior:**

```txt
X4T82Q -> success
anything else -> failure
```

**Files:**

- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/schemas/enter.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/src/routes/enter.ts`
- Modify: `apps/web/src/pages/EnterPage.tsx`

- [ ] **Step 1: Create minimal shared schema**

Create `enterRequestSchema` with Valibot:

```ts
import * as v from "valibot";

export const enterRequestSchema = v.object({
  code: v.pipe(v.string(), v.trim(), v.minLength(4), v.maxLength(32)),
});

export type EnterRequest = v.InferOutput<typeof enterRequestSchema>;
```

- [ ] **Step 2: Add mock `/api/enter`**

API behavior:

```txt
Normalize code with trim().toUpperCase().
If code is X4T82Q, return { ok: true }.
Otherwise return { ok: false, error: "INVALID_CODE" } with 401.
```

- [ ] **Step 3: Add real form UI**

`/enter` should show:

```txt
input
submit button
loading text
success text
error text
```

- [ ] **Step 4: Verify by eye**

Run:

```bash
pnpm --filter @ikpe/api dev
pnpm --filter @ikpe/web dev
```

Expected:

```txt
X4T82Q shows success.
Other codes show failure.
No Supabase is required yet.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api apps/web packages/shared package.json pnpm-lock.yaml
git commit -m "feat: add mock entrance flow"
```

## Milestone 4: httpOnly Cookie Session

**Goal:** Successful mock entrance sets a cookie and survives refresh.

**Visible behavior:**

```txt
Enter X4T82Q
-> redirect to /
-> refresh /
-> audience home still says entered
```

**Files:**

- Create: `apps/api/src/lib/cookies.ts`
- Modify: `apps/api/src/routes/enter.ts`
- Create: `apps/api/src/routes/session.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/web/src/pages/AudiencePage.tsx`

- [ ] **Step 1: Set cookie on mock success**

Cookie:

```txt
audience_session=mock-audience-code-id
HttpOnly
Secure in production
SameSite=Lax
Path=/
```

- [ ] **Step 2: Add `/api/session`**

Return:

```json
{ "entered": true }
```

when cookie exists, otherwise:

```json
{ "entered": false }
```

- [ ] **Step 3: Show session state on audience home**

`/` should show:

```txt
입장 완료
```

or:

```txt
입장 코드가 필요합니다
```

- [ ] **Step 4: Verify in browser devtools**

Check:

```txt
Application -> Cookies
audience_session exists
JavaScript cannot read httpOnly cookie
```

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api apps/web
git commit -m "feat: add entrance cookie session"
```

## Milestone 5: Supabase Replaces Mock Code

**Goal:** Keep the same visible `/enter` behavior, but validate against Supabase.

**Files:**

- Create: `.env.example`
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202607070001_initial_event_schema.sql`
- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/lib/supabase.ts`
- Modify: `apps/api/src/routes/enter.ts`

- [ ] **Step 1: Add minimal schema**

Create:

```txt
events
audience_codes
event_state
```

Only add what `/enter` needs now.

- [ ] **Step 2: Add env validation**

Required server env:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
COOKIE_SECRET
```

- [ ] **Step 3: Replace mock lookup**

`/api/enter` should:

```txt
normalize code
hash code
find audience_codes.code_hash
reject missing/blocked
activate unused
set audience_session cookie
```

- [ ] **Step 4: Verify same UI**

Expected:

```txt
/enter still looks the same.
Now success depends on Supabase data.
```

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/api supabase .env.example
git commit -m "feat: validate entrance codes with supabase"
```

## Later Milestones

After the visible entrance flow is real, continue in this order:

1. Participant registration page with mock save, then DB save.
2. Music link and cue note submission.
3. Admin login with httpOnly role cookie.
4. Admin participant list.
5. Bracket draft generation and publish.
6. Vote session open/close/reveal.
7. Audience vote screen with polling.
8. Host current/next view.
9. Sound cue sheet.
10. Admin reset controls.
11. Mobile QA and deployment.

## Notes

- Prefer visible progress over invisible architecture.
- Do not add Supabase before mock UI/API flow works.
- Do not add shadcn before the route skeleton is visible.
- Do not add Formisch/TanStack Form until the plain form behavior is understood.
- Do not add Realtime until polling works.

