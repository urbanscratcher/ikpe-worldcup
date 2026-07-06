# Ikpe Worldcup Entrance-Code MVP Implementation Plan

> **Superseded on 2026-07-06:** This plan targets Next.js App Router, Supabase Storage, and Zod. The current event build decision is a monorepo with `apps/web` Vite React CSR on Cloudflare Pages, `apps/api` Hono Cloudflare Worker API, `packages/shared` TypeScript/Valibot/domain helpers, Supabase DB, music-link/cue-sheet submission instead of file upload, OXC lint/format, and mobile-web-only UI. Do not implement from this plan without rewriting it for the new stack.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved 익페 랩월드컵 MVP: entrance-code audience identity, optional participant profile, music submission, sound cue sheet, flexible vote sessions, winner prediction lotto, host view, and minimal admin controls.

**Architecture:** Use a Next.js App Router application with Supabase Postgres and Supabase Storage. Keep all domain rules in small pure TypeScript modules first, then connect them through server actions and role-specific pages. Use entrance codes as the only regular-user identity; role pages use shared passwords.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Supabase JS, Zod, Vitest, Playwright, lucide-react.

---

## Source Spec

Implement from:

- `docs/superpowers/specs/2026-07-05-ikpe-worldcup-design.md`

Ignore the older pre-brainstorming implementation plan if it appears in history. The approved design is entrance-code-centered.

## File Structure

- Create `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`: project and test configuration.
- Create `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`: app shell and public route.
- Create `src/lib/types.ts`: shared domain types.
- Create `src/lib/assignment.ts`: first-round advancement slot generation.
- Create `src/lib/music-file.ts`: music file labels and sound status.
- Create `src/lib/access.ts`: role password and entrance-code helpers.
- Create `src/lib/vote.ts`: vote result and duplicate-key helpers.
- Create `src/lib/env.ts`: environment parsing.
- Create `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`: Supabase clients.
- Create `src/components/RoleGate.tsx`: password gate for sound, host, admin.
- Create `src/components/EntranceGate.tsx`: entrance-code gate for regular users.
- Create `src/components/StatusBadge.tsx`, `src/components/MusicFileRow.tsx`, `src/components/ParticipantCard.tsx`: reusable UI.
- Create `src/app/actions/entrance.ts`: validate entrance code and create session cookie.
- Create `src/app/actions/participants.ts`: create/edit participant profile and music files.
- Create `src/app/actions/admin.ts`: create entrance codes, assignment slots, event state, vote sessions.
- Create `src/app/actions/votes.ts`: submit vote and lotto.
- Create `src/app/actions/sound.ts`: mark file checked.
- Create `src/app/audience/page.tsx`: audience home after entrance code.
- Create `src/app/participant/page.tsx`: participant profile and files.
- Create `src/app/sound/page.tsx`: full cue sheet.
- Create `src/app/host/page.tsx`: large readable host view.
- Create `src/app/admin/page.tsx`: minimal admin control surface.
- Create `supabase/schema.sql`: database schema and constraints.
- Create `tests/*.test.ts`: pure-domain tests.
- Create `tests/e2e/*.spec.ts`: smoke tests.

## Data Model Summary

Tables:

- `entrance_codes`
- `participants`
- `music_files`
- `round_slots`
- `round_slot_participants`
- `vote_sessions`
- `vote_session_candidates`
- `votes`
- `prediction_lottos`
- `event_state`

Important constraints:

- `entrance_codes.code` unique.
- `participants.entrance_code_id` unique.
- `votes` unique by `vote_session_id, entrance_code_id`.
- `prediction_lottos.entrance_code_id` unique.
- MVP allows only one open vote session through server action validation.

---

### Task 1: Scaffold App and Test Harness

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create project manifest**

Write `package.json`:

```json
{
  "name": "ikpe-worldcup",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.45.4",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^22.7.4",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vitest": "^2.1.2"
  }
}
```

- [ ] **Step 2: Create Next and TypeScript configuration**

Write `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true
};

export default nextConfig;
```

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Write `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

- [ ] **Step 3: Create Tailwind configuration**

Write `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Write `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#fafafa",
        acid: "#d8f23a",
        danger: "#e5484d",
        warning: "#f5b942",
        ok: "#2fb875"
      }
    }
  },
  plugins: []
};

export default config;
```

- [ ] **Step 4: Create app shell**

Write `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  background: #fafafa;
  color: #151515;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: inherit;
}
```

Write `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "익페 랩월드컵",
  description: "관객의 뇌에 물음표를 꽂는 이상한 랩 토너먼트"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Write `src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 text-ink">
      <section className="mx-auto max-w-xl">
        <p className="text-sm font-black">익페 랩월드컵</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">당신은 어떤 익페세요?</h1>
        <div className="mt-8 grid gap-3">
          <Link className="rounded-lg border-2 border-ink bg-white p-5 text-xl font-black hover:bg-acid" href="/audience">
            입장 코드로 들어가기
          </Link>
          <Link className="rounded-lg border-2 border-ink bg-white p-5 font-black hover:bg-acid" href="/sound">
            사운드
          </Link>
          <Link className="rounded-lg border-2 border-ink bg-white p-5 font-black hover:bg-acid" href="/host">
            진행자
          </Link>
          <Link className="rounded-lg border-2 border-ink bg-white p-5 font-black hover:bg-acid" href="/admin">
            운영자
          </Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 6: Verify scaffold**

Run: `npm run test`

Expected: Vitest reports no test files or passes empty suite without TypeScript config errors.

Run: `npm run build`

Expected: Next production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts vitest.config.ts src/app
git commit -m "chore: scaffold event app"
```

---

### Task 2: Add Domain Types and Pure Helpers

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/assignment.ts`
- Create: `src/lib/music-file.ts`
- Create: `src/lib/vote.ts`
- Test: `tests/assignment.test.ts`
- Test: `tests/music-file.test.ts`
- Test: `tests/vote.test.ts`

- [ ] **Step 1: Write assignment tests**

Write `tests/assignment.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFirstRoundSlots, getAvailableAdvancementSlots } from "@/lib/assignment";
import type { Participant } from "@/lib/types";

function participants(count: number): Participant[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p-${index + 1}`,
    entranceCodeId: `code-${index + 1}`,
    artistName: `P${index + 1}`,
    autotuneRequired: false,
    note: "",
    order: index + 1,
    status: "confirmed",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z"
  }));
}

describe("getAvailableAdvancementSlots", () => {
  it("disables slots greater than confirmed participant count", () => {
    expect(getAvailableAdvancementSlots(13)).toEqual([2, 4, 8]);
    expect(getAvailableAdvancementSlots(30)).toEqual([2, 4, 8, 16]);
    expect(getAvailableAdvancementSlots(1)).toEqual([]);
  });
});

describe("createFirstRoundSlots", () => {
  it("creates balanced groups when participant count is larger than slots", () => {
    const slots = createFirstRoundSlots(participants(30), 8);
    expect(slots).toHaveLength(8);
    expect(slots.every((slot) => slot.type === "group")).toBe(true);
    expect(slots.map((slot) => slot.participantIds.length)).toEqual([4, 4, 4, 4, 4, 4, 3, 3]);
  });

  it("creates battles and byes for 13 participants into 8 slots", () => {
    const slots = createFirstRoundSlots(participants(13), 8);
    expect(slots).toHaveLength(8);
    expect(slots.filter((slot) => slot.type === "battle")).toHaveLength(5);
    expect(slots.filter((slot) => slot.type === "bye")).toHaveLength(3);
  });

  it("rejects a slot count greater than participant count", () => {
    expect(() => createFirstRoundSlots(participants(13), 16)).toThrow("Advancement slot count cannot exceed participant count.");
  });
});
```

- [ ] **Step 2: Write music file tests**

Write `tests/music-file.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getMusicFileStatus, musicPurposeLabel } from "@/lib/music-file";
import type { MusicFile } from "@/lib/types";

