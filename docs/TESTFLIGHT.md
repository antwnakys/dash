# dash on TestFlight

TestFlight installs dash on the iPhone from Apple's TestFlight app. No cable, no Xcode, and no 7-day expiry:
each build lasts 90 days, and GitHub uploads a fresh one whenever the native app changes and on the 1st of
every month. Web changes still reach the app by live update, as before.

It needs the paid **Apple Developer Program** ($99 a year).

## What's in the repo

- `scripts/testflight.sh`: archives the app and uploads it to App Store Connect. Works on a Mac where Xcode
  is signed in to the paid account (`TEAM_ID=XXXXXXXXXX scripts/testflight.sh`), and on GitHub with an API key.
- `.github/workflows/testflight.yml`: runs the script on GitHub's Macs. Until the secrets below exist it only
  prints "TestFlight isn't set up yet" and stays green.
- `ios/App/App/PrivacyInfo.xcprivacy` (privacy manifest Apple asks for) and `ITSAppUsesNonExemptEncryption = NO`
  in `Info.plist` (so TestFlight doesn't ask the encryption question for every build).

## Status

Set up on Nov 8, 2026: team `H739SB5FKP`, bundle ID `com.antwnakys.dash.app` (the free team kept
`com.antwnakys.dash`), app "dash – Antonis", the four secrets set, tester group `Me`. Nothing left to do; the steps
below are kept for reference (e.g. a new API key).

## One-time setup

The steps marked **(you)** happen in a browser or on the phone. A Claude session on the Mac can do the rest.

1. **(you)** Join the Apple Developer Program at https://developer.apple.com/programs/enroll/ with your Apple ID.
   Apple can take up to two days to approve it.
2. **(you)** On the Mac: Xcode → Settings → Accounts → **+** → Apple ID, and sign in with the same Apple ID.
3. **Team ID**: https://developer.apple.com/account → Membership details → Team ID (10 characters).
4. **App ID**: https://developer.apple.com/account/resources/identifiers → **+** → App IDs → App →
   Description `dash`, Bundle ID *Explicit* `com.antwnakys.dash` → Continue → Register.
   (Running `scripts/testflight.sh` on the Mac once also registers it.)
   If Apple says the ID isn't available, the free team still holds it: use `com.antwnakys.dash.app` instead,
   change `PRODUCT_BUNDLE_IDENTIFIER` in `ios/App/App.xcodeproj/project.pbxproj` and `appId` in
   `capacitor.config.ts`, and make a new iOS OAuth client for that bundle ID in Google Cloud (its client ID goes in
   `src/config.ts`, its reversed client ID in the URL scheme in `Info.plist`). In practice the old iOS client kept
   working with the new bundle ID, so no new Google client was needed.
5. **(you)** **The app record**: https://appstoreconnect.apple.com → Apps → **+** → New App → iOS, Name
   `dash – Antonis` (names must be unique on the App Store; the home screen still says "dash"), language English,
   Bundle ID `com.antwnakys.dash.app`, SKU `dash`, Full Access → Create.
6. **(you)** **API key for GitHub**: App Store Connect → Users and Access → Integrations → App Store Connect API →
   Team Keys → **+** (the first time, "Request Access" first; the agreement box has to be ticked by a person) → Name `GitHub`, Access **Admin** → Generate.
   Note the **Issuer ID** (top of the page) and **Key ID**, and download `AuthKey_<KeyID>.p8`. It downloads only
   once; keep it somewhere safe and never paste it into a chat.
7. **GitHub secrets** (repo → Settings → Secrets and variables → Actions, or with the GitHub CLI on the Mac):

   ```bash
   gh secret set APPLE_TEAM_ID -R antwnakys/dash --body "XXXXXXXXXX"
   gh secret set ASC_KEY_ID    -R antwnakys/dash --body "KEYID12345"
   gh secret set ASC_ISSUER_ID -R antwnakys/dash --body "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   gh secret set ASC_KEY_P8    -R antwnakys/dash < ~/Downloads/AuthKey_KEYID12345.p8
   ```

8. **First build**: GitHub → Actions → TestFlight → Run workflow (or `gh workflow run testflight.yml -R antwnakys/dash`).
   About 15 minutes on GitHub, then 10–20 minutes of processing at Apple.
9. **(you)** **Tester**: internal testers must be App Store Connect users. If your iPhone's Apple ID isn't the account
   holder's, add it first: Users and Access → People → **+** (role Developer, app access: dash only) and accept the
   emailed invite. Then the app → TestFlight → Internal Testing → **+** → group `Me`, tick
   "Enable automatic distribution", add yourself.
10. **(you)** **iPhone**: install **TestFlight** from the App Store, sign in with the same Apple ID, open the
    invite (email or the TestFlight app) → Install. In TestFlight → dash → turn on **Automatic Updates**.
    The TestFlight app has a different bundle ID, so it installs next to the old Xcode copy; delete the old one
    once the new one shows your data. Your data comes back after you sign in
    with Google in Settings (it lives in Drive sync); check the old app says it's synced before deleting it.

## If the GitHub upload fails

- "No suitable application records": step 5 hasn't been done, or the bundle ID differs.
- "The bundle version must be higher": a build with a newer number exists; the script numbers builds by UTC date
  and time (`20261107.1530`), so just run it again.
- Signing errors: the API key must have the **Admin** role (cloud signing needs it). The script first tries an
  unsigned archive signed in the cloud while exporting, then falls back to a normal signed archive.
- Missing compliance or privacy warnings arrive by email from App Store Connect; add what they name to
  `Info.plist` / `PrivacyInfo.xcprivacy`.
