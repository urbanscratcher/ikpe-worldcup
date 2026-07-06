# Ikpe Rap Worldcup MVP Design

## Goal

Build an online event-day web app for 익페 랩월드컵 that keeps voting, participant music links, sound cues, host progress, and minimal admin controls in one simple system.

The system should behave like a practical event remote, not a complex tournament platform. It must support uncertainty: the event may run as group showcases, 1:1 battles, byes, or manually created later-round votes depending on participant count and on-site decisions.

## Core Decisions

- The app is an online deployed web app.
- Shared event data and music links use a server database such as Supabase.
- Everyone in the audience flow enters with an entrance code.
- An entrance code represents one person.
- Audience members can vote and enter the winner prediction lotto.
- Participants can also vote and enter the winner prediction lotto with the same entrance code.
- Participant registration is an extra profile attached to an entrance code.
- Participant registration does not require phone number, separate participant password, or account login.
- Sound, host, and admin users access their role pages with role-specific shared passwords.
- The admin page provides minimal event controls, not a full production console.
- The system does not automatically manage a full bracket.
- The system does provide first-round auto assignment into tournament-friendly advancement slots.

## User Flows

### Audience and Participant Entry

All regular users start with the same entrance-code flow.

```txt
Enter entrance code
-> audience mode
-> vote / winner prediction
-> optional "I am a participant"
-> create participant profile
-> submit or update music links and cue notes
```

The entrance code remains the identity for voting. Creating a participant profile does not create a second voting identity.

### Participant Registration

After entering with an entrance code, a user can choose to register as a participant.

Participant registration captures:

- Artist name
- Autotune microphone needed or not
- Note for sound/host
- Music links and cue notes

One entrance code can have at most one participant profile. If a participant registers incorrectly, admin can edit or unlink the profile.

### Music Link Submission

Participants can submit multiple music link items. Direct audio file upload is out of scope for the event build.

Each music item has one purpose:

- Entrance song
- Round 1 MR
- Round 2 MR
- Etc

Multiple links with the same purpose are allowed. This keeps the system flexible for backup tracks, changed links, or last-minute cypher material without adding more categories.

### Audience Voting

Audience and participant voting uses the same flow.

- A user sees only the currently open vote session.
- A user selects one candidate.
- One entrance code can vote once per vote session.
- If no vote session is open, the page says there is no open vote.

### Winner Prediction Lotto

The lotto uses the entrance code identity.

- One entrance code can submit one winner prediction.
- Participants and non-participant audience members both can participate.

## First-Round Assignment

The first-round assignment feature creates an editable draft. It does not lock the event into a bracket.

Admin selects an advancement slot count:

- 2
- 4
- 8
- 16

The selected number means how many participants should advance after the first round.

The UI can show all four options, but it must disable options greater than the current confirmed participant count because the system cannot advance more people than exist. For example, with 13 confirmed participants, 16 is disabled and 8 is the highest tournament-friendly choice.

### Assignment Rules

The assignment output can contain three slot types:

- `group`: a showcase group with multiple participants where one winner advances.
- `battle`: a 1:1 match where one winner advances.
- `bye`: a participant advances without a vote.

The system should produce exactly the selected number of advancement slots. If fewer than 2 confirmed participants exist, first-round assignment is unavailable.

Examples:

```txt
30 participants / 8 advancement slots
-> 8 groups
-> balanced group sizes, such as 4,4,4,4,4,4,3,3
-> 8 winners advance
```

```txt
13 participants / 8 advancement slots
-> 5 battles + 3 byes
-> 8 participants advance
```

```txt
7 participants / 4 advancement slots
-> 3 battles + 1 bye
-> 4 participants advance
```

Admin can edit assignments after generation:

- Change slot order
- Move a participant between slots
- Rename a slot
- Replace a battle with a group or vice versa by editing participants in the slot
- Set or clear a bye

## Vote Sessions

Voting is modeled as flexible vote sessions. A vote session is the only thing the audience sees.

Examples:

- A group vote
- Round 1 A group
- Match 1
- Quarterfinal 1
- Final
- Winner vote

Each vote session has:

- Title
- Candidate participants
- Open or closed status
- Optional linked first-round slot
- Created time
- Opened time
- Closed time

