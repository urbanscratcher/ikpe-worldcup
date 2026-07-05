# Ikpe Rap Worldcup MVP Design

## Goal

Build an online event-day web app for 익페 랩월드컵 that keeps voting, participant music files, sound cues, host progress, and minimal admin controls in one simple system.

The system should behave like a practical event remote, not a complex tournament platform. It must support uncertainty: the event may run as group showcases, 1:1 battles, byes, or manually created later-round votes depending on participant count and on-site decisions.

## Core Decisions

- The app is an online deployed web app.
- Shared event data and music files use a server database and storage service such as Supabase.
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
-> submit or update music files
```

The entrance code remains the identity for voting. Creating a participant profile does not create a second voting identity.

### Participant Registration

After entering with an entrance code, a user can choose to register as a participant.

Participant registration captures:

- Artist name
- Autotune microphone needed or not
- Note for sound/host
- Music files

One entrance code can have at most one participant profile. If a participant registers incorrectly, admin can edit or unlink the profile.

### Music File Submission

Participants can submit multiple music items. Each item can be either:

- A direct file upload
- A link submission

Each music item has one purpose:

- Entrance song
- Round 1 MR
- Round 2 MR
- Etc

Multiple files with the same purpose are allowed. This keeps the system flexible for backup tracks, changed files, or last-minute cypher material without adding more categories.

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
- Music file list
- Add file upload
- Add file link
- Edit file title, purpose, and memo
- Delete own file

The participant page only shows files for the participant profile linked to the current entrance code.

### Sound Page

Accessed by a shared sound password.

It is a full cue sheet, not a search/filter tool.

It includes:

- Current participant/slot
- Next participant/slot
- Full participant and slot order
- All music files grouped by participant
- File purpose
- File memo
- File last updated time
- File status
- Open file
- Download file
- Mark checked
- Last refreshed time

File status:

- Missing
- Unchecked
- Newly updated
- Checked

A file is newly updated when its updated time is newer than the sound check time.

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
- Complex file notification settings

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
- `sourceType`: upload or link
- `fileUrl`
- `storagePath`
- `title`
- `purpose`
- `memo`
- `uploadedAt`
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

- Direct upload and link submission are both valid.
- Multiple files per purpose are valid.
- Sound needs certainty, so every file shows updated time and checked status.
- Newly changed files must stand out visually.

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
- Music file status calculation
- Vote uniqueness rules

Integration tests:

- Entrance code can enter once and re-enter.
- Entrance code can create a participant profile once.
- Participant can add multiple music files with the four allowed purposes.
- Vote session rejects duplicate vote from same entrance code.
- Lotto rejects duplicate prediction from same entrance code.

End-to-end smoke tests:

- Audience enters with code and sees open vote.
- Participant registers and adds a music link.
- Sound page shows the participant file and status.
- Admin creates first-round slots and opens a vote session.

## Implementation Notes

The first implementation should prioritize the full event-day vertical slice:

1. Entrance code entry.
2. Participant registration.
3. Music file submission.
4. Sound cue sheet.
5. Admin first-round assignment.
6. Vote session open/close.
7. Audience vote and lotto.
8. Host status page.

Direct file upload can use Supabase Storage or an equivalent storage provider. Link submission must remain available even after upload support exists.

The implementation plan should replace the earlier draft plan because this design changed the identity model from role-specific participant access to entrance-code-centered identity.
