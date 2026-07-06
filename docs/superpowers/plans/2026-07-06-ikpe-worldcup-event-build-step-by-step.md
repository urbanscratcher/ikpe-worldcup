# Ikpe Worldcup Event Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real event-day mobile web app for 익페 랩월드컵 with entrance-code identity, participant registration, cue-sheet links, admin event control, voting, host view, and sound view.

**Architecture:** Use a pnpm/Turbo monorepo with a Vite React CSR app in `apps/web`, a Hono Cloudflare Worker API in `apps/api`, shared Valibot schemas and pure domain helpers in `packages/shared`, and Supabase migrations in `supabase`. The browser only talks to the Hono API; the API validates input, checks httpOnly cookie sessions, and talks to Supabase.

**Tech Stack:** pnpm workspace, Turborepo, TypeScript, Vite React, React Router, TanStack Query, Hono, Cloudflare Workers/Pages, Supabase Postgres, Valibot, Tailwind CSS, shadcn/ui Base UI, OXC formatter, oxlint.

---

## Source Spec

Implement from:

- `docs/superpowers/specs/2026-07-05-ikpe-worldcup-design.md`

Ignore the older Next.js implementation plan:

- `docs/superpowers/plans/2026-07-05-ikpe-worldcup-entrance-code-mvp.md`

That older plan is kept only as historical context and is marked superseded.

## Current Starting Point

Already present:

- Root workspace scaffold: `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- Empty app folders: `apps/web`, `apps/api`
- Empty shared package folder: `packages/shared`
- Empty Supabase folder: `supabase`
- Root docs/specs

Important current repo cleanup:

- `node_modules` and `.pnpm-store` were previously tracked by mistake and are staged for removal from git.
- Keep `.gitignore` so dependency folders stay untracked.

## Target File Structure

Create or evolve toward:

```txt
apps/
  web/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    src/
      main.tsx
      app/App.tsx
      app/routes.tsx
      lib/api.ts
      lib/query-client.ts
      styles/globals.css
      pages/EnterPage.tsx
      pages/AudiencePage.tsx
      pages/RegisterPage.tsx
      pages/AdminPage.tsx
      pages/HostPage.tsx
      pages/SoundPage.tsx
  api/
    package.json
    tsconfig.json
    wrangler.toml
    src/
      index.ts
      app.ts
      env.ts
      middleware/session.ts
      middleware/role.ts
      routes/health.ts
      routes/enter.ts
      routes/roles.ts
      routes/participants.ts
      routes/music-links.ts
      routes/admin.ts
      routes/votes.ts
      routes/public-state.ts
      lib/supabase.ts
      lib/cookies.ts
packages/
  shared/
    package.json
    tsconfig.json
    src/
      index.ts
      constants.ts
      schemas/
        enter.ts
        roles.ts
        participants.ts
        music-links.ts
        votes.ts
        admin.ts
      domain/
        bracket.ts
        votes.ts
supabase/
  config.toml
  migrations/
    202607060001_initial_event_schema.sql