Only one vote session should be open at a time in the MVP. If admin tries to open a new vote session while another is open, the system should require closing the existing one first.

The system shows vote results after a session is closed. It does not automatically resolve ties. Ties are shown as ties, and admin can create a runoff vote session or decide off-system.

The system does not auto-create later bracket rounds. Admin uses prior results to create the next vote sessions manually.

## Role Screens

### Audience Home

Shown after entrance-code entry.

It includes:

- Current open vote
- Winner prediction lotto
- User's vote/prediction status
- "I am a participant" action
- Link to participant page if this entrance code already has a participant profile

### Participant Page

Available only after an entrance code has a participant profile.

It includes:

- Artist name edit
- Autotune setting
- Note for sound/host
- Music link list
- Add music link
- Edit link title, purpose, and memo
- Delete own link

The participant page only shows links for the participant profile linked to the current entrance code.

### Sound Page

Accessed by a shared sound password.

It is a full cue sheet, not a search/filter tool.

It includes:

- Current participant/slot
- Next participant/slot
- Full participant and slot order
- All music links grouped by participant
- Link purpose
- Cue memo
- Link last updated time
- Cue status
- Open link
- Mark checked
- Last refreshed time

File status:

- Missing
- Unchecked
- Newly updated
- Checked

A link is newly updated when its updated time is newer than the sound check time.

The sound page refreshes approximately every 5 seconds in the MVP.

### Host Page

Accessed by a shared host password.

It is optimized for quick reading.

It includes:

- Current event phase
- Current slot/participant
- Next slot/participant
- Notes for the current participant
- Open vote status
- Vote result summary

### Admin Page

Accessed by a shared admin password.

The admin page includes minimal controls:

- Generate entrance codes
- View entrance code usage
- View participant list
- Edit participant names, order, status, and notes
- Create first-round assignment from selected advancement slot count
- Edit first-round slots
- Create vote sessions from slots or by manually choosing candidates
- Open and close vote sessions
- View vote results
- Set current and next participant/slot

Out of MVP scope:

- Stage broadcast screen control
- Automatic full bracket progression
- Mission management
- Trophy/winner reveal animation
- Complex link notification settings

## Data Model

### EntranceCode

Represents one person.

Fields:

- `id`
- `code`
- `usedAt`
- `participantId`
- `createdAt`

Constraints:

- `code` is unique.
- One entrance code can link to at most one participant.

### Participant

Fields:

- `id`
- `entranceCodeId`
- `artistName`
- `autotuneRequired`
- `note`
- `order`
- `status`
- `createdAt`
- `updatedAt`

Status values:

- Applied
- Confirmed
- Absent

### MusicFile

Fields:

- `id`
- `participantId`
- `url`
- `title`
- `purpose`
- `memo`
- `createdAt`
- `updatedAt`
- `soundCheckedAt`

Purpose values:

- Entrance
- Round1
- Round2
- Etc

### RoundSlot

Represents first-round assignment output.

Fields:

- `id`
- `name`
- `type`: group, battle, or bye
- `order`
- `winnerParticipantId`
- `createdAt`
- `updatedAt`

### RoundSlotParticipant

Join table between slots and participants.

Fields:

- `roundSlotId`
- `participantId`
- `order`

### VoteSession

Fields:

- `id`
- `title`
- `linkedRoundSlotId`
- `isOpen`
- `createdAt`
- `openedAt`
- `closedAt`

### VoteSessionCandidate

Fields:

- `voteSessionId`
- `participantId`
- `order`

### Vote

Fields:

- `id`
- `voteSessionId`
- `entranceCodeId`
- `participantId`
- `createdAt`

Constraint:

- Unique by `voteSessionId` and `entranceCodeId`.

### PredictionLotto

Fields:

- `id`
- `entranceCodeId`
- `participantId`
- `createdAt`

Constraint:

- Unique by `entranceCodeId`.

### EventState

Singleton event state.

Fields:

- `phase`
- `currentRoundSlotId`
- `currentParticipantId`
- `nextRoundSlotId`
- `nextParticipantId`
- `openVoteSessionId`
- `updatedAt`

## Safety and Edge Cases

### Entrance Codes

