# dash: project memory

Notes for Claude sessions on this repo. Read this first; update it at the end of any session that
changes how the app works or what's planned.

## What dash is

Antonis's personal dashboard for college: courses, deadlines, tasks, calendar and weather.
One React codebase ships three ways:

- **Website**: https://antwnakys.github.io/dash/ (GitHub Pages; every push to `main` deploys via `.github/workflows/deploy.yml`)
- **Home-screen web app** (PWA manifest in `public/`)
- **iOS app**: Capacitor 8 project in `ios/` (bundle id `com.antwnakys.dash`, team `WDTXV8PP35`, iOS 15+).
  `.github/workflows/ios.yml` builds an unsigned `dash.ipa` on every push to `main` and publishes it on the `ios-latest` release.

The user writes requests for Claude as **tasks inside the app** (often under College/Personal), and
sends screenshots. They mostly use the site in Chrome on iPhone, and the native app.

## Stack and commands

React 19, TypeScript 7, Vite 8, Tailwind 4, framer-motion, lucide-react, Capacitor 8 (SPM, no CocoaPods).

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build; must pass before pushing
npm run lint       # oxlint; two existing set-state-in-effect warnings and one only-export-components in DashboardContext are known
npm run ios        # build, cap sync ios, open Xcode (Mac only)
npm run ios:sync   # build + cap sync without opening Xcode
```

There is no test suite. Verify changes with `tsc -b`, `oxlint`, `npm run build`, and by driving the built site
in Playwright with an iPhone viewport (`vite preview`, seed `localStorage` keys below, set
`sessionStorage['dash.intro.seen']='1'` to skip the intro).

## Code map

- `src/types/index.ts`: all data types (Task, Course, CourseMeeting, Assignment, CalendarEvent, AgendaItem, Profile…)
- `src/context/DashboardContext.tsx`: app state; `buildAgenda` merges deadlines, own events and synced calendar events
- `src/views/`: Today, Courses, Tasks, Calendar screens
- `src/components/editor/`: bottom-sheet forms (CourseForm + ScheduleEditor, DeadlineForm, EventForm, TaskForm, SettingsForm); `fields.tsx` has inputs, `PickerPill` (native iOS date/time picker behind a pill)
- `src/lib/campus.ts`: campus = **Sorou 74, Marousi**; `atCampus`, `isClass`, `EXAM` regex, `matchCourse`
- `src/lib/commute.ts` + `components/commute/LeaveCard.tsx`: "Leave by 08:10" card on Today for the first class of the day
  (calendar classes at campus + courses' weekly times; tomorrow's from 17:00). Home is Argyroupoli; route Line 2 → Line 3 to
  Doukissis Plakentias → suburban to Pentelis; default 80 min door to door, `profile.commuteMinutes` in Settings → Getting to campus.
  Weather hint on the card (`lib/tripWeather.ts`, `hooks/useTripForecast.ts`): hourly Open-Meteo for home (Argyroupoli) around
  leaving/returning and Marousi while on campus (until the day's last class ends); storm > rain (≥50% or ≥0.3 mm) > cold (≤10°)
  > hot (≥33°). Fetched only while a trip is coming up, cached 30 min. (Open-Meteo is blocked from Claude's cloud sandbox,
  so test it with a mocked route.)
- `src/lib/classes.ts`: `classesOn(day)` = calendar classes at campus + courses' weekly times (deduped); used by the leave card,
  `components/courses/Timetable.tsx` (week view on Courses) and reminders.
- `src/lib/reminderPlan.ts` (pure) + `src/lib/reminders.ts` + `hooks/useReminders.ts`: iPhone local notifications
  (`@capacitor/local-notifications`): 10 min before leave time for the first class, 20:00 the evening before and 3 h before
  anything due. Rebuilt on every data change (cancel all, schedule next 14 days, max 60). Toggles in Settings → Reminders;
  one-tap "Turn on reminders" card on Today (the user dislikes digging through Settings).
- `src/lib/metroCard.ts` + `components/commute/MetroCardCard.tsx`: the monthly transport card runs out on the 3rd; reminder
  at 10:00 on the 2nd ("Your metro card expires tomorrow", next two months always scheduled) and a Today card on the 2nd/3rd
  with "Renewed" (dismissed per month). Toggle `profile.reminders.metroCard`.
- `src/lib/grades.ts`: `Assignment.grade/outOf` (default out of 10); averages on course cards, Courses summary, and the
  "Work and grades" list in the course editor; grades are entered in the deadline editor.
- `src/lib/meeting.ts`: online lessons. Teams/Zoom/Meet links are read from Google event description/location/conference
  data and iCal DESCRIPTION/URL into `CalendarEvent.link`; "online" in the title (or a link) sets `online`. Online classes stay
  `kind: 'class'` but get no Leave card or leave reminder; Today shows `OnlineCard` ("Academic Skills online at 17:00", Join on
  Teams) from 3 h before; Join buttons on Up next, timetable and the course card. Courses can also store a `meeting` link.
- `src/lib/schedule.ts`: course meeting helpers (format, parse old text, next class, infer from calendar events)
- `src/data/google.ts`: Google sign-in (`@capgo/capacitor-social-login`) and Calendar API; client IDs in `src/config.ts`
- `src/lib/ics.ts`: iCal parser (recurrence, time zones, DTEND)
- `src/hooks/useCalendarSync.ts`: read-only calendar copy, refreshed every 15 min and on focus
- `src/lib/liveUpdate.ts`: the iPhone app updates itself from the website (`@capgo/capacitor-updater` in manual mode, no Capgo cloud).
  `deploy.yml` publishes `app-bundle.zip` + `version.json` (`{version: short sha, url, checksum: sha256}`); the app compares with its
  `__BUILD__` (short sha, `vite.config.ts`), downloads, and switches on next open. Settings → About shows the running version.
  Native-only changes (new plugins, Info.plist, icons) still need a reinstall from Xcode.
- Native iOS (`ios/App/App/SceneDelegate.swift`): `DashViewController` (subclass of CAPBridgeViewController) paints the view,
  web view, scroll view and under-page area in dash's `--bg` (light #f2f2f0 / dark #0b0b0d, dynamic) with content insets
  off, so nothing dark shows behind the Dynamic Island (it used to show the `#0b0d12` config background in light mode).
  `DashThemePlugin` ("DashTheme".set({style})) sets the window's light/dark override from the in-app theme; called in
  `hooks/useTheme.ts`. Changing Swift needs a reinstall from Xcode.
  Web side (AppShell): nothing covers the status bar at scroll top, so the page and ambient glow run up behind the
  Dynamic Island; a solid-then-fading blur overlay fades in over the first 28 px of scroll. (A permanent solid strip
  there looked like a dark band against the glow; the user disliked it on Nov 3.)
  The remaining band on the user's iPhone 15 (iOS 26) was iOS 26's scroll edge effect under the status bar:
  Settings → About "Screen:" showed top 59 and page 393×852 = full screen, so the page wasn't offset. Fixed by
  `scrollView.topEdgeEffect/bottomEdgeEffect.isHidden = true` in DashViewController (needs Xcode 26 / iOS 26 SDK;
  CI uses iPhoneOS26.5.sdk).