.env.example
```

## Milestone 0: Commit Current Workspace Scaffold

**Files:**

- Add: `.gitignore`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Add: `pnpm-workspace.yaml`
- Add: `turbo.json`
- Remove from git index: `node_modules/**`, `.pnpm-store/**`

- [ ] **Step 1: Review staged scaffold changes**

Run:

```bash
git status --short
git diff --cached --stat
```

Expected:

```txt
.gitignore, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, turbo.json are staged.
node_modules and .pnpm-store are staged for deletion from git.
```

- [ ] **Step 2: Run workspace smoke check**

Run:

```bash
pnpm typecheck
```

Expected:

```txt
turbo run typecheck succeeds.
It may warn that no package tasks were executed because app packages are not created yet.
```

- [ ] **Step 3: Commit scaffold cleanup**

Run:

```bash
git commit -m "chore: configure monorepo workspace"
```

Expected:

```txt
Commit succeeds.
```

## Milestone 1: Create Shared Package

**Files:**

- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/schemas/enter.ts`
- Create: `packages/shared/src/schemas/roles.ts`

- [ ] **Step 1: Create shared package manifest**

Write `packages/shared/package.json`:

```json
{
  "name": "@ikpe/shared",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schemas/enter": "./src/schemas/enter.ts",
    "./schemas/roles": "./src/schemas/roles.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "valibot": "^1.1.0"
  },
  "devDependencies": {
    "typescript": "^5.9.2"
  }
}
```

- [ ] **Step 2: Create shared TypeScript config**

Write `packages/shared/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create constants**

Write `packages/shared/src/constants.ts`:

```ts
export const ROLE_NAMES = ["admin", "host", "sound"] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export const MUSIC_PURPOSES = ["entrance", "round1", "round2", "etc"] as const;

export type MusicPurpose = (typeof MUSIC_PURPOSES)[number];
```

- [ ] **Step 4: Create entrance schema**

Write `packages/shared/src/schemas/enter.ts`:

```ts
import * as v from "valibot";

export const enterRequestSchema = v.object({
  code: v.pipe(v.string(), v.trim(), v.minLength(4), v.maxLength(32)),
});

export type EnterRequest = v.InferOutput<typeof enterRequestSchema>;

export type EnterResponse =
  | { ok: true; audienceCodeId: string }
  | { ok: false; error: "INVALID_CODE" | "BLOCKED_CODE" | "INVALID_INPUT" };
```

- [ ] **Step 5: Create role login schema**

Write `packages/shared/src/schemas/roles.ts`:

```ts
import * as v from "valibot";
import { ROLE_NAMES } from "../constants";

export const roleLoginRequestSchema = v.object({
  role: v.picklist(ROLE_NAMES),
  password: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
});

export type RoleLoginRequest = v.InferOutput<typeof roleLoginRequestSchema>;

export type RoleLoginResponse =
  | { ok: true; role: "admin" | "host" | "sound" }
  | { ok: false; error: "INVALID_ROLE" | "INVALID_PASSWORD" | "INVALID_INPUT" };
```

- [ ] **Step 6: Export shared modules**

Write `packages/shared/src/index.ts`:

```ts
export * from "./constants";
export * from "./schemas/enter";
export * from "./schemas/roles";
```

- [ ] **Step 7: Install dependencies**

Run:

```bash
pnpm install
```

Expected:

```txt
valibot is added to the shared package lockfile graph.
```

- [ ] **Step 8: Verify shared package**

Run:

```bash
pnpm --filter @ikpe/shared typecheck
```

Expected:

```txt
TypeScript exits successfully.
```

- [ ] **Step 9: Commit shared package**

Run:

```bash
git add packages/shared package.json pnpm-lock.yaml
git commit -m "chore: add shared domain package"
```

## Milestone 2: Create Hono API Worker

**Files:**

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/wrangler.toml`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/src/env.ts`

- [ ] **Step 1: Create API package manifest**

Write `apps/api/package.json`:

```json
{
  "name": "@ikpe/api",
  "private": true,
  "type": "module",
  "exports": {
    "./app": "./src/app.ts"
  },
  "scripts": {
    "dev": "wrangler dev src/index.ts --local",
    "build": "wrangler deploy --dry-run --outdir dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hono/valibot-validator": "^0.5.3",
    "@ikpe/shared": "workspace:*",
    "@supabase/supabase-js": "^2.52.0",
    "hono": "^4.8.0",
    "valibot": "^1.1.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250706.0",
    "typescript": "^5.9.2",
    "wrangler": "^4.24.0"
  }
}
```

- [ ] **Step 2: Create API TypeScript config**

Write `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create Worker config**

Write `apps/api/wrangler.toml`:

```toml
name = "ikpe-worldcup-api"
main = "src/index.ts"
compatibility_date = "2026-07-06"

[vars]
APP_ENV = "local"
```

- [ ] **Step 4: Define API env type**

Write `apps/api/src/env.ts`:

```ts
export type ApiEnv = {
  APP_ENV: "local" | "preview" | "production";
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ADMIN_PASSWORD_HASH: string;
  HOST_PASSWORD_HASH: string;
  SOUND_PASSWORD_HASH: string;
  COOKIE_SECRET: string;
};
```

- [ ] **Step 5: Create health route**

Write `apps/api/src/routes/health.ts`:

```ts
import { Hono } from "hono";
import type { ApiEnv } from "../env";

export const healthRoute = new Hono<{ Bindings: ApiEnv }>().get("/", (c) => {
  return c.json({
    ok: true,
    service: "ikpe-worldcup-api",
    env: c.env.APP_ENV,
  });
});
```

- [ ] **Step 6: Create Hono app**

Write `apps/api/src/app.ts`:

```ts
import { Hono } from "hono";
import type { ApiEnv } from "./env";
import { healthRoute } from "./routes/health";

export const app = new Hono<{ Bindings: ApiEnv }>().route("/health", healthRoute);

export type AppType = typeof app;
```

- [ ] **Step 7: Create Worker entry**

Write `apps/api/src/index.ts`:

```ts
import { app } from "./app";

export default app;
```

- [ ] **Step 8: Install dependencies**

Run:

```bash
pnpm install
```

Expected:

```txt
Hono, Wrangler, Supabase JS, and Worker types are installed.
```

- [ ] **Step 9: Verify API types**

Run:

```bash
pnpm --filter @ikpe/api typecheck
```

Expected:

```txt
TypeScript exits successfully.
```

- [ ] **Step 10: Run API locally**

Run:

```bash
pnpm --filter @ikpe/api dev
```

Expected:

```txt
Wrangler starts a local Worker.
GET /health returns {"ok":true,...}.
```

- [ ] **Step 11: Commit API skeleton**

Run:

```bash
git add apps/api package.json pnpm-lock.yaml
git commit -m "chore: add hono api worker"
```

## Milestone 3: Create Vite React Web App

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/routes.tsx`
- Create: `apps/web/src/lib/query-client.ts`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/styles/globals.css`
- Create: route page files under `apps/web/src/pages/`

- [ ] **Step 1: Create web package manifest**

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
    "@hono/client": "^4.8.0",
    "@ikpe/shared": "workspace:*",
    "@tanstack/react-query": "^5.83.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.6.3",
    "valibot": "^1.1.0"
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

- [ ] **Step 2: Create Vite files**

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
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
```

- [ ] **Step 3: Create web TypeScript config**

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

- [ ] **Step 4: Create Query client**

Write `apps/web/src/lib/query-client.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

- [ ] **Step 5: Create API helper**

Write `apps/web/src/lib/api.ts`:

```ts
export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 6: Create placeholder pages**

Write `apps/web/src/pages/EnterPage.tsx`:

```tsx
export function EnterPage() {
  return <main className="screen">입장 코드</main>;
}
```

Write `apps/web/src/pages/AudiencePage.tsx`:

```tsx
export function AudiencePage() {
  return <main className="screen">관객 홈</main>;
}
```

Write `apps/web/src/pages/RegisterPage.tsx`:

```tsx
export function RegisterPage() {
  return <main className="screen">참가자 등록</main>;
}
```

Write `apps/web/src/pages/AdminPage.tsx`:

```tsx
export function AdminPage() {
  return <main className="screen">관리자</main>;
}
```

Write `apps/web/src/pages/HostPage.tsx`:

```tsx
export function HostPage() {
  return <main className="screen">사회자</main>;
}
```

Write `apps/web/src/pages/SoundPage.tsx`:

```tsx
export function SoundPage() {
  return <main className="screen">사운드 큐시트</main>;
}
```

- [ ] **Step 7: Create routes and app**

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
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { queryClient } from "../lib/query-client";
import { router } from "./routes";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 8: Create entry and global CSS**

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
```

- [ ] **Step 9: Install and typecheck**

Run:

```bash
pnpm install
pnpm --filter @ikpe/web typecheck
```

Expected:

```txt
Install succeeds and TypeScript exits successfully.
```

- [ ] **Step 10: Run web locally**

Run:

```bash
pnpm --filter @ikpe/web dev
```

Expected:

```txt
Vite starts and all placeholder routes render.
```

- [ ] **Step 11: Commit web skeleton**

Run:

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "chore: add mobile web skeleton"
```

## Milestone 4: Supabase Schema

**Files:**

- Create: `supabase/config.toml`
- Create: `supabase/migrations/202607060001_initial_event_schema.sql`
- Create: `.env.example`

- [ ] **Step 1: Create env example**

Write `.env.example`:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD_HASH=
HOST_PASSWORD_HASH=
SOUND_PASSWORD_HASH=
COOKIE_SECRET=
VITE_PUBLIC_APP_URL=
```

- [ ] **Step 2: Create initial migration**

Write `supabase/migrations/202607060001_initial_event_schema.sql` with tables:

```sql
create extension if not exists pgcrypto;

create type audience_code_status as enum ('unused', 'active', 'blocked');
create type participant_status as enum ('applied', 'confirmed', 'absent');
create type bracket_status as enum ('draft', 'published', 'archived');
create type vote_session_status as enum ('draft', 'open', 'closed', 'result_visible');

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'setup',
  created_at timestamptz not null default now()
);

create table audience_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  code_hash text not null unique,
  status audience_code_status not null default 'unused',
  activated_at timestamptz,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  entrance_code_id uuid references audience_codes(id) on delete set null,
  name text not null,
  stage_name text not null,
  crew_name text,
  bio text,
  status participant_status not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, entrance_code_id)
);

create table music_links (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  title text not null,
  purpose text not null,
  url text,
  memo text,
  sound_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bracket_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  status bracket_status not null default 'draft',
  bracket_size int not null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table bracket_slots (
  id uuid primary key default gen_random_uuid(),
  bracket_run_id uuid not null references bracket_runs(id) on delete cascade,
  slot_order int not null,
  label text not null,
  slot_type text not null,
  winner_participant_id uuid references participants(id) on delete set null,
  unique (bracket_run_id, slot_order)
);

create table bracket_slot_participants (
  bracket_slot_id uuid not null references bracket_slots(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  participant_order int not null,
  primary key (bracket_slot_id, participant_id)
);

create table vote_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  status vote_session_status not null default 'draft',
  opened_at timestamptz,
  closed_at timestamptz,
  result_visible_at timestamptz,
  created_at timestamptz not null default now()
);

create table vote_candidates (
  vote_session_id uuid not null references vote_sessions(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  candidate_order int not null,
  primary key (vote_session_id, participant_id)
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  vote_session_id uuid not null references vote_sessions(id) on delete cascade,
  audience_code_id uuid not null references audience_codes(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (vote_session_id, audience_code_id)
);

create table event_state (
  event_id uuid primary key references events(id) on delete cascade,
  registration_open boolean not null default true,
  current_vote_session_id uuid references vote_sessions(id) on delete set null,
  current_bracket_run_id uuid references bracket_runs(id) on delete set null,
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 3: Commit schema**

Run:

```bash
git add .env.example supabase
git commit -m "feat: add initial supabase schema"
```

## Milestone 5: Entrance-Code Vertical Slice

**Files:**

- Create: `apps/api/src/lib/supabase.ts`
- Create: `apps/api/src/lib/cookies.ts`
- Create: `apps/api/src/routes/enter.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/web/src/pages/EnterPage.tsx`

- [ ] **Step 1: Implement server-side `/enter` route**

Requirements:

- Validate JSON body with `enterRequestSchema`.
- Normalize code with `trim().toUpperCase()`.
- Hash code server-side before DB lookup.
- Reject unknown and blocked codes.
- Mark unused code active.
- Set `audience_session` httpOnly cookie.

- [ ] **Step 2: Implement mobile `/enter` page**

Requirements:

- One input.
- One large submit button.
- Show loading/error/success.
- Submit to `POST /api/enter` with `credentials: "include"`.
- Redirect to `/` on success.

- [ ] **Step 3: Verify entrance flow manually**

Run API and web:

```bash
pnpm --filter @ikpe/api dev
pnpm --filter @ikpe/web dev
```

Expected:

```txt
/enter submits to API.
Successful response sets httpOnly cookie.
Browser redirects to /.
```

- [ ] **Step 4: Commit entrance slice**

Run:

```bash
git add apps/api apps/web packages/shared
git commit -m "feat: add entrance code flow"
```

## Milestone 6: Role Login and Route Guards

**Files:**

- Create: `apps/api/src/routes/roles.ts`
- Create: `apps/api/src/middleware/role.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/web/src/components/RoleGate.tsx`
- Modify: `apps/web/src/pages/AdminPage.tsx`
- Modify: `apps/web/src/pages/HostPage.tsx`
- Modify: `apps/web/src/pages/SoundPage.tsx`

- [ ] **Step 1: Add role login API**

Routes:

```txt
POST /api/roles/login
POST /api/roles/logout
GET /api/roles/me
```

Expected:

```txt
Successful login sets role-specific httpOnly cookie.
Invalid password returns 401.
```

- [ ] **Step 2: Add `RoleGate`**

Behavior:

- Shows password form if not logged in.
- Calls `/api/roles/login`.
- Renders children after success.

- [ ] **Step 3: Wrap admin, host, and sound pages**

Use roles:

```txt
/admin -> admin
/host -> host
/sound -> sound
```

- [ ] **Step 4: Commit role gates**

Run:

```bash
git add apps/api apps/web packages/shared
git commit -m "feat: add role login gates"
```

## Milestone 7: Participant Registration and Cue Links

**Files:**

- Create: `packages/shared/src/schemas/participants.ts`
- Create: `packages/shared/src/schemas/music-links.ts`
- Create: `apps/api/src/routes/participants.ts`
- Create: `apps/api/src/routes/music-links.ts`
- Modify: `apps/web/src/pages/RegisterPage.tsx`
- Modify: `apps/web/src/pages/SoundPage.tsx`

- [ ] **Step 1: Add participant and music-link schemas**

Define:

```txt
participant registration: name, stageName, crewName, bio
music link: title, purpose, url, memo
```

- [ ] **Step 2: Add participant API routes**

Routes:

```txt
GET /api/participants/me
POST /api/participants
PATCH /api/participants/me
GET /api/participants
```

- [ ] **Step 3: Add music link API routes**

Routes:

```txt
GET /api/music-links/me
POST /api/music-links
PATCH /api/music-links/:id
DELETE /api/music-links/:id
PATCH /api/music-links/:id/check
```

- [ ] **Step 4: Build mobile registration UI**

Fields:

```txt
name
stage name
crew name
bio
music link title
purpose
url
memo
```

- [ ] **Step 5: Build sound cue sheet**

Show:

```txt
current/next placeholder
participants
music links
cue memos
checked status
last updated time
```

- [ ] **Step 6: Commit participant and cue sheet**

Run:

```bash
git add apps/api apps/web packages/shared
git commit -m "feat: add participant registration and cue sheet"
```

## Milestone 8: Admin Bracket Draft and Publish

**Files:**

- Create: `packages/shared/src/domain/bracket.ts`
- Create: `packages/shared/src/schemas/admin.ts`
- Create: `apps/api/src/routes/admin.ts`
- Modify: `apps/web/src/pages/AdminPage.tsx`

- [ ] **Step 1: Implement bracket generator**

Inputs:

```txt
participants
bracket size: 2 | 4 | 8 | 16
```

Output:

```txt
draft bracket slots with group, battle, or bye
```

- [ ] **Step 2: Add admin bracket APIs**

Routes:

```txt
POST /api/admin/brackets/generate
POST /api/admin/brackets/publish
GET /api/admin/brackets/draft
GET /api/bracket
```

- [ ] **Step 3: Build admin bracket UI**

Actions:

```txt
choose size
generate draft
regenerate draft
publish draft
view published bracket
```

- [ ] **Step 4: Commit bracket flow**

Run:

```bash
git add apps/api apps/web packages/shared
git commit -m "feat: add bracket draft publishing"
```

## Milestone 9: Voting Flow

**Files:**

- Create: `packages/shared/src/schemas/votes.ts`
- Create: `packages/shared/src/domain/votes.ts`
- Create: `apps/api/src/routes/votes.ts`
- Modify: `apps/web/src/pages/AudiencePage.tsx`
- Modify: `apps/web/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add vote APIs**

Routes:

```txt
GET /api/votes/current
POST /api/votes
GET /api/votes/:id/results
POST /api/admin/vote-sessions
POST /api/admin/vote-sessions/:id/open
POST /api/admin/vote-sessions/:id/close
POST /api/admin/vote-sessions/:id/reveal
```

- [ ] **Step 2: Enforce DB and server rules**

Rules:

```txt
Only one open vote session.
Only logged-in audience can vote.
One vote per entrance code per vote session.
Closed vote sessions reject new votes.
Results only show after reveal.
```

- [ ] **Step 3: Build audience voting UI**

Show:

```txt
current vote
candidate buttons
already voted state
closed/no open vote state
revealed results
```

- [ ] **Step 4: Build admin vote controls**

Actions:

```txt
create session
open
close
reveal
view counts
```

- [ ] **Step 5: Commit voting**

Run:

```bash
git add apps/api apps/web packages/shared
git commit -m "feat: add vote sessions"
```

## Milestone 10: Host, Sound, Polling, and Reset

**Files:**

- Create: `apps/api/src/routes/public-state.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/web/src/pages/HostPage.tsx`
- Modify: `apps/web/src/pages/SoundPage.tsx`
- Modify: `apps/web/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add public state API**

Routes:

```txt
GET /api/state
GET /api/sound/cue-sheet
```

- [ ] **Step 2: Add polling queries**

Polling intervals:

```txt
Audience current vote/state: 3000 ms
Admin dashboard state: 3000 ms
Host state: 3000 ms
Sound cue sheet: 5000 ms
```

- [ ] **Step 3: Build host view**

Show:

```txt
current battle/session
next item if available
vote status
result summary
```

- [ ] **Step 4: Build admin reset controls**

Server reset actions:

```txt
votes only
vote sessions/results
draft brackets
published bracket and drafts
event state
sound checked status
full rehearsal reset keeping participants, entrance codes, and music links
```

Dangerous actions require confirmation text.

- [ ] **Step 5: Commit state and reset controls**

Run:

```bash
git add apps/api apps/web packages/shared
git commit -m "feat: add event state polling and resets"
```

## Milestone 11: Mobile QA and Deployment

**Files:**

- Create: `apps/web/public/_redirects` or equivalent Cloudflare Pages routing config if needed
- Modify: `apps/api/wrangler.toml`
- Create: `docs/runbook-event-day.md`

- [ ] **Step 1: Verify same-origin routing**

Target deployment:

```txt
battle.vote/* -> Cloudflare Pages web app
battle.vote/api/* -> Cloudflare Worker API
```

Expected:

```txt
Cookies work without cross-origin CORS complexity.
```

- [ ] **Step 2: Write event day runbook**

Write `docs/runbook-event-day.md` with:

```md
# Event Day Runbook

## Before Doors

- Confirm production Supabase project.
- Confirm Cloudflare Pages deployment.
- Confirm Worker route for `/api/*`.
- Confirm admin, host, and sound passwords.
- Confirm entrance codes are seeded.
- Confirm test vote can be opened, submitted, closed, and revealed.

## Rehearsal Reset

- Use admin reset controls.
- Keep participants, entrance codes, and music links unless intentionally deleting them.

## During Event

- Admin opens/closes votes.
- Host reads `/host`.
- Sound operator reads `/sound`.
- Audience uses `/enter` and `/`.

## Emergency

- If polling fails, refresh page.
- If wrong vote opens, close it and create a new vote session.
- If bracket draft is wrong, regenerate draft and do not publish until correct.
```

- [ ] **Step 3: Mobile browser smoke test**

Test:

```txt
iPhone Safari or Simulator Safari
Android Chrome or Chrome mobile viewport
360px viewport
430px viewport
```

Flows:

```txt
enter code
register participant
add music link
admin login
generate/publish bracket
open vote
audience vote
close/reveal result
host view
sound cue sheet
reset rehearsal data
```

- [ ] **Step 4: Commit deployment docs**

Run:

```bash
git add apps/api apps/web docs/runbook-event-day.md
git commit -m "docs: add event day deployment runbook"
```

## Self-Review

Spec coverage:

- Mobile-only CSR web: Milestones 3 and 11.
- Hono API server boundary: Milestone 2.
- Supabase schema and server-side DB access: Milestones 4 and 5 onward.
- httpOnly cookie sessions: Milestones 5 and 6.
- Participant registration and cue links: Milestone 7.
- Admin bracket draft/publish: Milestone 8.
- Voting flow: Milestone 9.
- Host/sound views and polling: Milestone 10.
- Admin reset controls: Milestone 10.
- Event QA and deployment: Milestone 11.

Known deferred items:

- Direct audio upload is intentionally out of scope.
- Supabase Realtime is optional after polling is stable.
- Full automatic tournament progression is out of scope.
- Complex RLS is deferred because API route authorization is the primary event-build boundary.

