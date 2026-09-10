# Ready

A daily overview for a teenager: *what should I finish before free time?*

Ready is an installable web app (PWA) with no account, backend or notifications. All data is
stored locally in the browser's IndexedDB. The app is hosted as static files on GitHub Pages:
<https://casperwollesen.github.io/Conrad/>

The UI is in English; all user-facing strings live in [`src/texts.ts`](src/texts.ts) together
with the app name, so wording is easy to change.

## Features

- **Today** – the date, a calm status card ("2 things first" / "You're ready" / "Good night"),
  pending before-free-time tasks (including earlier ones not done), other tasks today, a peek at
  tomorrow and a collapsible "Done today".
- **Upcoming** – a day-grouped list for the next 14 days (expandable up to 13 weeks), with
  earlier unfinished items on top and a "+" per day to add a task on that date.
- **Routines** – weekly routines on one or more weekdays, with optional preparation a number of
  days before, pause/resume and editing.
- **Tasks with preparation** – e.g. "Bring cake to school, Friday 08:00" with the preparation
  "Bake the cake" on Thursday. Preparation and main action are checked off separately.
- **Quick check-off with undo** – no confirmation dialogs for everyday actions.
- **Skip this time** – for one concrete routine occurrence, without touching the routine.
- **Bedtime** – configurable in settings. Defaults: 21:30 on school nights (Sunday–Thursday),
  23:00 on Friday and Saturday nights, back at 06:00. During that window the front page says
  "Good night" instead of listing tasks.
- **Time picking** – an iOS-style drum picker (hour and minute wheels, 5-minute steps, 24-hour
  clock, endless scrolling). A new deadline starts at 12:00. Times and dates in the past cannot
  be chosen for new tasks.
- **Backup** – export/import of one JSON file with validation, preview and atomic replacement.
- **Offline** – a service worker caches the app; everything works without internet after the
  first load.
- **Updates** – "New version ready" with a button; the app never reloads on its own.

Deliberately left out (version 1): notifications, parental controls, computer blocking, screen
time, social features, points/streaks, calendar integration, cloud sync, multiple users.

## Technology

| Part      | Choice                                                    |
| --------- | --------------------------------------------------------- |
| UI        | React 19, TypeScript (strict), plain CSS with design tokens |
| Build     | Vite 7                                                    |
| Storage   | IndexedDB via Dexie 4                                     |
| PWA       | vite-plugin-pwa (manifest, service worker, offline)       |
| Icons     | lucide-react                                              |
| Tests     | Vitest 4 (+ fake-indexeddb for storage tests)             |
| Hosting   | GitHub Pages via GitHub Actions                           |

No router, no global state library, no external CDN calls. The font is the system font.

## Getting started

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
```

```bash
npm run dev
```

The dev server runs on <http://localhost:5173/Conrad/> (the app lives on the same sub path as on
GitHub Pages, so paths can be tested locally). The service worker is disabled in dev.

Sample data: in dev mode the **Load sample data** button is available under Settings. In
production it is only shown when the URL contains `?demo`. Sample data never comes back by
itself after deletion.

### Scripts

| Command             | Does                                                  |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Development server with hot reload                    |
| `npm run typecheck` | `tsc --noEmit`                                        |
| `npm test`          | Runs all Vitest tests once                            |
| `npm run build`     | Typecheck + production build into `dist/`             |
| `npm run preview`   | Serves `dist/` locally (use this for offline testing) |
| `npm run icons`     | Regenerates the PNG icons in `public/`                |

### Offline test of a production build

```bash
npm run build && npm run preview
```

Open <http://localhost:4173/Conrad/>, wait for the page to load (the service worker installs),
switch networking off in DevTools (or turn off Wi-Fi) and reload. The app must open, show data
and allow creating/checking off as usual.

## Deployment to GitHub Pages

The workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push
to `main`: `npm ci` → typecheck → test → build → deploy with `actions/deploy-pages`.

**One-time manual setup in GitHub:** Repository → *Settings* → *Pages* → *Build and
deployment* → *Source*: choose **GitHub Actions**. Without this the deploy job fails with 404.

Base path: `vite.config.ts` uses `BASE_PATH` (default `/Conrad/`). The workflow sets it to
`/<repository-name>/` automatically, so a renamed repository works without changes. For hosting
at a domain root: `BASE_PATH=/ npm run build`.

## Architecture

```
src/
  texts.ts              All UI strings and the app name
  domain/               Pure logic without React (fully tested)
    types.ts            Data model
    dates.ts            Local calendar dates, weekdays, DST-safe addDays
    tasks.ts            Task -> Action(s)
    routines.ts         Routine -> occurrences -> Action(s)
    actions.ts          Ready status, sorting, day grouping, "today" model
    bedtime.ts          Bedtime window (school nights / weekend nights / morning)
    backup.ts           Backup format and validation
    ids.ts              Stable ids
  storage/
    db.ts               Dexie schema (versioned)
    repository.ts       All read/write operations, transactions
    demoData.ts         Sample data (only via the explicit button)
  ui/
    components/         Reusable building blocks (Sheet, ActionCard, WheelPicker, Toggle …)
    views/              Today, Upcoming, Routines, editors, settings
    hooks/              Clock/date, live data from IndexedDB, toast, install prompt
    useActions.ts       User actions with error handling and undo
  styles/               tokens.css (design tokens), base, components, views