- `src/sync/` + `src/hooks/useCloudSync.ts`: cross-device sync through one file `dash-data.json` in the Google Drive **appDataFolder** (scope `drive.appdata`); per-record last-write-wins with `updatedAt`, tombstones for deletes

localStorage keys: `dash.courses.v1`, `dash.assignments.v1`, `dash.events.v1`, `dash.tasks.v1`,
`dash.profile.v1`, `dash.deleted.v1` (synced); `dash.calendar.v1`, `dash.google.v1` (device only).
New fields on synced records must be optional so older app versions and existing data keep working.

Claude cannot read the user's own data: it lives on their devices and in the Drive app-data folder,
which only dash's OAuth client can open. Ask for a screenshot or paste.

## Design rules

Apple-inspired, light and dark (tokens on `:root` in `src/index.css`; `--accent` blue, `--danger`,
`--course` green). Glass only on floating chrome. SF Pro on Apple devices, Inter elsewhere.
16px inputs on phones (no iOS zoom). Keep motion calm: entrances play once per session.
Dates and times use the device locale through `Intl` (the user is in Greece: 24-hour, Monday-first weeks).

## History

- **Nov 1, 2026**: first version (courses, tasks, calendar, agenda, weather, .ics import, PWA, iOS project, Pages deploy);
  Google Calendar via secret iCal links; iOS build workflow; bundled fonts, opt-in location; personal signing team;
  Apple-style redesign (light/dark, selective glass, tab bar, grouped lists); Google sign-in for Calendar; OAuth client IDs.
