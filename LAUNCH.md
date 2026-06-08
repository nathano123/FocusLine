# FocusLine launch checklist

What you actually have to do to ship tomorrow. Sequencing matters — do these in order.

## What we'll ship

| Surface | Distribution | Effort |
|---|---|---|
| **Web app + landing page** (PWA) | `focusline.app` (Vercel) | 5 min |
| **macOS desktop** | `FocusLine.dmg` on GitHub Releases | 30 min (mostly Rust build wait) |
| **Windows desktop** | `FocusLine.msi` on GitHub Releases | Same — built by GitHub Actions |
| **Linux desktop** | `FocusLine.deb` + `.AppImage` on Releases | Same |
| **iOS** | Skip for launch — App Store review is 1–3 days | Re-visit next week |

Everything is one codebase (`web/`) wrapped three ways. Same PostHog tracking on every surface.

---

## T-minus 60 minutes — ship the web

### 1. Push the latest code

```bash
cd ~/focusline
git add .
git commit -m "Launch v1.0.0"
git push
```

### 2. Connect to Vercel

1. Go to <https://vercel.com/new>
2. Click **Import Git Repository** → pick `nathano123/FocusLine`
3. **Framework**: Vite — should auto-detect from `vercel.json`
4. **Root Directory**: leave at `./` (the `vercel.json` handles routing into `web/`)
5. **Environment variables** — add two:
   - `VITE_POSTHOG_KEY` = `phc_kkzNz2i5x6XVcsXSQToBMExwWFJEUe7G58fJhqwsKsGu`
   - `VITE_POSTHOG_HOST` = `https://eu.i.posthog.com`
6. Click **Deploy**

In ~60 seconds you get `focus-line-xxxx.vercel.app`. Open it, click around — PostHog events fire from production immediately.

### 3. (Optional) Custom domain — 10 minutes

1. Buy a domain (Porkbun / Cloudflare Registrar). Suggested: `focusline.app` (~$15/yr).
2. Vercel → your project → **Settings → Domains → Add Domain**
3. Paste DNS records into your registrar. HTTPS is automatic and free.

---

## T-minus 30 minutes — desktop binaries

### Option A — Let GitHub Actions build them (recommended)

Already wired up at [`.github/workflows/desktop-release.yml`](.github/workflows/desktop-release.yml). To trigger:

1. Set the two PostHog secrets in GitHub:
   - <https://github.com/nathano123/FocusLine/settings/secrets/actions> → **New repository secret**
   - Add `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` (same values as Vercel)
2. Tag and push:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions builds **mac arm64**, **mac x64**, **Windows x64**, and **Linux x64** in parallel (~15 min total)
4. Result: a **draft release** at <https://github.com/nathano123/FocusLine/releases>
5. Edit the release → **Publish release**
6. Your landing page's "Download for macOS" button auto-links to the latest release

### Option B — Build locally for just macOS first (if you have Rust)

If you've got the Rust toolchain installed (`rustup install stable`):

```bash
cd ~/focusline/web
npm run desktop:dev      # dev mode — opens FocusLine in a native window with HMR
npm run desktop:build    # production .dmg + universal binary
```

The `.dmg` lands in `web/src-tauri/target/release/bundle/dmg/`.

---

## What's actually shipping

### Web app (`focusline.app`)
- ✅ Landing page with editorial design (cream/tomato/Geist)
- ✅ Full timer at `/app`: presets, custom durations, Pomodoro cycle bar, day plan with segmented line, weekly heatmap, DND helper, 4-step onboarding
- ✅ Installable PWA (Add to Home Screen on iOS/Android, install icon on Chrome/Edge)
- ✅ PostHog tracking: `app_loaded`, `$pageview`, `launch_app_clicked`, `timer_started`, `timer_completed`, `plan_started`, `onboarding_completed`, `onboarding_skipped` — plus autocaptured clicks and session recording
- ✅ Privacy: intention text and task titles never leave the device (only `has_intention`/`*_length`)

### Desktop apps (Win/Mac/Linux via Tauri)
- ✅ Same web app, wrapped as a ~5 MB native binary
- ✅ Native title-bar styling per OS
- ✅ Same PostHog tracking (no extra wiring — the script tag works in WebView too)
- ✅ Works offline (the PWA service worker still works inside the Tauri WebView)

### iOS (deferred)
- 🟠 Source files complete in `ios/`. Xcode project setup left.
- Reason to skip launch: App Store review is **1–3 business days minimum**. Better to ship the PWA on iOS and add the native app in v1.1 next week.

---

## Known caveats (be honest about these)

### Unsigned binaries — users will see scary warnings

- **macOS**: "FocusLine cannot be opened because the developer cannot be verified." Users right-click → **Open** the first time. To remove this, you need the [Apple Developer Program](https://developer.apple.com/programs/) ($99/yr) → notarize the `.dmg`.
- **Windows**: "Windows protected your PC. Microsoft Defender SmartScreen prevented an unrecognized app from starting." Users click **More info → Run anyway**. To remove this, you need an [Authenticode code-signing certificate](https://www.digicert.com/code-signing/code-signing-certificates) ($100–400/yr).
- **Linux**: No warnings. Just works.

For a **soft launch** to your immediate audience, unsigned is fine. For Product Hunt / wider launch, get signing sorted within a week.

### PWA install on iOS Safari
- Users get a native-feeling icon on the home screen
- Push notifications need iOS 16.4+ (most users have it)
- No App Store discoverability — that's the trade-off vs the native app you'll ship in v1.1

---

## Marketing day-of

1. **Product Hunt** — submit night before (PH posts at midnight PT)
2. **Hacker News** — link to `focusline.app` (the landing page), not the GitHub repo
3. **Twitter / X** — record a 15-second video of the line filling on your screen. The video sells the product more than any copy could.
4. **Personal post** — your network is your strongest signal; a single thoughtful share to your direct contacts beats any of the above.

PostHog will show you exactly what's working. The **`launch_app_clicked`** funnel split by `source` (`nav` vs `hero` vs `plan_section` vs `download_section`) tells you which section of the landing page actually drives the action.

---

## After launch (week 1)

1. **Apple Developer Program** ($99/yr) → sign + notarize the `.dmg`, plus prep iOS for review
2. **Windows code-signing cert** ($100/yr) → eliminate SmartScreen warnings
3. **iOS App Store submission** — bundle the existing `ios/` sources into TestFlight first
4. **Per-feature retention** in PostHog — segment by `pomodoro_mode` and `color` super-properties to see who returns
5. **A real changelog** — write what you actually shipped, publish at `focusline.app/changelog`

---

## Tomorrow at 9am, in 30 minutes flat

1. Connect Vercel (5 min)
2. Push the v1.0.0 tag (1 min)
3. Wait for GitHub Actions desktop builds (~15 min — go make coffee)
4. Publish the draft release (1 min)
5. Tweet the screen recording
6. Post on Product Hunt and HN

You're live.