```

The UI always reads from the database through Dexie's `liveQuery`, so a task is only shown as
saved or done if the write actually succeeded. If a write fails, an error toast is shown and the
screen stays unchanged.

## Data model

- **Task** – single task: `title`, `date` (YYYY-MM-DD), optional `time` (HH:MM), `note`,
  `beforeFreeTime`, `completedAt` and optional `prep` `{ title, date, beforeFreeTime, completedAt }`.
  Main action and preparation are two steps (`main`/`prep`) on the same task, each with its own
  check-off.
- **Routine** – recurrence rule: `weekdays` (1 = Monday … 7 = Sunday), `startDate`, optional
  `time`, `note`, `beforeFreeTime`, optional `prep` `{ title, daysBefore, beforeFreeTime }`, `paused`.
- **OccurrenceState** – status for one step of one concrete occurrence. Id =
  `routineId|eventDate|stepId`, where `eventDate` is always the date of the main event. Friday's
  preparation is therefore identified as Friday's occurrence even though it is done on Thursday.
  Only `done`/`skipped` are stored; pending occurrences have no row.
- **Setting** – small key/value settings, e.g. `bedtime` `{ enabled, weekdayStart, weekendStart, end }`
  and whether the install hint was dismissed.
- **Action** (computed, never stored) – a concrete, checkable thing on a concrete date, derived
  from tasks and routines. Has a stable id (`task:<id>:<step>` / `routine:<id>:<eventDate>:<step>`).

## Date and recurrence rules

- Dates are local calendar dates as strings (`YYYY-MM-DD`); clock times are separate `HH:MM`
  strings in local time. "Today" is determined from the local date, never UTC.
- `addDays` uses the calendar (`new Date(y, m, d + n, 12)`), not multiples of 24 hours, so
  month, year and daylight-saving boundaries are handled correctly.
- Routine occurrences are computed from `startDate` up to today + 91 days, every time the app
  opens, comes to the foreground or passes midnight while open. No background process.
- Preparations that would fall before `startDate` are not generated, so a new routine never
  creates a historical backlog.
- Paused routines yield no occurrences.
- Changes to a routine apply going forward. Status is stored per occurrence, so occurrences
  already done never resurface.

### The "You're ready" rule

An action is *pending before free time* when it (1) is flagged "must be done before free time",
(2) is dated today or earlier and (3) is neither done nor skipped. The status is ready when there
are no such actions. Future actions never block; a preparation can block today even though the
main action is tomorrow. A passed clock time never marks anything as done, and tasks without a
time are not shown as overdue during their own day.

Earlier, unfinished actions do not disappear at midnight. They sit on top of "Before free time"
(if they count) or in a collapsible "Earlier" section until they are done, rescheduled, skipped
(routines) or deleted.

### Bedtime

`isBedtime(today, nowTime, settings)` is true from the evening's start time (weekend start on
Friday and Saturday evenings, weekday start otherwise) until the morning end time. Any time
before the end time counts as the previous evening's window. Settings are validated so the
morning time must be earlier than both start times.

## Backup

Settings → **Export backup** saves one JSON file:

```json
{
  "app": "ready",
  "formatVersion": 1,
  "exportedAt": "2026-09-09T18:00:00.000Z",
  "data": { "tasks": [], "routines": [], "occurrenceStates": [], "settings": [] }
}
```

**Import backup** validates structure, fields, dates and version, shows what will be imported
(number of tasks, routines, check-offs and export time) and requires confirmation. The
replacement happens in one IndexedDB transaction; if anything fails, nothing changes. Invalid or
unsupported files are rejected with an explanation without touching existing data.

`navigator.storage.persist()` is requested the first time something is saved. It is not a
guarantee, which the settings screen also says, together with the advice to back up before
switching phones.

## Tests

```bash
npm test
```

Tests live next to the code (`src/**/*.test.ts`) and cover, among other things, the twelve
scenarios from the specification: the before-free-time rule today/tomorrow, the cake example
(baking on 10 Sep, bringing on 11 Sep at 08:00, independent check-off), gymnastics
Tuesday/Friday → packing Monday/Thursday, check-off per occurrence, skipping, unfinished actions
across a date change, no historical backlog, month/year/DST boundaries, export/import and
rejection of invalid imports. The bedtime window has its own tests.

## Known limitations

- No merging on import; a backup replaces everything.
- The native date picker (`<input type="date">`) follows the device language. Times are picked
  with the built-in wheels (24-hour, 5-minute steps).
- iOS Safari shows no automatic install prompt; the app shows a short guide instead
  ("Share → Add to Home Screen").
- Persistent storage depends on the browser; the backup is the real safety net.
- There is no bulk action to clear many old, unfinished routine occurrences; they are handled
  one at a time (done, skip) or by pausing the routine.