const file: MusicFile = {
  id: "file-1",
  participantId: "p-1",
  sourceType: "link",
  fileUrl: "https://example.com/a.mp3",
  storagePath: null,
  title: "a.mp3",
  purpose: "round1",
  memo: "",
  uploadedAt: "2026-07-12T09:00:00.000Z",
  updatedAt: "2026-07-12T09:10:00.000Z",
  soundCheckedAt: null
};

describe("musicPurposeLabel", () => {
  it("returns the four labels", () => {
    expect(musicPurposeLabel("entrance")).toBe("입장곡");
    expect(musicPurposeLabel("round1")).toBe("1차 MR");
    expect(musicPurposeLabel("round2")).toBe("2차 MR");
    expect(musicPurposeLabel("etc")).toBe("기타");
  });
});

describe("getMusicFileStatus", () => {
  it("returns unchecked when never checked", () => {
    expect(getMusicFileStatus(file)).toBe("unchecked");
  });

  it("returns newlyUpdated when file was updated after check", () => {
    expect(getMusicFileStatus({ ...file, soundCheckedAt: "2026-07-12T09:05:00.000Z" })).toBe("newlyUpdated");
  });

  it("returns checked when check is newer than update", () => {
    expect(getMusicFileStatus({ ...file, soundCheckedAt: "2026-07-12T09:15:00.000Z" })).toBe("checked");
  });
});
```

- [ ] **Step 3: Write vote result tests**

Write `tests/vote.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateVoteResults } from "@/lib/vote";

describe("calculateVoteResults", () => {
  it("counts votes and marks the winner", () => {
    expect(
      calculateVoteResults(["p1", "p2"], [
        { participantId: "p1" },
        { participantId: "p1" },
        { participantId: "p2" }
      ])
    ).toEqual([
      { participantId: "p1", count: 2, isTiedWinner: false, isWinner: true },
      { participantId: "p2", count: 1, isTiedWinner: false, isWinner: false }
    ]);
  });

  it("marks ties without auto resolving", () => {
    expect(
      calculateVoteResults(["p1", "p2"], [{ participantId: "p1" }, { participantId: "p2" }])
    ).toEqual([
      { participantId: "p1", count: 1, isTiedWinner: true, isWinner: false },
      { participantId: "p2", count: 1, isTiedWinner: true, isWinner: false }
    ]);
  });
});
```

- [ ] **Step 4: Run tests to verify failure**

Run: `npm run test -- tests/assignment.test.ts tests/music-file.test.ts tests/vote.test.ts`

Expected: FAIL because helper modules do not exist.

- [ ] **Step 5: Implement shared types**

Write `src/lib/types.ts`:

```ts
export type EntranceCode = {
  id: string;
  code: string;
  usedAt: string | null;
  participantId: string | null;
  createdAt: string;
};

export type ParticipantStatus = "applied" | "confirmed" | "absent";

export type Participant = {
  id: string;
  entranceCodeId: string;
  artistName: string;
  autotuneRequired: boolean;
  note: string;
  order: number;
  status: ParticipantStatus;
  createdAt: string;
  updatedAt: string;
};

export type MusicPurpose = "entrance" | "round1" | "round2" | "etc";
export type MusicSourceType = "upload" | "link";
export type MusicFileStatus = "unchecked" | "newlyUpdated" | "checked";

export type MusicFile = {
  id: string;
  participantId: string;
  sourceType: MusicSourceType;
  fileUrl: string;
  storagePath: string | null;
  title: string;
  purpose: MusicPurpose;
  memo: string;
  uploadedAt: string;
  updatedAt: string;
  soundCheckedAt: string | null;
};

export type AdvancementSlotCount = 2 | 4 | 8 | 16;
export type RoundSlotType = "group" | "battle" | "bye";

export type DraftRoundSlot = {
  name: string;
  type: RoundSlotType;
  order: number;
  participantIds: string[];
};

export type EventPhase = "setup" | "entrance" | "round1" | "voting" | "round2" | "final" | "winner";
```

- [ ] **Step 6: Implement assignment helper**

Write `src/lib/assignment.ts`:

```ts
import type { AdvancementSlotCount, DraftRoundSlot, Participant } from "./types";

const SLOT_COUNTS: AdvancementSlotCount[] = [2, 4, 8, 16];
const GROUP_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];

export function getAvailableAdvancementSlots(confirmedParticipantCount: number): AdvancementSlotCount[] {
  return SLOT_COUNTS.filter((slotCount) => slotCount <= confirmedParticipantCount);
}

export function createFirstRoundSlots(participants: Participant[], advancementSlotCount: AdvancementSlotCount): DraftRoundSlot[] {
  const confirmed = participants
    .filter((participant) => participant.status === "confirmed")
    .sort((a, b) => a.order - b.order);

  if (confirmed.length < 2) {
    throw new Error("At least two confirmed participants are required.");
  }

  if (advancementSlotCount > confirmed.length) {
    throw new Error("Advancement slot count cannot exceed participant count.");
  }

  if (confirmed.length >= advancementSlotCount * 2) {
    return createGroupSlots(confirmed, advancementSlotCount);
  }

  return createBattleAndByeSlots(confirmed, advancementSlotCount);
}

function createGroupSlots(participants: Participant[], slotCount: AdvancementSlotCount): DraftRoundSlot[] {
  const slots: DraftRoundSlot[] = Array.from({ length: slotCount }, (_, index) => ({
    name: `${GROUP_NAMES[index]}조`,
    type: "group",
    order: index + 1,
    participantIds: []
  }));

  participants.forEach((participant, index) => {
    slots[index % slotCount].participantIds.push(participant.id);
  });

  return slots;
}

function createBattleAndByeSlots(participants: Participant[], slotCount: AdvancementSlotCount): DraftRoundSlot[] {
  const byesNeeded = slotCount * 2 - participants.length;
  const battleParticipantCount = participants.length - byesNeeded;
  const battleParticipants = participants.slice(0, battleParticipantCount);
  const byeParticipants = participants.slice(battleParticipantCount);
  const slots: DraftRoundSlot[] = [];

  for (let index = 0; index < battleParticipants.length; index += 2) {
    slots.push({
      name: `${slots.length + 1}경기`,
      type: "battle",
      order: slots.length + 1,
      participantIds: [battleParticipants[index].id, battleParticipants[index + 1].id]
    });
  }

  byeParticipants.forEach((participant) => {
    slots.push({
      name: `부전승 ${slots.length + 1}`,
      type: "bye",
      order: slots.length + 1,
      participantIds: [participant.id]
    });
  });

  return slots;
}
```

- [ ] **Step 7: Implement music and vote helpers**

Write `src/lib/music-file.ts`:

```ts
import type { MusicFile, MusicFileStatus, MusicPurpose } from "./types";

export function musicPurposeLabel(purpose: MusicPurpose): string {
  return {
    entrance: "입장곡",
    round1: "1차 MR",
    round2: "2차 MR",
    etc: "기타"
  }[purpose];
}

export function getMusicFileStatus(file: MusicFile): MusicFileStatus {
  if (!file.soundCheckedAt) return "unchecked";
  return new Date(file.updatedAt).getTime() > new Date(file.soundCheckedAt).getTime() ? "newlyUpdated" : "checked";
}

export function musicFileStatusLabel(status: MusicFileStatus): string {
  return {
    unchecked: "미확인",
    newlyUpdated: "새로 수정됨",
    checked: "확인 완료"
  }[status];
}
```

Write `src/lib/vote.ts`:

```ts
export type VoteLike = {
  participantId: string;
};

export type VoteResult = {
  participantId: string;
  count: number;
  isTiedWinner: boolean;
  isWinner: boolean;
};