- Unknown codes cannot enter.
- Used codes can re-enter as the same person.
- Admin can see which codes were used.
- Voting and lotto uniqueness are based on entrance code, not browser cookies.

### Participant Profiles

- One entrance code can create one participant profile.
- Duplicate artist names are allowed but should show an admin warning.
- Admin can fix mistaken participant registrations.

### Music Files

- Direct upload is out of scope for the event build.
- Link submission and cue notes are valid.
- Multiple links per purpose are valid.
- Sound needs certainty, so every link shows updated time and checked status.
- Newly changed links or cue notes must stand out visually.

### Voting

- Only one vote session should be open at once.
- Closed vote sessions show results.
- Ties remain ties.
- Admin manually creates runoff sessions if needed.

### Realtime Behavior

- MVP uses polling, not mandatory websockets.
- Sound, host, and admin pages refresh about every 5 seconds.
- These pages show last refresh time.

## Testing Strategy

Unit tests:

- Entrance-code validation
- First-round assignment generation
- Music link status calculation
- Vote uniqueness rules

Integration tests:

- Entrance code can enter once and re-enter.
- Entrance code can create a participant profile once.
- Participant can add multiple music links with the four allowed purposes.
- Vote session rejects duplicate vote from same entrance code.
- Lotto rejects duplicate prediction from same entrance code.

End-to-end smoke tests:

- Audience enters with code and sees open vote.
- Participant registers and adds a music link.
- Sound page shows the participant links and cue status.
- Admin creates first-round slots and opens a vote session.

## Implementation Notes

The first implementation should prioritize the full event-day vertical slice:

1. Entrance code entry.
2. Participant registration.
3. Music link and cue note submission.
4. Sound cue sheet.
5. Admin first-round assignment.
6. Vote session open/close.
7. Audience vote and lotto.
8. Host status page.

Direct file upload is intentionally removed from the event build. Link submission must remain available.

The implementation plan should replace the earlier draft plan because this design changed the identity model from role-specific participant access to entrance-code-centered identity.

## Event Build Detailed Design Addendum

This addendum captures the detailed Korean event-build requirements added on 2026-07-06. If this section conflicts with earlier design decisions, prefer this addendum for the immediate event build.

### Project Purpose

Build a mobile web app for offline rap battle event operations.

The system lets:

- Admin control event progress from one screen.
- Audience vote from their phones.
- Participants register and submit music links and cue notes.
- Host and sound operator see the current event state in near real time.

### Target Stack

- Monorepo
- Vite React CSR app
- TypeScript
- React Router
- TanStack Query
- Hono API on Cloudflare Workers
- Formisch or TanStack Form, chosen after a short implementation spike
- Valibot
- Supabase Database through server-side Supabase JS in the API worker
- Tailwind CSS
- shadcn/ui with Base UI defaults
- OXC for linting and formatting

### Four-Day Real Event Build Decision

The app must be usable at an offline event four days after this decision. It is not a toy MVP; it is a small real production-for-event system. Prioritize operational reliability and implementation speed over long-term architecture.

Final event-build decisions:

- Build mobile web only.
- Optimize for phone browsers first; desktop/tablet only need to remain usable, not polished.
- Use a CSR frontend plus a separate API worker because entrance-code validation and admin actions need an explicit server boundary.
- Deploy the frontend with Cloudflare Pages.
- Deploy the API with Cloudflare Workers.
- Do not use Next.js.
- Do not use TanStack Start for this event build.
- Do not use Prisma.
- Use a small custom API server, preferably Hono on Cloudflare Workers.
- Use Supabase as the database backend for data, constraints, and RPC where useful.
- Use API routes for entrance-code validation and admin actions.
- Do not build direct audio file upload for the event build.
- Participants submit audio links and cue metadata instead.
- Use TanStack Query polling every 2-5 seconds for audience, admin, host, and sound screens.
- Add Supabase Realtime only if the core app is already stable.
- Spike Formisch and TanStack Form quickly, then choose the lower-complexity option for the actual forms.
- Keep admin security pragmatic: no `service_role` key in the browser, RLS enabled where practical, sensitive writes through API routes.
- Expected peak concurrent users: 100 maximum, with likely venue usage closer to 40.

### Monorepo Structure

