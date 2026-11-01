# dash

A personal dashboard for courses, tasks and your calendar. It runs on the web, installs to an iPhone home screen, and ships as an iOS app.

## Develop

```bash
npm install
npm run dev
```

## Your data

Everything you add (courses, deadlines, events, tasks) is stored on the device in local storage.
Weather comes from [Open-Meteo](https://open-meteo.com) (free, no key). Calendars can be imported from `.ics` files in Settings.

## Web hosting

Every push to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## iOS app (Xcode)

Needs Xcode from the Mac App Store.

```bash
npm run ios        # build web, copy into ios/, open Xcode
```

In Xcode: select the **App** target → Signing & Capabilities → choose your Team (a free Apple ID works),
plug in your iPhone, pick it as the run destination and press Run.

## Icons

Edit `assets/app-icon.svg` / `assets/logo-mark.svg`, then `npm run icons` and copy
`assets/app-icon-1024.png` to `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`.
