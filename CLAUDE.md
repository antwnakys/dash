# dash: project memory

Notes for Claude sessions on this repo. Read this first; update it at the end of any session that
changes how the app works or what's planned.

## What dash is

Antonis's personal dashboard for college: courses, deadlines, tasks, calendar and weather.
One React codebase ships three ways:

- **Website**: https://antwnakys.github.io/dash/ (GitHub Pages; every push to `main` deploys via `.github/workflows/deploy.yml`)
- **Home-screen web app** (PWA manifest in `public/`)
- **iOS app**: Capacitor 8 project in `ios/` (bundle id `com.antwnakys.dash.app`, paid team `H739SB5FKP`, iOS 15+).
  Installed from **TestFlight** (`.github/workflows/testflight.yml`, `docs/TESTFLIGHT.md`); builds last 90 days, no 7-day expiry.
  `.github/workflows/ios.yml` builds an unsigned `dash.ipa` on every push to `main` and publishes it on the `ios-latest` release.
- **Mac app**: Tauri 2 project in `src-tauri/` (bundle id `com.antwnakys.dash`). `.github/workflows/mac.yml` builds a universal,
  ad-hoc signed `dash.dmg` and publishes it on the `mac-latest` release (pushes to `main` that touch `src-tauri/`, the workflow
  or the lockfile, or run it by hand; pull requests only build). The window loads the live site, so web changes need no rebuild.

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
npm run mac        # Tauri dev window (needs Rust; on Linux also libwebkit2gtk-4.1-dev)
npm run icons:mac  # Mac icon from app-icon-light.svg → src-tauri/icons
```

There is no test suite. Verify changes with `tsc -b`, `oxlint`, `npm run build`, and by driving the built site
in Playwright with an iPhone viewport (`vite preview`, seed `localStorage` keys below, set
`sessionStorage['dash.intro.seen']='1'` to skip the intro).

## Code map

- `src/types/index.ts`: all data types (Task, Course, CourseMeeting, Assignment, CalendarEvent, AgendaItem, Profile…)
- `src/context/DashboardContext.tsx`: app state; `buildAgenda` merges deadlines, own events and synced calendar events
- `src/views/`: Today, Courses, Tasks, Calendar screens
- `src/components/editor/`: bottom-sheet forms (CourseForm + ScheduleEditor, DeadlineForm, EventForm, TaskForm, SettingsForm); `fields.tsx` has inputs, `PickerPill` (native iOS date/time picker behind a pill)
- **This repository is public. Never put personal details in code or notes**: no addresses, home area, stations,
  meeting links, emails or calendar contents. They live in the synced profile (Settings), which only the user's devices
  and their own Google Drive hold. (Moved out on Nov 9; older commits in the history still contain some.)
- `src/lib/campus.ts`: the campus is `profile.campus` = {address, place} (Settings → Getting to campus). `atCampus(location,
  campus)` matches the saved address in any spelling: Greek is written in Latin letters (`placeKey`), then the street words +
  house number must appear (or street + area when there's no number). `isClass(e, campus)`, `campusLabel`, `isExamTitle`,
  `matchCourse`, `frequentLocations` (the calendar's most used places, offered as one-tap suggestions in Settings).
  With no address saved, calendar events aren't classes; Courses shows an "Add your campus address" card.
- `src/lib/commute.ts` + `components/commute/LeaveCard.tsx`: "Leave by 08:10" card on Today for the first class of the day
  (calendar classes at campus + courses' weekly times; tomorrow's from 17:00). Default 80 min door to door,
  `profile.commuteMinutes` in Settings → Getting to campus, plus the train times (below).
  Weather hint on the card (`lib/tripWeather.ts`, `hooks/useTripForecast.ts`): hourly Open-Meteo for `profile.home` around
  leaving/returning and `profile.campus.place` while on campus (until the day's last class ends; nothing until both are
  set; the campus area comes from OpenStreetMap Nominatim, `searchAddress`); storm > rain (≥50% or ≥0.3 mm) > cold (≤10°)
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
- Exams tab (`views/ExamsView.tsx`, `lib/exams.ts`, `hooks/useExams.ts`, `components/exams/`): exams = agenda items of kind
  "exam" (`isExamTitle` in campus.ts: accent/case-insensitive, so "ΕΞΕΤΑΣΗ ΣΗΜΑΤΑ" counts; "πριν την εξέταση"/"before the exam"
  doesn't; applies to synced and own events) plus Exam-type deadlines. Study sessions: calendar events in the 60 days before
  whose title contains the exam's subject (e.g. "🚨 ΣΗΜΑΤΑ – Απαγορευτικές" for "🚨🚨 ΕΞΕΤΑΣΗ ΣΗΜΑΤΑ", topic = text after the
  dash), ticks stored in the synced `dash.study.v1` collection (`fromCalendar`); otherwise "Make a study plan" (`planStudy`):
  up to 6 × 90 min at 18:00/19:30/16:30/11:00 on free days, campus classes block 100 min of travel before them, topics shared
  out, last one a practice test. Today shows `NextExamCard` within 14 days.
  + → Exam (`editor/ExamForm.tsx`) adds an own event with `kind: 'exam'` (title, day, optional time and place) and opens
  the Exams tab; "Edit exam" on the card (own exams → ExamForm, course deadlines → DeadlineForm); "Add exam" in the header.
  Exam links: any non-meeting web link in an event's notes/location (`findOtherLink` in meeting.ts → `CalendarEvent.url`) or
  the ExamForm "Link" field shows as a blue `LinkButton` ("Practice ↗" for practice/test sites) on the exam card, the Today
  exam card and the exam in Up next. ΣΗΜΑΤΑ's practice site was added to the Google exam event's notes ("Practice: …") on Nov 3.
  Exam results (from unidash, Nov 9): synced collection `dash.examResults.v1` (`ExamResult`: subject + date copied in so the
  history survives the calendar event going away; optional score/outOf/passed). An exam is over once its day has passed
  (all-day) or 2 h after the start (`isOver`); `upcomingExams` hides exams that are over or have a result,
  `examsAwaitingResult` = over in the last 30 days with no result. Exams tab: "How did it go?" (Add result / Skip) →
  upcoming (empty state only when both are empty) → History (passed · failed). Today shows `ExamResultPrompt` for 3 days.
  `editor/ExamResultForm.tsx` guesses Passed at ≥ half marks until picked by hand; for an Exam-type deadline it also writes the
  grade to the deadline. Google Calendar and iCal links are read 31 days back so recent exams can still be graded.
- Tasks (Nov 9 overhaul). Optional fields on `Task`: `priority` (1 high, 2 medium, 3 low), `notes`, `subtasks` (steps),
  `repeat` (daily/weekdays/weekly/monthly), `completedAt`. **Quick add** (`lib/quickAdd.ts` `parseQuickAdd`, box in
  `components/tasks/AddTask.tsx`): reads dates/times/priority/#category/repeats from the typed line (English + Greek day
  words; day-first dates; "18.05" is a time, dotted dates need a year; "sat"/"sun" must be written out; a weekday whose
  time has passed means next week). What it understood shows as chips under the box before Enter; × on a chip keeps
  that phrase in the title (`ignore`). Ticking a repeating task files it done and inserts the next copy
  (`nextOccurrence` in `hooks/useTasks.ts`, never in the past). Tasks tab (`TaskList full`): views Open / Today (due
  today, overdue, or high priority) / Upcoming (dated, by date) / Done (by `completedAt`), search over title, notes and
  steps, category filter, sort My order / Due / Priority (`lib/taskViews.ts`); drag to reorder only in Open + My order.
  Deleting shows a toast with **Undo** (`notify(msg, tone, action)`; `tasks.restore`). `hooks/useTaskActions.ts`.
  The leftover category label "Gaming & projects" is now "Projects".
- Task due dates (`Task.due`/`dueAllDay`, `lib/taskDue.ts`): set in the task sheet (tap a task to edit; Due date toggle with
  day + optional time pills). Overdue open tasks are listed first in red; due tasks join the agenda as kind `task` (Up next,
  calendar dots, "Next due", reminders like deadlines).
- App expiry (`lib/appExpiry.ts`, `hooks/useAppExpiry.ts`, `components/commute/AppExpiryCard.tsx`): native `DashAppPlugin`
  ("DashApp".info() in SceneDelegate.swift) reads ExpirationDate from the app's `embedded.mobileprovision` (free Apple ID
  profiles last 7 days). Reminders at 20:00 the evening before and 3 h before; Today card in the last 2 days with
  "Copy Mac message" (the reinstall prompt); Settings → About shows "App signed until …". Toggle `reminders.appExpiry`.
  TestFlight builds have no `embedded.mobileprovision`, so all of this stays silent there (only Xcode installs expire).
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
  a temporary Settings → About "Screen:" line showed top 59 and page 393×852 = full screen, so the page wasn't offset. Fixed by
  `scrollView.topEdgeEffect/bottomEdgeEffect.isHidden = true` in DashViewController (needs Xcode 26 / iOS 26 SDK;
  CI uses iPhoneOS26.5.sdk). Confirmed fixed on the phone on Nov 3.
- Location (`lib/location.ts`, `hooks/useHereLocation.ts`): when `profile.autoLocation` isn't false (default on), each
  device looks up where it is on open and on return to the foreground (at most every 2 min) and the weather uses it;
  stored per device in `dash.here.v1`, so phone and laptop don't overwrite each other; `profile.place` (the city) is the
  fallback. iPhone uses `@capacitor/geolocation` (iOS asks once; the web view's own prompt would repeat every launch);
  an app build without the plugin skips it. Place name from BigDataCloud's free reverse-geocode-client with coordinates
  rounded to 2 decimals; looked up again only after moving > 1 km. Toggle in Settings → You.
- App icon: `assets/app-icon-light.svg` (white, iOS Default home screen) and `assets/app-icon.svg` (navy, Dark), rendered by
  `npm run icons` into `AppIcon.appiconset` as `AppIcon-Light.png` / `AppIcon-Dark.png` (luminosity appearance). The user
  uses the Default style and wanted a white icon there; Dark stays as it was. No tinted/clear variant (not used). Native: Xcode install.
- Mac app (`src-tauri/`, `src/lib/macApp.ts`, `src/data/googleMac.ts`): the window opens `src-tauri/launcher/index.html`, which
  goes straight on to https://antwnakys.github.io/dash/ (or waits for the internet). `capabilities/default.json` lets that remote
  page use Tauri IPC (opener + deep-link). `isMacApp` = `__TAURI_INTERNALS__` in window. Links to other sites and `window.open`
  open in the default browser (WKWebView ignores target=_blank). **Google sign-in**: Google blocks OAuth in app web views, so
  `macSignIn` opens Google in the browser with PKCE on the **iOS client ID** (Google's Mac sign-in uses the iOS client type; no
  client secret) and redirect `com.googleusercontent.apps.<id>:/oauth2redirect`; that scheme is registered in tauri.conf.json
  (deep-link plugin), macOS hands the URL to the app, JS swaps the code for tokens at oauth2.googleapis.com (CORS allows the
  github.io origin) and keeps the refresh token in `dash.mac.google.v1` (device only), refreshed silently. Drive app-data is
  per Cloud project, so sync shares data with the web and iPhone. Checked Nov 4: Google accepts that redirect for the iOS client
  (loopback is blocked for it), and the whole hand-off ran in a Tauri window on Linux with a simulated redirect.
  **Menu bar** (src-tauri/src/main.rs): a template icon (`icons/tray.png`, the dash mark in black) with New…, Today, Courses,
  Exams, Tasks, Calendar (show the window, emit `dash://menu`; `onMenuBar` in AppShell switches view / opens New), Open at
  Login (autostart LaunchAgent, switched on at first launch) and Quit. Closing the window hides it; the Dock icon reopens it.
  **Reminders**: `applyReminders` sends the same plan as the iPhone to the app command `set_reminders`; a Rust thread shows each
  one when due (up to 30 min late after sleep) through the notification plugin, so they arrive while dash runs in the menu bar.
  `Info.plist` sets NSAppSleepDisabled so App Nap doesn't delay them. App commands are listed in build.rs (AppManifest) and
  allowed for the remote site in capabilities. Tested Nov 4 in a Linux Tauri window (menu → Exams, New sheet, IPC, clock);
  the macOS notification banner itself was first seen on the user's Mac.
  Not on Mac yet: iCal-link calendars (CORS; Google calendars work), location (falls back to the city).
  Icon: `assets/mac-icon-1024.png` (white icon in Apple's rounded square, `npm run icons:mac`).
- `src/sync/` + `src/hooks/useCloudSync.ts`: cross-device sync through one file `dash-data.json` in the Google Drive **appDataFolder** (scope `drive.appdata`); per-record last-write-wins with `updatedAt`, tombstones for deletes
- Backups (`src/sync/backup.ts`, Settings → Data = `components/editor/DataSection.tsx`): **Export backup** (share sheet
  on iPhone/Safari, a download in browsers, the clipboard in the Mac app) writes `dash-backup-YYYY-MM-DD.json` with every
  synced collection + profile (never Google tokens or the calendar copy). **Restore** (file, copied text, or one of the
  copies on this device) only adds: items missing here come back with a fresh `updatedAt` (so they beat tombstones and
  sync out); nothing is deleted or downgraded. Copies on this device (`dash.snapshots.v1`, last 7): one a day on open,
  plus before Delete all data and before a restore. Delete all data syncs to every device, so it snapshots first and says
  so. Sample data was removed (it replaced real data on every device).
- Mac self-update (`startMacUpdates` in `lib/liveUpdate.ts`): when the Mac window comes to the front (at most once a
  minute, not while a sheet is open) it reads `version.json`; a newer build → `location.replace(SITE + '?v=<sha>')`
  (the query skips the HTML the Mac cached), once per version per session.

localStorage keys: `dash.courses.v1`, `dash.assignments.v1`, `dash.events.v1`, `dash.tasks.v1`, `dash.study.v1`, `dash.examResults.v1`,
`dash.profile.v1`, `dash.deleted.v1` (synced); `dash.calendar.v1`, `dash.google.v1`, `dash.snapshots.v1` (device only).
New fields on synced records must be optional so older app versions and existing data keep working.

Claude cannot read the user's own data: it lives on their devices and in the Drive app-data folder,
which only dash's OAuth client can open. Ask for a screenshot or paste.

## Design rules

Apple-inspired, light and dark (tokens on `:root` in `src/index.css`; `--accent` blue, `--danger`,
`--course` green). Glass only on floating chrome. SF Pro on Apple devices, Inter elsewhere.
16px inputs on phones (no iOS zoom). Keep motion calm: entrances play once per session.
Motion (ported from antwnakys/dash_public on Nov 9): shared springs in `src/lib/motion.ts` (`snappy`, `smooth`, `gentle`,
`bouncy`; `blur()` only on pointer devices; `press`) and CSS twins `--spring-snappy/--spring-smooth` in `index.css`
(switch knob, `.pressable` cards). Tabs slide towards the picked tab (AppShell, `popLayout`); **don't put
`initial={false}` on that AnimatePresence**, it silently blocked every entrance on the first screen (the bug this fixed).
`lib/intro.ts`: the launch logo plays once per session and `Reveal` waits for it, so the page rises in as the logo lifts
away. Sheets rise on phones and grow from the centre on wider screens; checkbox fill springs and the tick draws; tasks
slide in/out; toasts bounce in and can be swiped away.
**Two designs** (Nov 9), picked per device in Settings → Appearance → Design (`dash.look.v1`: auto/graphite/classic,
not synced; `useTheme` → `theme.look`; applied as `<html data-look="graphite">`, also before first paint in index.html).
Automatic = Graphite on computers (`(hover: hover) and (pointer: fine)`: the Mac app, desktop browsers), Classic on
phones; the user wanted the new look on the Mac only for now. Graphite = token overrides in `index.css`
(`:root[data-look='graphite']` + dark twins): concrete/graphite/near-black neutrals, white, one restrained blue for
information, ink-on-paper primary buttons (`--accent-fill` is ink), hairline borders instead of shadows, squarer
shapes (`--radius-card/control/button/chrome/bar`), uppercase section labels, no ambient light (`.ambient`), sidebar as
a flat column against the window edge (`.sidebar`). Components use the shape variables, so both designs share code.
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
  2. Everything at campus is marked as a course: green Course badge and calendar dot, links to the matching course,
     and Courses → "From your calendar" offers to add those classes. Calendar events now keep end times.

- **Nov 9, 2026**: animations and the first-screen entrance fix copied over from unidash (antwnakys/dash_public); web only,
  so the iPhone app gets it by live update and the Mac app by reopening (no TestFlight build or new .dmg needed).
- **Nov 9, 2026 (later)**: exam results copied from unidash: score + passed/failed after an exam, a history, and finished
  exams leave the upcoming list. Web only again (live update).
- **Nov 9, 2026 (night)**: safety pass: personal details out of the public code (campus address + home are settings now),
  backups and restore, daily copies on each device, sample data removed, the Mac app updates itself on focus.
- **Nov 9, 2026 (night)**: Graphite design (Mac/computers only by default; Classic stays on the iPhone).
- **Nov 9, 2026 (night)**: tasks overhaul: quick add with dates, priority, steps, notes, repeats, views, search, Undo.

## Next up

- **On TestFlight since Nov 8, 2026** (see the TestFlight bullet below). The old Xcode route (`~/dash-xcode`, free team
  WDTXV8PP35, `xcrun devicectl device install app`) is no longer needed; that old copy (bundle `com.antwnakys.dash`) sits
  next to the TestFlight app on the phone until the user deletes it. Web changes reach the app by live update.
- **Nov 2, 2026 (evening)**: the user installed from the Xcode zip but didn't see the morning changes in the app (cause unclear).
  Added live updates + version label so the app follows the website; needs one more install from Xcode to switch on.
- **Nov 3, 2026**: GitHub's iOS build for #3 had been cancelled without a runner (GitHub capacity); re-run succeeded.
  Added the "Leave by" commute card. Plan: the user says "I'm home", then Claude installs the app on the iPhone through
  the Mac (folder `~/dash-xcode`, built at c92fcf5) via Remote Control; the user wants only simple Allow/yes-no prompts, no Settings trips.
  Then added reminders (native plugin), weekly timetable and grades. Home-screen widget not built: it needs App Groups,
  which free Apple ID (personal team) signing doesn't allow; revisit if the user gets a paid developer account.
  `ios.yml` now also publishes `dash-xcode.zip` (Xcode project + plugin sources, no Node needed) on the `ios-latest` release:
  on the Mac, download it and replace `~/dash-xcode`, then build and Run.
- **An online class's meeting link** lives in its Google Calendar event (description "Teams: …"); when the user pastes a
  new link, Claude updates the event. The college Outlook can't be connected (Microsoft 365 needs college admin approval).
  Never copy the link into this repository.
- **Trains (Nov 3)**: the user takes one of a few listed departures near the end of the trip (1 min ride),
  from a screenshot of the operator's site. `planTrip` (lib/commute.ts) picks the latest listed train that arrives with an 8 min walk
  + 5 min spare before class (and no more than an hour early); leave = train − 60 min (home → platform). Otherwise
  the door-to-door estimate. Train times are editable in Settings → Getting to campus (`profile.suburbanTrains`).
  The operator's site is blocked from the sandbox, so new times come from the user.
- **Mac app (Nov 4, 2026)**: built as planned (Tauri, live site, browser sign-in, `mac-latest` release). Unsigned, so the first
  open needs `xattr -cr /Applications/dash.app` in Terminal or System Settings → Privacy & Security → Open Anyway (in the release
  notes). Menu bar + reminders added the same day (user's pick). Nice later: iCal links via Tauri HTTP.
- **TestFlight (working Nov 8, 2026).** Paid Apple Developer team **H739SB5FKP** (Individual; a family
  member's membership the user uses). The free team still holds
  `com.antwnakys.dash`, so the iPhone app is now **`com.antwnakys.dash.app`** (`project.pbxproj`, `capacitor.config.ts`;
  the Mac app keeps `com.antwnakys.dash`). App Store Connect app "dash – Antonis" (Apple ID 6832121608, SKU `dash`).
  Google sign-in kept the existing iOS OAuth client (bundle ID isn't enforced) and works in the TestFlight build.
  API key "GitHub" (Admin, key ID YFBR3G89D7) is in the four repo secrets (`APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`,
  `ASC_KEY_P8`); a copy of the .p8 lives on the user's Mac in `~/.appstoreconnect/private_keys/`. The workflow uploads
  on native changes to main, on the 1st of each month and by hand (`gh workflow run testflight.yml`); first run took 5 min,
  cloud signed. From the Mac: `TEAM_ID=H739SB5FKP ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=… scripts/testflight.sh`.
  Internal group "Me" (automatic distribution) with the user as tester (an App Store Connect user with the
  Developer role limited to dash). The user installed it on the iPhone with Automatic Updates on.
  Now possible with the paid team: the home-screen widget (App Groups), revisit if the user asks.
- **Nov 9, 2026 (audit)**: the user asked for a full overhaul of their personal dash (master prompt): new graphite design,
  much stronger tasks (quick add with dates, priority, subtasks, repeat, search), Today as a command centre, ⌘K and
  shortcuts on Mac, calendar week/day views, course notes/resources, focus timer, weekly review. Agreed: keep Google
  Drive sync (no Supabase/Firebase: no new company holding data), keep the repo public but with no personal details
  (option 1), work in small PRs, safety first. Done first: personal details → settings, backups (below), Mac self-update.