export function calculateVoteResults(candidateIds: string[], votes: VoteLike[]): VoteResult[] {
  const counts = new Map(candidateIds.map((id) => [id, 0]));

  for (const vote of votes) {
    counts.set(vote.participantId, (counts.get(vote.participantId) ?? 0) + 1);
  }

  const max = Math.max(...candidateIds.map((id) => counts.get(id) ?? 0));
  const winners = candidateIds.filter((id) => (counts.get(id) ?? 0) === max);
  const hasTie = winners.length > 1;

  return candidateIds.map((participantId) => ({
    participantId,
    count: counts.get(participantId) ?? 0,
    isTiedWinner: hasTie && winners.includes(participantId),
    isWinner: !hasTie && winners[0] === participantId
  }));
}
```

- [ ] **Step 8: Run tests**

Run: `npm run test -- tests/assignment.test.ts tests/music-file.test.ts tests/vote.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/types.ts src/lib/assignment.ts src/lib/music-file.ts src/lib/vote.ts tests/assignment.test.ts tests/music-file.test.ts tests/vote.test.ts
git commit -m "feat: add event domain helpers"
```

---

### Task 3: Add Supabase Schema and Clients

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Create database schema**

Write `supabase/schema.sql`:

```sql
create extension if not exists "pgcrypto";

create type participant_status as enum ('applied', 'confirmed', 'absent');
create type music_purpose as enum ('entrance', 'round1', 'round2', 'etc');
create type music_source_type as enum ('upload', 'link');
create type round_slot_type as enum ('group', 'battle', 'bye');
create type event_phase as enum ('setup', 'entrance', 'round1', 'voting', 'round2', 'final', 'winner');

create table entrance_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  entrance_code_id uuid not null unique references entrance_codes(id) on delete cascade,
  artist_name text not null,
  autotune_required boolean not null default false,
  note text not null default '',
  display_order integer not null default 0,
  status participant_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table entrance_codes
  add column participant_id uuid unique references participants(id) on delete set null;

create table music_files (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  source_type music_source_type not null,
  file_url text not null,
  storage_path text,
  title text not null,
  purpose music_purpose not null,
  memo text not null default '',
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sound_checked_at timestamptz
);

create table round_slots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type round_slot_type not null,
  display_order integer not null,
  winner_participant_id uuid references participants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table round_slot_participants (
  round_slot_id uuid not null references round_slots(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  display_order integer not null default 0,
  primary key (round_slot_id, participant_id)
);

create table vote_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  linked_round_slot_id uuid references round_slots(id) on delete set null,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  closed_at timestamptz
);