Use a monorepo so the CSR app, API worker, and shared domain code stay versioned together.

Recommended structure:

```txt
apps/
  web/      # Vite React CSR app deployed to Cloudflare Pages
  api/      # Hono Cloudflare Worker deployed to Cloudflare Workers
packages/
  shared/   # shared TypeScript types, Valibot schemas, constants, domain helpers
supabase/
  schema.sql
```

Shared package responsibilities:

- Route request and response types.
- Valibot input schemas.
- Domain constants such as status values and role names.
- Pure tournament generation helpers.
- Vote result calculation helpers.

Keep app-specific runtime code out of `packages/shared`; it must not depend on browser APIs, Worker APIs, or Supabase clients.

### Server Boundary

The Cloudflare Worker API provides the backend boundary for this event build.

Server-side responsibilities:

- Validate entrance codes.
- Create or refresh the audience session identity with an httpOnly cookie.
- Create or refresh admin, host, and sound role sessions with separate httpOnly cookies.
- Run participant registration writes.
- Run participant music-link and cue-sheet metadata writes.
- Open, close, and reveal vote sessions.
- Generate, regenerate, approve, and publish bracket drafts.
- Run admin-triggered rehearsal/event resets.
- Keep service credentials out of browser code.

Client-side responsibilities:

- Render mobile-first pages.
- Hold local UI state.
- Use TanStack Query for reads and polling.
- Submit forms to API routes.
- Submit audio links and cue-sheet metadata through API routes.

No Supabase `service_role` key may be shipped to the browser.

### Environment Variables and Secrets

All secrets, keys, passwords, and deploy-specific URLs must be configured through environment variables.

Rules:

- Server-only secrets must never use a browser-exposed prefix.
- Browser-exposed variables may contain only public configuration such as public app URL or Supabase anon URL/key if needed.
- Supabase `service_role` key, admin password hash, host password hash, and sound password hash are server-only.
- Do not hardcode event codes, role passwords, or Supabase keys in source files.
- Keep a committed `.env.example` with variable names but no real values.
- Keep real `.env` files untracked.
- Validate required environment variables at server startup or API handler entry with a typed env helper.