- **Nov 2, 2026**: Drive app-data sync across devices and a motion pass; stopped the app feeling like it reloads on phones;
  fixed iOS calendar sync hanging (shared, cached Google token requests with a 15 s timeout);
  status-bar fade and compact weather on iPhone.
- **Nov 2, 2026 (PR #1)**: in-app tasks done:
  1. Course times picked with iOS-style day buttons and native time/date pickers (first/last class), several times per course, next class on cards.
  2. Everything at Sorou 74, Marousi is marked as a course: green Course badge and calendar dot, links to the matching course,
     and Courses → "From your calendar" offers to add those classes. Calendar events now keep end times.

## Next up

- **Install the latest build on the user's iPhone** from their laptop (they asked to do this next):
  1. On the Mac: `git pull` on `main`, `npm ci`, `npm run ios`.
  2. In Xcode: App target → Signing & Capabilities → team (personal Apple ID works); plug in the iPhone, pick it, Run.
  3. First run on the phone: Settings → General → VPN & Device Management → trust the developer.
     Free Apple ID builds expire after 7 days; re-run from Xcode to renew.
  4. Alternative without building: download `dash.ipa` from the `ios-latest` release and sideload it (e.g. Sideloadly).
  After install, sign in with Google once so calendar and Drive sync start.
- **Nov 2, 2026 (evening)**: the user installed from the Xcode zip but didn't see the morning changes in the app (cause unclear).
  Added live updates + version label so the app follows the website; needs one more install from Xcode to switch on.
- **Nov 3, 2026**: GitHub's iOS build for #3 had been cancelled without a runner (GitHub capacity); re-run succeeded.
  Added the "Leave by" commute card. Plan: the user says "I'm home", then Claude installs the app on the iPhone through
  the Mac (folder `~/dash-xcode`, built at c92fcf5) via Remote Control; the user wants only simple Allow/yes-no prompts, no Settings trips.
  Then added reminders (native plugin), weekly timetable and grades. Home-screen widget not built: it needs App Groups,
  which free Apple ID (personal team) signing doesn't allow; revisit if the user gets a paid developer account.
  `ios.yml` now also publishes `dash-xcode.zip` (Xcode project + plugin sources, no Node needed) on the `ios-latest` release:
  on the Mac, download it and replace `~/dash-xcode`, then build and Run.
- **Academic Skills**: Google Calendar recurring event "ACADEMIC SKILLS/ONLINE", every second Friday 17:00–19:00 until
  Dec 18 2026 (location "Sorou 74", note "spiti" = from home). The college Outlook can't be connected (Microsoft 365 needs
  college admin approval; the user declined forwarding emails to Gmail). On Nov 3 the user pasted the Teams link
  `https://teams.microsoft.com/meet/3698245118325463?p=298byDUz7YvfJieEVn` and Claude appended it ("Teams: …") to the
  series description. If a Friday email brings a different link, the user pastes it and Claude updates the series again.
  If the college approves Microsoft 365, set up a Friday scheduled task to do this automatically.
- **Suburban trains (Nov 3)**: the user takes the 17:11, 17:32 or 17:50 from Doukissis Plakentias to Pentelis (1 min ride),
  from a Hellenic Train screenshot. `planTrip` (lib/commute.ts) picks the latest listed train that arrives with an 8 min walk
  + 5 min spare before class (and no more than an hour early); leave = train − 60 min (home → suburban platform). Otherwise
  the door-to-door estimate. Train times are editable in Settings → Getting to campus (`profile.suburbanTrains`).
  hellenictrain.gr is blocked from the sandbox, so new times come from the user.
- Possible follow-ups: an Export data button in Settings (so Claude can read tasks the user pastes),
  making the campus address editable in Settings.