create table vote_session_candidates (
  vote_session_id uuid not null references vote_sessions(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  display_order integer not null default 0,
  primary key (vote_session_id, participant_id)
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  vote_session_id uuid not null references vote_sessions(id) on delete cascade,
  entrance_code_id uuid not null references entrance_codes(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (vote_session_id, entrance_code_id)
);

create table prediction_lottos (
  id uuid primary key default gen_random_uuid(),
  entrance_code_id uuid not null unique references entrance_codes(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table event_state (
  id boolean primary key default true,
  phase event_phase not null default 'setup',
  current_round_slot_id uuid references round_slots(id) on delete set null,
  current_participant_id uuid references participants(id) on delete set null,
  next_round_slot_id uuid references round_slots(id) on delete set null,
  next_participant_id uuid references participants(id) on delete set null,
  open_vote_session_id uuid references vote_sessions(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint event_state_singleton check (id)
);

insert into event_state (id) values (true) on conflict (id) do nothing;

create unique index one_open_vote_session_idx on vote_sessions (is_open) where is_open = true;
create index participants_order_idx on participants (display_order);
create index music_files_participant_idx on music_files (participant_id, purpose);
create index round_slots_order_idx on round_slots (display_order);
create index votes_session_idx on votes (vote_session_id);

alter table entrance_codes enable row level security;
alter table participants enable row level security;
alter table music_files enable row level security;
alter table round_slots enable row level security;
alter table round_slot_participants enable row level security;
alter table vote_sessions enable row level security;
alter table vote_session_candidates enable row level security;
alter table votes enable row level security;
alter table prediction_lottos enable row level security;
alter table event_state enable row level security;

-- MVP server actions use the service role key.
-- Storage: create a private bucket named "music-files".
```

- [ ] **Step 2: Create environment helpers**

Write `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SOUND_PASSWORD: z.string().default("sound"),
  HOST_PASSWORD: z.string().default("host"),
  ADMIN_PASSWORD: z.string().default("admin")
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SOUND_PASSWORD: process.env.SOUND_PASSWORD,
  HOST_PASSWORD: process.env.HOST_PASSWORD,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
});
```

- [ ] **Step 3: Create Supabase clients**

Write `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

Write `src/lib/supabase/server.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server mutations.");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
```

- [ ] **Step 4: Verify build with env**

Create `.env.local` locally, not committed:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=example-anon-key
SUPABASE_SERVICE_ROLE_KEY=example-service-role-key
SOUND_PASSWORD=sound
HOST_PASSWORD=host
ADMIN_PASSWORD=admin
```

Run: `npm run build`

Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql src/lib/env.ts src/lib/supabase
git commit -m "feat: add supabase schema"
```

---

### Task 4: Implement Entrance Code Identity

**Files:**
- Create: `src/lib/access.ts`
- Create: `src/app/actions/entrance.ts`
- Create: `src/components/EntranceGate.tsx`
- Create: `src/app/audience/page.tsx`
- Test: `tests/access.test.ts`

- [ ] **Step 1: Write access helper tests**

Write `tests/access.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeEntranceCode, verifyRolePassword } from "@/lib/access";

describe("normalizeEntranceCode", () => {
  it("uppercases and removes spaces", () => {
    expect(normalizeEntranceCode(" ab 12 ")).toBe("AB12");
  });
});

describe("verifyRolePassword", () => {
  it("accepts exact role password", () => {
    expect(verifyRolePassword("sound", "sound")).toBe(true);
  });

  it("rejects empty input", () => {
    expect(verifyRolePassword("sound", "")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- tests/access.test.ts`

Expected: FAIL because `src/lib/access.ts` does not exist.

- [ ] **Step 3: Implement access helpers**

Write `src/lib/access.ts`:

```ts
export type StaffRole = "sound" | "host" | "admin";

export function normalizeEntranceCode(code: string): string {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

export function verifyRolePassword(expectedPassword: string, submittedPassword: string): boolean {
  return submittedPassword.length > 0 && submittedPassword === expectedPassword;
}
```

- [ ] **Step 4: Implement entrance action**

Write `src/app/actions/entrance.ts`:

```ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeEntranceCode } from "@/lib/access";
import { createServiceClient } from "@/lib/supabase/server";

export const ENTRANCE_COOKIE = "ikpe-entrance-code-id";

export async function enterWithCode(formData: FormData) {
  const code = normalizeEntranceCode(String(formData.get("code") ?? ""));
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("entrance_codes")
    .select("id, used_at")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    redirect("/audience?error=invalid-code");
  }

  if (!data.used_at) {
    await supabase.from("entrance_codes").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  }

  cookies().set(ENTRANCE_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24
  });

  redirect("/audience");
}

export function getEntranceCodeIdFromCookie() {
  return cookies().get(ENTRANCE_COOKIE)?.value ?? null;
}
```

- [ ] **Step 5: Implement entrance gate**

Write `src/components/EntranceGate.tsx`:

```tsx
import { enterWithCode } from "@/app/actions/entrance";

export function EntranceGate({ error }: { error?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
      <form action={enterWithCode} className="w-full max-w-sm rounded-lg border-2 border-ink bg-white p-5">
        <h1 className="text-3xl font-black">입장 코드</h1>
        <p className="mt-2 text-sm font-bold">입구에서 받은 코드를 입력하세요.</p>
        <input className="mt-5 w-full rounded-md border-2 border-ink p-4 text-xl font-black uppercase" name="code" autoComplete="one-time-code" required />
        {error === "invalid-code" ? <p className="mt-3 font-bold text-danger">없는 코드입니다.</p> : null}
        <button className="mt-5 w-full rounded-md bg-ink p-4 font-black text-white" type="submit">
          들어가기
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Implement audience page shell**

Write `src/app/audience/page.tsx`:

```tsx
import Link from "next/link";
import { getEntranceCodeIdFromCookie } from "@/app/actions/entrance";
import { EntranceGate } from "@/components/EntranceGate";

export const dynamic = "force-dynamic";

export default async function AudiencePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const entranceCodeId = getEntranceCodeIdFromCookie();
  const params = await searchParams;

  if (!entranceCodeId) {
    return <EntranceGate error={params.error} />;
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink">
      <section className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">익페 랩월드컵</h1>
        <div className="mt-6 grid gap-3">
          <Link className="rounded-lg border-2 border-ink bg-white p-5 font-black hover:bg-acid" href="/audience#vote">
            지금 투표
          </Link>
          <Link className="rounded-lg border-2 border-ink bg-white p-5 font-black hover:bg-acid" href="/audience#lotto">
            우승자 예측
          </Link>
          <Link className="rounded-lg border-2 border-ink bg-white p-5 font-black hover:bg-acid" href="/participant">
            나는 참가자예요
          </Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Run tests and build**

Run: `npm run test -- tests/access.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/access.ts src/app/actions/entrance.ts src/components/EntranceGate.tsx src/app/audience tests/access.test.ts
git commit -m "feat: add entrance code identity"
```

---

### Task 5: Implement Participant Profile and Music Submission

**Files:**
- Create: `src/app/actions/participants.ts`
- Create: `src/app/participant/page.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/MusicFileRow.tsx`

- [ ] **Step 1: Implement participant server actions**

Write `src/app/actions/participants.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getEntranceCodeIdFromCookie } from "@/app/actions/entrance";
import { createServiceClient } from "@/lib/supabase/server";

const participantSchema = z.object({
  artistName: z.string().min(1),
  autotuneRequired: z.boolean(),
  note: z.string().default("")
});

const musicFileSchema = z.object({
  participantId: z.string().uuid(),
  sourceType: z.enum(["upload", "link"]),
  fileUrl: z.string().url(),
  storagePath: z.string().optional(),
  title: z.string().min(1),
  purpose: z.enum(["entrance", "round1", "round2", "etc"]),
  memo: z.string().default("")
});

export async function createParticipantProfile(formData: FormData) {
  const entranceCodeId = getEntranceCodeIdFromCookie();
  if (!entranceCodeId) redirect("/audience");

  const parsed = participantSchema.parse({
    artistName: String(formData.get("artistName") ?? ""),
    autotuneRequired: formData.get("autotuneRequired") === "on",
    note: String(formData.get("note") ?? "")
  });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("participants")
    .insert({
      entrance_code_id: entranceCodeId,
      artist_name: parsed.artistName,
      autotune_required: parsed.autotuneRequired,
      note: parsed.note,
      status: "confirmed"
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("entrance_codes").update({ participant_id: data.id }).eq("id", entranceCodeId);

  revalidatePath("/participant");
  redirect("/participant");
}

export async function addMusicFile(formData: FormData) {
  const parsed = musicFileSchema.parse({
    participantId: String(formData.get("participantId") ?? ""),
    sourceType: String(formData.get("sourceType") ?? "link"),
    fileUrl: String(formData.get("fileUrl") ?? ""),
    storagePath: String(formData.get("storagePath") ?? "") || undefined,
    title: String(formData.get("title") ?? ""),
    purpose: String(formData.get("purpose") ?? "etc"),
    memo: String(formData.get("memo") ?? "")
  });

  const supabase = createServiceClient();
  const { error } = await supabase.from("music_files").insert({
    participant_id: parsed.participantId,
    source_type: parsed.sourceType,
    file_url: parsed.fileUrl,
    storage_path: parsed.storagePath ?? null,
    title: parsed.title,
    purpose: parsed.purpose,
    memo: parsed.memo
  });

  if (error) throw new Error(error.message);
  revalidatePath("/participant");
  revalidatePath("/sound");
}

export async function uploadMusicFile(formData: FormData) {
  const participantId = String(formData.get("participantId") ?? "");
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "");
  const purpose = String(formData.get("purpose") ?? "etc");
  const memo = String(formData.get("memo") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("파일을 선택하세요.");
  }

  const parsed = musicFileSchema.parse({
    participantId,
    sourceType: "upload",
    fileUrl: "https://placeholder.local",
    title: title || file.name,
    purpose,
    memo
  });

  const supabase = createServiceClient();
  const storagePath = `${parsed.participantId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("music-files").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: signed, error: signedError } = await supabase.storage.from("music-files").createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  if (signedError) throw new Error(signedError.message);

  const { error } = await supabase.from("music_files").insert({
    participant_id: parsed.participantId,
    source_type: "upload",
    file_url: signed.signedUrl,
    storage_path: storagePath,
    title: parsed.title,
    purpose: parsed.purpose,
    memo: parsed.memo
  });

  if (error) throw new Error(error.message);
  revalidatePath("/participant");
  revalidatePath("/sound");
}
```

- [ ] **Step 2: Implement reusable status badge and music row**

Write `src/components/StatusBadge.tsx`:

```tsx
import { musicFileStatusLabel } from "@/lib/music-file";
import type { MusicFileStatus } from "@/lib/types";

const styles: Record<MusicFileStatus, string> = {
  unchecked: "border-ink bg-white text-ink",
  newlyUpdated: "border-warning bg-warning text-ink",
  checked: "border-ok bg-ok text-white"
};

export function StatusBadge({ status }: { status: MusicFileStatus }) {
  return <span className={`rounded-full border-2 px-2.5 py-1 text-xs font-black ${styles[status]}`}>{musicFileStatusLabel(status)}</span>;
}
```

Write `src/components/MusicFileRow.tsx`:

```tsx
import { Download, ExternalLink } from "lucide-react";
import { getMusicFileStatus, musicPurposeLabel } from "@/lib/music-file";
import type { MusicFile } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function MusicFileRow({ file, action }: { file: MusicFile; action?: React.ReactNode }) {
  const status = getMusicFileStatus(file);

  return (
    <div className="rounded-md border-2 border-ink bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-black text-white">{musicPurposeLabel(file.purpose)}</span>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 break-all text-lg font-black">{file.title}</p>
      <p className="mt-1 text-xs font-bold">마지막 수정: {new Date(file.updatedAt).toLocaleString("ko-KR")}</p>
      {file.memo ? <p className="mt-2 rounded-md bg-paper p-2 text-sm">{file.memo}</p> : null}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <a className="flex items-center justify-center gap-1 rounded-md border-2 border-ink py-2 font-black" href={file.fileUrl} target="_blank">
          <ExternalLink size={16} /> 열기
        </a>
        <a className="flex items-center justify-center gap-1 rounded-md border-2 border-ink py-2 font-black" href={file.fileUrl} download>
          <Download size={16} /> 다운
        </a>
        {action}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement participant page**

Write `src/app/participant/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { addMusicFile, createParticipantProfile, uploadMusicFile } from "@/app/actions/participants";
import { getEntranceCodeIdFromCookie } from "@/app/actions/entrance";
import { MusicFileRow } from "@/components/MusicFileRow";
import { createServiceClient } from "@/lib/supabase/server";
import type { MusicFile } from "@/lib/types";

export const dynamic = "force-dynamic";

function mapFile(row: any): MusicFile {
  return {
    id: row.id,
    participantId: row.participant_id,
    sourceType: row.source_type,
    fileUrl: row.file_url,
    storagePath: row.storage_path,
    title: row.title,
    purpose: row.purpose,
    memo: row.memo,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
    soundCheckedAt: row.sound_checked_at
  };
}

export default async function ParticipantPage() {
  const entranceCodeId = getEntranceCodeIdFromCookie();
  if (!entranceCodeId) redirect("/audience");

  const supabase = createServiceClient();
  const { data: participant } = await supabase.from("participants").select("*").eq("entrance_code_id", entranceCodeId).maybeSingle();

  if (!participant) {
    return (
      <main className="min-h-screen bg-paper px-5 py-6 text-ink">
        <form action={createParticipantProfile} className="mx-auto max-w-md rounded-lg border-2 border-ink bg-white p-5">
          <h1 className="text-3xl font-black">참가자 등록</h1>
          <input className="mt-5 w-full rounded-md border-2 border-ink p-3" name="artistName" placeholder="활동명" required />
          <textarea className="mt-3 w-full rounded-md border-2 border-ink p-3" name="note" placeholder="사운드/진행자 메모" />
          <label className="mt-3 flex items-center gap-2 font-bold">
            <input name="autotuneRequired" type="checkbox" /> 오토튠 마이크 사용
          </label>
          <button className="mt-5 w-full rounded-md bg-ink p-3 font-black text-white" type="submit">등록하기</button>
        </form>
      </main>
    );
  }

  const { data: fileRows } = await supabase.from("music_files").select("*").eq("participant_id", participant.id).order("updated_at", { ascending: false });
  const files = (fileRows ?? []).map(mapFile);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink">
      <section className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black">{participant.artist_name}</h1>
        <form action={uploadMusicFile} className="mt-5 rounded-lg border-2 border-ink bg-white p-4">
          <h2 className="text-2xl font-black">파일 업로드</h2>
          <input type="hidden" name="participantId" value={participant.id} />
          <input className="mt-4 w-full rounded-md border-2 border-ink p-3" name="title" placeholder="표시 이름" />
          <input className="mt-3 w-full rounded-md border-2 border-ink p-3" name="file" type="file" accept="audio/*" required />
          <select className="mt-3 w-full rounded-md border-2 border-ink p-3" name="purpose" defaultValue="etc">
            <option value="entrance">입장곡</option>
            <option value="round1">1차 MR</option>
            <option value="round2">2차 MR</option>
            <option value="etc">기타</option>
          </select>
          <textarea className="mt-3 w-full rounded-md border-2 border-ink p-3" name="memo" placeholder="메모" />
          <button className="mt-4 w-full rounded-md bg-ink p-3 font-black text-white" type="submit">업로드</button>
        </form>
        <form action={addMusicFile} className="mt-5 rounded-lg border-2 border-ink bg-white p-4">
          <h2 className="text-2xl font-black">링크 제출</h2>
          <input type="hidden" name="participantId" value={participant.id} />
          <input type="hidden" name="sourceType" value="link" />
          <input className="mt-4 w-full rounded-md border-2 border-ink p-3" name="title" placeholder="표시 이름" required />
          <input className="mt-3 w-full rounded-md border-2 border-ink p-3" name="fileUrl" placeholder="파일 링크" required />
          <select className="mt-3 w-full rounded-md border-2 border-ink p-3" name="purpose" defaultValue="etc">
            <option value="entrance">입장곡</option>
            <option value="round1">1차 MR</option>
            <option value="round2">2차 MR</option>
            <option value="etc">기타</option>
          </select>
          <textarea className="mt-3 w-full rounded-md border-2 border-ink p-3" name="memo" placeholder="메모" />
          <button className="mt-4 w-full rounded-md bg-ink p-3 font-black text-white" type="submit">추가</button>
        </form>
        <div className="mt-5 grid gap-3">{files.map((file) => <MusicFileRow key={file.id} file={file} />)}</div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/participants.ts src/app/participant src/components/StatusBadge.tsx src/components/MusicFileRow.tsx
git commit -m "feat: add participant music submission"
```

---

### Task 6: Implement Voting and Lotto

**Files:**
- Create: `src/app/actions/votes.ts`
- Modify: `src/app/audience/page.tsx`

- [ ] **Step 1: Implement vote actions**

Write `src/app/actions/votes.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getEntranceCodeIdFromCookie } from "@/app/actions/entrance";
import { createServiceClient } from "@/lib/supabase/server";

const voteSchema = z.object({
  voteSessionId: z.string().uuid(),
  participantId: z.string().uuid()
});

export async function submitVote(input: z.infer<typeof voteSchema>) {
  const entranceCodeId = getEntranceCodeIdFromCookie();
  if (!entranceCodeId) redirect("/audience");

  const parsed = voteSchema.parse(input);
  const supabase = createServiceClient();
  const { error } = await supabase.from("votes").insert({
    vote_session_id: parsed.voteSessionId,
    entrance_code_id: entranceCodeId,
    participant_id: parsed.participantId
  });

  if (error) throw new Error("이미 투표했거나 투표를 저장하지 못했습니다.");
  revalidatePath("/audience");
}

export async function submitPrediction(participantId: string) {
  const entranceCodeId = getEntranceCodeIdFromCookie();
  if (!entranceCodeId) redirect("/audience");

  const supabase = createServiceClient();
  const { error } = await supabase.from("prediction_lottos").insert({
    entrance_code_id: entranceCodeId,
    participant_id: participantId
  });

  if (error) throw new Error("이미 예측했거나 예측을 저장하지 못했습니다.");
  revalidatePath("/audience");
}
```

- [ ] **Step 2: Replace audience page with live vote and lotto UI**

Modify `src/app/audience/page.tsx`:

```tsx
import Link from "next/link";
import { getEntranceCodeIdFromCookie } from "@/app/actions/entrance";
import { submitPrediction, submitVote } from "@/app/actions/votes";
import { EntranceGate } from "@/components/EntranceGate";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AudiencePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const entranceCodeId = getEntranceCodeIdFromCookie();
  const params = await searchParams;

  if (!entranceCodeId) return <EntranceGate error={params.error} />;

  const supabase = createServiceClient();
  const [{ data: openVote }, { data: participants }, { data: participantProfile }, { data: lotto }] = await Promise.all([
    supabase
      .from("vote_sessions")
      .select("id, title, vote_session_candidates(participants(id, artist_name))")
      .eq("is_open", true)
      .maybeSingle(),
    supabase.from("participants").select("id, artist_name").eq("status", "confirmed").order("display_order"),
    supabase.from("participants").select("id").eq("entrance_code_id", entranceCodeId).maybeSingle(),
    supabase.from("prediction_lottos").select("id").eq("entrance_code_id", entranceCodeId).maybeSingle()
  ]);

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink">
      <section className="mx-auto max-w-md">
        <h1 className="text-3xl font-black">익페 랩월드컵</h1>
        <section id="vote" className="mt-6 rounded-lg border-2 border-ink bg-white p-4">
          <h2 className="text-2xl font-black">지금 투표</h2>
          {!openVote ? <p className="mt-3 font-bold">열린 투표가 없습니다.</p> : null}
          {openVote ? (
            <div className="mt-3 grid gap-2">
              <p className="font-bold">{openVote.title}</p>
              {(openVote.vote_session_candidates ?? []).map((candidate: any) => (
                <form key={candidate.participants.id} action={submitVote.bind(null, { voteSessionId: openVote.id, participantId: candidate.participants.id })}>
                  <button className="w-full rounded-md border-2 border-ink p-4 text-left text-xl font-black hover:bg-acid" type="submit">
                    {candidate.participants.artist_name}
                  </button>
                </form>
              ))}
            </div>
          ) : null}
        </section>
        <section id="lotto" className="mt-4 rounded-lg border-2 border-ink bg-white p-4">
          <h2 className="text-2xl font-black">우승자 예측</h2>
          {lotto ? <p className="mt-3 font-bold text-ok">예측 제출 완료</p> : null}
          {!lotto ? (
            <div className="mt-3 grid gap-2">
              {(participants ?? []).map((participant) => (
                <form key={participant.id} action={submitPrediction.bind(null, participant.id)}>
                  <button className="w-full rounded-md border-2 border-ink p-3 text-left font-black hover:bg-acid" type="submit">
                    {participant.artist_name}
                  </button>
                </form>
              ))}
            </div>
          ) : null}
        </section>
        <Link className="mt-4 block rounded-lg border-2 border-ink bg-white p-4 font-black hover:bg-acid" href="/participant">
          {participantProfile ? "내 참가자 페이지" : "나는 참가자예요"}
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/votes.ts src/app/audience/page.tsx
git commit -m "feat: add audience voting and lotto"
```

---

### Task 7: Implement Admin Controls

**Files:**
- Create: `src/components/RoleGate.tsx`
- Create: `src/app/actions/admin.ts`
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Implement role gate**

Write `src/components/RoleGate.tsx`:

```tsx
"use client";

import { useState } from "react";
import { verifyRolePassword } from "@/lib/access";

export function RoleGate({ title, password, children }: { title: string; password: string; children: React.ReactNode }) {
  const [input, setInput] = useState("");
  const [allowed, setAllowed] = useState(false);

  if (allowed) return <>{children}</>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
      <form
        className="w-full max-w-sm rounded-lg border-2 border-ink bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (verifyRolePassword(password, input)) setAllowed(true);
        }}
      >
        <h1 className="text-3xl font-black">{title}</h1>
        <input className="mt-5 w-full rounded-md border-2 border-ink p-4" type="password" value={input} onChange={(event) => setInput(event.target.value)} />
        <button className="mt-5 w-full rounded-md bg-ink p-4 font-black text-white" type="submit">들어가기</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Implement admin actions**

Write `src/app/actions/admin.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createFirstRoundSlots } from "@/lib/assignment";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdvancementSlotCount, Participant } from "@/lib/types";

export async function generateEntranceCodes(count: number) {
  const parsed = z.number().int().min(1).max(300).parse(count);
  const rows = Array.from({ length: parsed }, () => ({ code: Math.random().toString(36).slice(2, 6).toUpperCase() }));
  const supabase = createServiceClient();
  const { error } = await supabase.from("entrance_codes").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createFirstRoundAssignment(slotCount: AdvancementSlotCount) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("participants").select("*").eq("status", "confirmed").order("display_order");
  if (error) throw new Error(error.message);

  const participants: Participant[] = (data ?? []).map((row) => ({
    id: row.id,
    entranceCodeId: row.entrance_code_id,
    artistName: row.artist_name,
    autotuneRequired: row.autotune_required,
    note: row.note,
    order: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));

  const slots = createFirstRoundSlots(participants, slotCount);

  await supabase.from("round_slot_participants").delete().neq("round_slot_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("round_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (const slot of slots) {
    const { data: created, error: slotError } = await supabase
      .from("round_slots")
      .insert({ name: slot.name, type: slot.type, display_order: slot.order })
      .select("id")
      .single();
    if (slotError) throw new Error(slotError.message);

    const participantRows = slot.participantIds.map((participantId, index) => ({
      round_slot_id: created.id,
      participant_id: participantId,
      display_order: index + 1
    }));
    const { error: joinError } = await supabase.from("round_slot_participants").insert(participantRows);
    if (joinError) throw new Error(joinError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sound");
  revalidatePath("/host");
}

export async function openVoteSession(voteSessionId: string) {
  const supabase = createServiceClient();
  const { data: openSession } = await supabase.from("vote_sessions").select("id").eq("is_open", true).maybeSingle();
  if (openSession) throw new Error("먼저 열린 투표를 닫아야 합니다.");
  const { error } = await supabase.from("vote_sessions").update({ is_open: true, opened_at: new Date().toISOString() }).eq("id", voteSessionId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/audience");
}

export async function closeVoteSession(voteSessionId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("vote_sessions").update({ is_open: false, closed_at: new Date().toISOString() }).eq("id", voteSessionId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/audience");
}
```

- [ ] **Step 3: Implement admin page**

Write `src/app/admin/page.tsx`:

```tsx
import { generateEntranceCodes, createFirstRoundAssignment } from "@/app/actions/admin";
import { RoleGate } from "@/components/RoleGate";
import { env } from "@/lib/env";
import { getAvailableAdvancementSlots } from "@/lib/assignment";
import { createServiceClient } from "@/lib/supabase/server";
import type { AdvancementSlotCount } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServiceClient();
  const [{ data: codes }, { data: participants }, { data: slots }, { data: voteSessions }] = await Promise.all([
    supabase.from("entrance_codes").select("*").order("created_at"),
    supabase.from("participants").select("*").order("display_order"),
    supabase.from("round_slots").select("*, round_slot_participants(participants(artist_name))").order("display_order"),
    supabase.from("vote_sessions").select("*").order("created_at", { ascending: false })
  ]);

  const confirmedCount = (participants ?? []).filter((participant) => participant.status === "confirmed").length;
  const availableSlots = getAvailableAdvancementSlots(confirmedCount);

  return (
    <RoleGate title="운영자" password={env.ADMIN_PASSWORD}>
      <main className="min-h-screen bg-paper px-5 py-6 text-ink">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-black">운영자</h1>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <form action={async () => { "use server"; await generateEntranceCodes(50); }} className="rounded-lg border-2 border-ink bg-white p-4">
              <h2 className="text-2xl font-black">입장 코드</h2>
              <p className="mt-2 font-bold">총 {codes?.length ?? 0}개 / 사용 {(codes ?? []).filter((code) => code.used_at).length}개</p>
              <button className="mt-4 rounded-md bg-ink px-4 py-3 font-black text-white" type="submit">50개 생성</button>
            </form>
            <section className="rounded-lg border-2 border-ink bg-white p-4">
              <h2 className="text-2xl font-black">1차 자동 편성</h2>
              <p className="mt-2 font-bold">확정 참가자 {confirmedCount}명</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {([2, 4, 8, 16] as AdvancementSlotCount[]).map((slotCount) => (
                  <form key={slotCount} action={createFirstRoundAssignment.bind(null, slotCount)}>
                    <button disabled={!availableSlots.includes(slotCount)} className="rounded-md border-2 border-ink px-4 py-2 font-black disabled:opacity-30" type="submit">
                      {slotCount}슬롯
                    </button>
                  </form>
                ))}
              </div>
            </section>
          </div>
          <h2 className="mt-8 text-2xl font-black">참가자</h2>
          <div className="mt-3 grid gap-2">
            {(participants ?? []).map((participant) => (
              <div key={participant.id} className="rounded-md border-2 border-ink bg-white p-3 font-black">
                {participant.display_order}. {participant.artist_name} / {participant.status}
              </div>
            ))}
          </div>
          <h2 className="mt-8 text-2xl font-black">1차 슬롯</h2>
          <div className="mt-3 grid gap-2">
            {(slots ?? []).map((slot) => (
              <div key={slot.id} className="rounded-md border-2 border-ink bg-white p-3">
                <p className="font-black">{slot.display_order}. {slot.name} / {slot.type}</p>
              </div>
            ))}
          </div>
          <h2 className="mt-8 text-2xl font-black">투표 세션</h2>
          <div className="mt-3 grid gap-2">
            {(voteSessions ?? []).map((session) => (
              <div key={session.id} className="rounded-md border-2 border-ink bg-white p-3 font-black">
                {session.title} / {session.is_open ? "열림" : "닫힘"}
              </div>
            ))}
          </div>
        </section>
      </main>
    </RoleGate>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/RoleGate.tsx src/app/actions/admin.ts src/app/admin
git commit -m "feat: add admin controls"
```

---

### Task 8: Complete Admin Vote and Event Controls

**Files:**
- Modify: `src/app/actions/admin.ts`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add vote session and event-state actions**

Append these functions to `src/app/actions/admin.ts`:

```ts
export async function createVoteSessionFromSlot(roundSlotId: string) {
  const supabase = createServiceClient();
  const { data: slot, error: slotError } = await supabase
    .from("round_slots")
    .select("id, name, round_slot_participants(participant_id, display_order)")
    .eq("id", roundSlotId)
    .single();
  if (slotError) throw new Error(slotError.message);

  const candidates = [...(slot.round_slot_participants ?? [])].sort((a: any, b: any) => a.display_order - b.display_order);
  if (candidates.length < 2) {
    throw new Error("후보가 2명 이상인 슬롯만 투표 세션을 만들 수 있습니다.");
  }

  const { data: session, error } = await supabase
    .from("vote_sessions")
    .insert({ title: `${slot.name} 투표`, linked_round_slot_id: roundSlotId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const candidateRows = candidates.map((candidate: any, index: number) => ({
    vote_session_id: session.id,
    participant_id: candidate.participant_id,
    display_order: index + 1
  }));
  const { error: candidateError } = await supabase.from("vote_session_candidates").insert(candidateRows);
  if (candidateError) throw new Error(candidateError.message);
  revalidatePath("/admin");
}

export async function createManualVoteSession(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const participantIds = formData.getAll("participantId").map(String).filter(Boolean);
  if (!title || participantIds.length < 2) {
    throw new Error("제목과 후보 2명 이상이 필요합니다.");
  }

  const supabase = createServiceClient();
  const { data: session, error } = await supabase.from("vote_sessions").insert({ title }).select("id").single();
  if (error) throw new Error(error.message);

  const rows = participantIds.map((participantId, index) => ({
    vote_session_id: session.id,
    participant_id: participantId,
    display_order: index + 1
  }));
  const { error: candidateError } = await supabase.from("vote_session_candidates").insert(rows);
  if (candidateError) throw new Error(candidateError.message);
  revalidatePath("/admin");
}

export async function setCurrentAndNext(formData: FormData) {
  const currentParticipantId = String(formData.get("currentParticipantId") ?? "") || null;
  const nextParticipantId = String(formData.get("nextParticipantId") ?? "") || null;
  const phase = String(formData.get("phase") ?? "setup");
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("event_state")
    .update({
      phase,
      current_participant_id: currentParticipantId,
      next_participant_id: nextParticipantId,
      updated_at: new Date().toISOString()
    })
    .eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/sound");
  revalidatePath("/host");
}
```

- [ ] **Step 2: Add admin imports**

Modify the import in `src/app/admin/page.tsx`:

```tsx
import {
  closeVoteSession,
  createFirstRoundAssignment,
  createManualVoteSession,
  createVoteSessionFromSlot,
  generateEntranceCodes,
  openVoteSession,
  setCurrentAndNext
} from "@/app/actions/admin";
```

- [ ] **Step 3: Fetch vote candidates and votes**

Modify the admin page data query:

```tsx
const [{ data: codes }, { data: participants }, { data: slots }, { data: voteSessions }, { data: state }] = await Promise.all([
  supabase.from("entrance_codes").select("*").order("created_at"),
  supabase.from("participants").select("*").order("display_order"),
  supabase.from("round_slots").select("*, round_slot_participants(participant_id, participants(artist_name))").order("display_order"),
  supabase.from("vote_sessions").select("*, vote_session_candidates(participant_id, participants(artist_name)), votes(participant_id)").order("created_at", { ascending: false }),
  supabase.from("event_state").select("*").single()
]);
```

- [ ] **Step 4: Add current/next controls, vote creation, open/close, and result display**

Inside the admin page main section, after the first-round slot section, add:

```tsx
<section className="mt-8 rounded-lg border-2 border-ink bg-white p-4">
  <h2 className="text-2xl font-black">현재 진행</h2>
  <form action={setCurrentAndNext} className="mt-3 grid gap-3 md:grid-cols-3">
    <select className="rounded-md border-2 border-ink p-3" name="phase" defaultValue={state?.phase ?? "setup"}>
      <option value="setup">setup</option>
      <option value="entrance">entrance</option>
      <option value="round1">round1</option>
      <option value="voting">voting</option>
      <option value="round2">round2</option>
      <option value="final">final</option>
      <option value="winner">winner</option>
    </select>
    <select className="rounded-md border-2 border-ink p-3" name="currentParticipantId" defaultValue={state?.current_participant_id ?? ""}>
      <option value="">현재 미지정</option>
      {(participants ?? []).map((participant) => <option key={participant.id} value={participant.id}>{participant.artist_name}</option>)}
    </select>
    <select className="rounded-md border-2 border-ink p-3" name="nextParticipantId" defaultValue={state?.next_participant_id ?? ""}>
      <option value="">다음 미지정</option>
      {(participants ?? []).map((participant) => <option key={participant.id} value={participant.id}>{participant.artist_name}</option>)}
    </select>
    <button className="rounded-md bg-ink p-3 font-black text-white md:col-span-3" type="submit">현재/다음 저장</button>
  </form>
</section>

<section className="mt-8 rounded-lg border-2 border-ink bg-white p-4">
  <h2 className="text-2xl font-black">수동 투표 세션</h2>
  <form action={createManualVoteSession} className="mt-3 grid gap-3">
    <input className="rounded-md border-2 border-ink p-3" name="title" placeholder="투표 제목" required />
    <div className="grid gap-2 sm:grid-cols-2">
      {(participants ?? []).map((participant) => (
        <label key={participant.id} className="rounded-md border-2 border-ink p-2 font-bold">
          <input className="mr-2" name="participantId" type="checkbox" value={participant.id} />
          {participant.artist_name}
        </label>
      ))}
    </div>
    <button className="rounded-md bg-ink p-3 font-black text-white" type="submit">투표 세션 생성</button>
  </form>
</section>
```

Replace the slot display block with a version that can create vote sessions:

```tsx
{(slots ?? []).map((slot) => (
  <div key={slot.id} className="rounded-md border-2 border-ink bg-white p-3">
    <p className="font-black">{slot.display_order}. {slot.name} / {slot.type}</p>
    <p className="mt-1 text-sm font-bold">
      {(slot.round_slot_participants ?? []).map((entry: any) => entry.participants?.artist_name).filter(Boolean).join(", ")}
    </p>
    {slot.type !== "bye" ? (
      <form action={createVoteSessionFromSlot.bind(null, slot.id)} className="mt-2">
        <button className="rounded-md border-2 border-ink px-3 py-2 font-black" type="submit">이 슬롯으로 투표 만들기</button>
      </form>
    ) : null}
  </div>
))}
```

Replace the vote session display block with:

```tsx
{(voteSessions ?? []).map((session) => {
  const counts = new Map<string, number>();
  (session.votes ?? []).forEach((vote: any) => counts.set(vote.participant_id, (counts.get(vote.participant_id) ?? 0) + 1));
  return (
    <div key={session.id} className="rounded-md border-2 border-ink bg-white p-3">
      <p className="font-black">{session.title} / {session.is_open ? "열림" : "닫힘"}</p>
      <div className="mt-2 grid gap-1 text-sm font-bold">
        {(session.vote_session_candidates ?? []).map((candidate: any) => (
          <p key={candidate.participant_id}>
            {candidate.participants?.artist_name}: {counts.get(candidate.participant_id) ?? 0}표
          </p>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {!session.is_open ? (
          <form action={openVoteSession.bind(null, session.id)}>
            <button className="rounded-md bg-ok px-3 py-2 font-black text-white" type="submit">열기</button>
          </form>
        ) : (
          <form action={closeVoteSession.bind(null, session.id)}>
            <button className="rounded-md bg-danger px-3 py-2 font-black text-white" type="submit">닫기</button>
          </form>
        )}
      </div>
    </div>
  );
})}
```

- [ ] **Step 5: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/admin.ts src/app/admin/page.tsx
git commit -m "feat: complete admin event controls"
```

---

### Task 9: Implement Sound and Host Views

**Files:**
- Create: `src/app/actions/sound.ts`
- Create: `src/components/ParticipantCard.tsx`
- Create: `src/app/sound/page.tsx`
- Create: `src/app/host/page.tsx`

- [ ] **Step 1: Implement sound action**

Write `src/app/actions/sound.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function markMusicFileChecked(musicFileId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("music_files")
    .update({ sound_checked_at: new Date().toISOString() })
    .eq("id", musicFileId);
  if (error) throw new Error(error.message);
  revalidatePath("/sound");
}
```

- [ ] **Step 2: Implement participant card**

Write `src/components/ParticipantCard.tsx`:

```tsx
import { Check } from "lucide-react";
import { markMusicFileChecked } from "@/app/actions/sound";
import { MusicFileRow } from "@/components/MusicFileRow";
import type { MusicFile, Participant } from "@/lib/types";

export function ParticipantCard({ participant, files, isCurrent, isNext }: { participant: Participant; files: MusicFile[]; isCurrent: boolean; isNext: boolean }) {
  return (
    <article className={`rounded-lg border-2 p-4 ${isCurrent ? "border-acid bg-acid" : "border-ink bg-paper"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black">{participant.order}. {participant.artistName}</h2>
        {isCurrent ? <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">지금</span> : null}
        {isNext ? <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black">다음</span> : null}
        {participant.autotuneRequired ? <span className="rounded-full bg-warning px-3 py-1 text-xs font-black">오토튠</span> : null}
      </div>
      {participant.note ? <p className="mt-2 rounded-md bg-white p-2 text-sm font-bold">{participant.note}</p> : null}
      <div className="mt-4 grid gap-3">
        {files.length === 0 ? <p className="rounded-md border-2 border-danger bg-white p-3 font-black text-danger">음악 파일 미제출</p> : null}
        {files.map((file) => (
          <MusicFileRow
            key={file.id}
            file={file}
            action={
              <form action={markMusicFileChecked.bind(null, file.id)}>
                <button className="flex w-full items-center justify-center gap-1 rounded-md bg-ink py-2 font-black text-white" type="submit">
                  <Check size={16} /> 확인
                </button>
              </form>
            }
          />
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Implement sound page**

Write `src/app/sound/page.tsx`:

```tsx
import { ParticipantCard } from "@/components/ParticipantCard";
import { RoleGate } from "@/components/RoleGate";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import type { MusicFile, Participant } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 5;

function participantFromRow(row: any): Participant {
  return {
    id: row.id,
    entranceCodeId: row.entrance_code_id,
    artistName: row.artist_name,
    autotuneRequired: row.autotune_required,
    note: row.note,
    order: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function fileFromRow(row: any): MusicFile {
  return {
    id: row.id,
    participantId: row.participant_id,
    sourceType: row.source_type,
    fileUrl: row.file_url,
    storagePath: row.storage_path,
    title: row.title,
    purpose: row.purpose,
    memo: row.memo,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
    soundCheckedAt: row.sound_checked_at
  };
}

export default async function SoundPage() {
  const supabase = createServiceClient();
  const [{ data: participantsRows }, { data: fileRows }, { data: state }] = await Promise.all([
    supabase.from("participants").select("*").order("display_order"),
    supabase.from("music_files").select("*").order("updated_at", { ascending: false }),
    supabase.from("event_state").select("*").single()
  ]);

  const participants = (participantsRows ?? []).map(participantFromRow);
  const files = (fileRows ?? []).map(fileFromRow);

  return (
    <RoleGate title="사운드" password={env.SOUND_PASSWORD}>
      <main className="min-h-screen bg-white px-4 py-5 text-ink">
        <header className="sticky top-0 z-10 -mx-4 border-b-2 border-ink bg-white px-4 py-4">
          <h1 className="text-3xl font-black">사운드 큐시트</h1>
          <p className="mt-1 text-sm font-bold">마지막 갱신: {new Date().toLocaleTimeString("ko-KR")}</p>
          <div className="mt-3 grid gap-2 rounded-lg border-2 border-ink bg-paper p-3 sm:grid-cols-2">
            <p className="font-black">지금: {participants.find((p) => p.id === state?.current_participant_id)?.artistName ?? "미지정"}</p>
            <p className="font-black">다음: {participants.find((p) => p.id === state?.next_participant_id)?.artistName ?? "미지정"}</p>
          </div>
        </header>
        <section className="mt-5 grid gap-4">
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              files={files.filter((file) => file.participantId === participant.id)}
              isCurrent={participant.id === state?.current_participant_id}
              isNext={participant.id === state?.next_participant_id}
            />
          ))}
        </section>
      </main>
    </RoleGate>
  );
}
```

- [ ] **Step 4: Implement host page**

Write `src/app/host/page.tsx`:

```tsx
import { RoleGate } from "@/components/RoleGate";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 5;

export default async function HostPage() {
  const supabase = createServiceClient();
  const [{ data: state }, { data: participants }, { data: openVote }] = await Promise.all([
    supabase.from("event_state").select("*").single(),
    supabase.from("participants").select("id, artist_name, note").order("display_order"),
    supabase.from("vote_sessions").select("id, title").eq("is_open", true).maybeSingle()
  ]);

  const current = participants?.find((participant) => participant.id === state?.current_participant_id);
  const next = participants?.find((participant) => participant.id === state?.next_participant_id);

  return (
    <RoleGate title="진행자" password={env.HOST_PASSWORD}>
      <main className="min-h-screen bg-ink px-5 py-6 text-white">
        <section className="mx-auto max-w-3xl">
          <p className="text-sm font-black text-acid">현재 단계: {state?.phase ?? "setup"}</p>
          <h1 className="mt-4 text-5xl font-black">{current?.artist_name ?? "현재 참가자 미지정"}</h1>
          {current?.note ? <p className="mt-4 rounded-lg bg-white p-4 text-xl font-bold text-ink">{current.note}</p> : null}
          <div className="mt-6 rounded-lg border-2 border-white p-4">
            <p className="text-sm font-bold">다음</p>
            <p className="text-3xl font-black">{next?.artist_name ?? "미지정"}</p>
          </div>
          <div className="mt-6 rounded-lg bg-acid p-4 text-ink">
            <p className="text-sm font-bold">투표</p>
            <p className="text-2xl font-black">{openVote ? `${openVote.title} 진행 중` : "열린 투표 없음"}</p>
          </div>
        </section>
      </main>
    </RoleGate>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/sound.ts src/components/ParticipantCard.tsx src/app/sound src/app/host
git commit -m "feat: add sound and host views"
```

---

### Task 10: Add E2E Smoke Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/audience.spec.ts`
- Create: `tests/e2e/role-gates.spec.ts`

- [ ] **Step 1: Add Playwright config**

Write `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
```

- [ ] **Step 2: Add smoke tests**

Write `tests/e2e/audience.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("audience page asks for entrance code", async ({ page }) => {
  await page.goto("/audience");
  await expect(page.getByRole("heading", { name: "입장 코드" })).toBeVisible();
});
```

Write `tests/e2e/role-gates.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("sound page is behind shared password gate", async ({ page }) => {
  await page.goto("/sound");
  await expect(page.getByRole("heading", { name: "사운드" })).toBeVisible();
});

test("admin page is behind shared password gate", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "운영자" })).toBeVisible();
});
```

- [ ] **Step 3: Run E2E**

Run: `npm run e2e`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test: add mvp smoke tests"
```

---

### Task 11: Final Verification and Cleanup

**Files:**
- Modify only files needed to fix verification failures.

- [ ] **Step 1: Run unit tests**

Run: `npm run test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: build passes.

- [ ] **Step 3: Run E2E tests**

Run: `npm run e2e`

Expected: smoke tests pass.

- [ ] **Step 4: Manual route check**

Run: `npm run dev`

Open:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/audience`
- `http://127.0.0.1:3000/participant`
- `http://127.0.0.1:3000/sound`
- `http://127.0.0.1:3000/host`
- `http://127.0.0.1:3000/admin`

Confirm:

- Audience page asks for entrance code when no entrance cookie exists.
- Participant page redirects to audience without entrance cookie.
- Sound, host, and admin pages show role password gates.
- Admin page disables advancement slots greater than confirmed participant count.
- Sound page has no search, group filter, or round filter UI.
- Music purposes are only entrance, round1, round2, etc.

- [ ] **Step 5: Commit verification fixes**

If any fixes were needed:

```bash
git add .
git commit -m "fix: polish mvp verification"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Online deployed app: Tasks 1 and 3 set up Next.js and Supabase.
- Entrance-code identity: Task 4.
- Participant profile attached to entrance code: Task 5.
- Participant and audience voting/lotto: Task 6.
- Direct upload plus link submission: Task 5.
- Music purposes limited to four values: Tasks 2, 3, and 5.
- First-round tournament-friendly slot assignment: Task 2 and Task 7.
- Admin minimal controls: Tasks 7 and 8.
- Manual vote session creation, slot-based vote session creation, open/close controls, current/next controls, and result display: Task 8.
- Sound cue sheet with all participants and file status: Task 9.
- Host page: Task 9.
- Polling every 5 seconds: Task 9 uses `revalidate = 5`.
- No automatic bracket: Tasks 7 and 8 create editable slots and vote sessions but no auto progression.

Known explicit follow-up after this plan:

- Add drag-and-drop editing for participant order and slot assignment.
- Add QR-code rendering/printing for audience entrance.
- Add a stage-facing winner reveal screen.
- Replace 7-day signed upload URLs with on-demand signed URL generation.