Expected server-only variables:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
ADMIN_PASSWORD_HASH
HOST_PASSWORD_HASH
SOUND_PASSWORD_HASH
COOKIE_SECRET
```

Expected browser-safe variables, only if needed:

```txt
VITE_PUBLIC_APP_URL
```

### Session Cookies

Use httpOnly cookies for event identity and role sessions.

Cookie decisions:

- Audience entrance identity is stored in an httpOnly cookie after server-side entrance-code validation.
- Admin, host, and sound access are stored as separate httpOnly role cookies after server-side password validation.
- Browser JavaScript must not read or write trusted identity or role tokens directly.
- localStorage may only store harmless UI hints, never authority.
- Cookies should be `Secure`, `SameSite=Lax`, and scoped to the event app path/domain.
- Voting uniqueness still depends on database constraints, not the cookie alone.
- If a user loses cookies or switches devices, they can re-enter with the entrance code and recover the same code identity.

### Form Library Decision

The project will quickly compare Formisch and TanStack Form before building all forms.

Decision rule:

- Use Formisch if entrance-code, participant-registration, vote, and admin forms are simpler with less ceremony.
- Use TanStack Form if Formisch creates uncertainty around validation, async submit state, file inputs, or TypeScript integration.
- Keep Valibot as the validation schema layer either way.
- Do not spend more than a short spike on the comparison because the event deadline matters.

### TypeScript and Code Quality

The project uses TypeScript throughout.

Tooling decisions:

- Enable strict TypeScript.
- Use OXC formatter as the project formatter.
- Use OXC linting through `oxlint`.
- Do not configure Prettier.
- Avoid introducing ESLint unless OXC cannot cover a required rule.
- Add package scripts for typecheck, lint, format, and check.

Expected scripts:

```txt
typecheck: tsc --noEmit
lint: oxlint .
format: oxc format --write .
check: run typecheck and lint
```

Confirm exact OXC formatter CLI/package names during project setup, then keep the scripts aligned with the installed OXC toolchain.

### Mobile Web Constraints

The event app is a mobile web app, not a responsive desktop operations suite.

Design and implementation constraints:

- Primary target width is phone viewport, especially 360-430 px wide.
- All core actions must be reachable with touch controls.
- Buttons for voting, admin controls, and sound actions must be large enough for event-day use.
- Use minimum 44 px touch targets for primary controls where possible.
- Prefer one-handed flows for audience actions: enter code, vote, view result.
- Avoid dense desktop tables; use stacked lists, compact cards, segmented controls, and sticky action bars.
- Keep admin screens usable on a phone even if they are less comfortable than desktop.
- Host and sound screens should favor large readable text and clear current/next state.
- Avoid hover-only interactions.
- Avoid multi-column layouts for required workflows.
- Participant music entry is link/cue-sheet based, not file upload based.
- Participant UI must make it easy to paste links from mobile apps.
- Sound page is a cue sheet: participant order, notes, track links, and status.
- Sound page should remain usable on desktop as a practical exception, because the sound engineer may use a laptop.
- Test on mobile Safari and mobile Chrome if possible.
- Assume unstable venue network; every screen should recover by polling/refetching.

### Roles

Audience:

- View bracket
- View current battle
- Vote
- View results

Participant:

- Includes audience permissions
- Register as participant
- Submit music links and cue notes

Host:

- View current battle
- View next battle
- View results

Sound Operator:

- View participant cue sheet and music links
- View current running order
- Open submitted links
- Mark cue status

Admin:

- Manage participants
- Change event state
- Generate or regenerate tournament structure
- Open voting
- Close voting
- Reveal results
- Select winners
- Advance to next match

### Page Structure

`/` audience main:

- Current match or open vote
- Voting
- Result
- Bracket or assignment view

`/enter` entrance code:

- Code input
- Code validation
- Server sets audience httpOnly cookie

`/register` participant registration:

- Name
- Stage name
- Crew
- Bio
- Music link and cue note submission

`/admin` admin dashboard:

- Participant list, edit, delete
- Tournament generation and regeneration
- Current match
- Winner selection
- Voting open, close, result reveal

`/host` host view:

- Current match
- Next match
- Result

`/sound` sound operation:

- Running order
- Cue sheet
- Music links
- Checked status

### Database Draft

Events:

- `id`
- `title`
- `status`
- `created_at`

Audience codes:

- `id`
- `event_id`
- `code_hash`
- `status`: `unused`, `active`, `blocked`
- `activated_at`
- `created_at`

Participants:

- `id`
- `event_id`
- `name`
- `stage_name`
- `crew_name`
- `bio`
- `audio_url`
- `created_at`

Tournament groups:

- `id`
- `event_id`
- `group_number`
- `bracket_size`
- `status`

Matches:

- `id`
- `event_id`
- `group_id`
- `round`
- `match_order`
- `participant_a`
- `participant_b`
- `winner`
- `status`: `pending`, `voting`, `closed`, `done`

Votes:

- `id`
- `match_id`
- `code_hash`
- `selected_participant`
- `created_at`
- Unique constraint: `match_id, code_hash`

Event state:

- `event_id`
- `registration_open`
- `current_match`
- `voting_status`
- `result_visible`

The implementation plan currently uses more flexible names such as `entrance_codes`, `round_slots`, and `vote_sessions`. Reconcile these table drafts into the final Supabase schema before implementation.

### Cue Sheet and Music Links

Direct audio file upload is out of scope for the event build.

Event audio strategy:

- Participants submit one or more music links.
- Participants add cue notes for the sound operator.
- Store music-link metadata in Supabase.
- Sound operators use a cue sheet view to see running order, notes, links, and checked status.
- The app does not guarantee download or preview of externally hosted links.
- If a participant cannot provide a link, admin can enter cue notes manually.

Recommended metadata fields:

- `id`
- `participant_id`
- `title`
- `purpose`
- `url`
- `memo`
- `created_at`
- `updated_at`
- `sound_checked_at`

### Entrance Code Validation

Entrance codes must be validated on the server.

Flow:

```txt
Audience enters code
-> client submits code to the API
-> API hashes/normalizes code and checks Supabase
-> API rejects unknown or blocked codes
-> API marks unused code active when appropriate
-> API returns or stores the entrance-code identity
-> client proceeds to audience page
```

The client must not fetch all entrance codes or validate codes locally.

### Entrance Flow

Physical wristband example:

```txt
battle.vote
X4T82Q
```

QR example:

```txt
battle.vote/enter?code=X4T82Q
```

Flow:

```txt
Open domain
-> enter code
-> validate code
-> API sets audience httpOnly cookie
-> redirect to main screen
-> automatically re-enter on later visits
```

### Voting Flow

```txt
Admin opens voting
-> audience votes
-> vote is saved to DB
-> admin closes voting
-> admin reveals results
-> audience views results
```

After voting closes, additional votes must be rejected.

### Tournament Flow

Admin selects a bracket size:

- 2
- 4
- 8

The system then:

- Shuffles participants automatically.
- Creates groups or matches.
- Creates bracket UI data.
- Allows BYE.
- Automatically advances BYE participants.

The earlier first-round assignment design also allows 16 advancement slots and group/battle/bye slot types. Prefer that more flexible model unless a stricter event rule is chosen later.

### Bracket Draft and Publish Flow

Initial bracket generation is a draft until admin approves it.

Flow:

```txt
Admin clicks generate bracket
-> server creates a draft assignment
-> admin can regenerate draft repeatedly
-> audience does not see the draft
-> admin approves/publishes draft
-> published bracket becomes visible to audience, host, and sound pages
```

Implementation notes:

- Keep draft and published bracket state separate.
- Regenerating should replace only the current draft, not the published bracket.
- Publishing should be an explicit admin action.
- If a bracket is already published, generating a new draft must not change audience-visible data until approval.

### Realtime

Subscribe to changes for:

- `participants`
- `matches`
- `votes`
- `event_state`

Screens to synchronize:

- Audience
- Host
- Admin
- Sound

The earlier MVP design allows polling every five seconds where Supabase Realtime is not yet wired. Realtime can replace polling as the implementation matures.

### Event State Machine

```txt
Registration
-> tournament created
-> match started
-> voting open
-> voting closed
-> result revealed
-> winner selected
-> next match
-> final
-> event ended
```

### Admin Functions

Participants:

- Add
- Edit
- Delete

Tournament:

- Generate
- Reset
- Generate draft repeatedly
- Publish approved draft

Match:

- Change current match
- Select winner

Vote:

- Open
- Close
- Reveal result

Event:

- Close registration
- End event
- Reset rehearsal/event data from the admin screen

### Admin Reset Controls

The admin screen must expose controlled reset actions for rehearsal and event setup.

Reset actions:

- Reset votes only.
- Reset vote sessions and results.
- Reset bracket drafts only.
- Reset published bracket and bracket drafts.
- Reset event state to pre-event.
- Reset sound check status.
- Full rehearsal reset while keeping participants, entrance codes, and music links.

Safety requirements:

- Every reset action must run on the server.
- Every reset action must require an admin role session.
- Dangerous resets must require explicit confirmation text, not only a single tap.
- Reset actions must be separated by scope so admin can avoid deleting participants or music links accidentally.
- Music links should not be deleted by normal reset actions.
- Entrance codes should not be deleted by normal reset actions.
- Add a visible timestamp or status after reset completes.

### Development Order

1. Create monorepo with `apps/web`, `apps/api`, and `packages/shared`.
2. Create Vite React/Tailwind/shadcn mobile web app.
3. Create Hono Cloudflare Worker API.
4. Write Supabase database schema.
5. Build music-link and cue-sheet data model.
6. Build common mobile layout.
7. Build audience entrance-code flow.
8. Build participant registration.
9. Build music link submission and sound cue sheet.
10. Build admin participant management.
11. Build tournament generation algorithm in shared code.
12. Build bracket draft/regenerate/approve/publish UI.
13. Build current match management.
14. Build voting.
15. Connect polling synchronization.
16. Build host screen.
17. Build sound operator screen.
18. Final QA on multiple phones, mobile Safari/Chrome, concurrent users, and event rehearsal.

### Post-MVP Ideas

- Kakao login
- Admin permission management
- Multiple event support
- Automatic QR generation
- Code CSV export
- Event history
- Match records
- Winner records
- Dedicated live screen
- Push notifications
- Admin audit log
