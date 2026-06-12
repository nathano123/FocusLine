# FocusLine

**A focus timer you don't have to look at.** A thin line at the edge of your screen quietly tracks the session — on every device.

Most timers compete for your attention. This one returns it. FocusLine draws a horizontal line at the top of your screen that fills as your session passes. You feel time moving in your peripheral vision without ever breaking out of what you're doing.

This repo contains two implementations of the same idea:

| Version | Path | Runs on | Best for |
| --- | --- | --- | --- |
| **Web app + landing page (PWA)** | [`web/`](web) | Mac, Windows, Linux, iPad, iPhone, Android | Any device, no install needed; installable as a true app via "Add to Home Screen" |
| **Native macOS menubar app** | [`macos/`](macos) | macOS | True menubar status item, always-on-top across every Space, lowest footprint |
| **iOS app + Live Activity** (scaffold) | [`ios/`](ios) | iPhone, iPad | Lock-screen + Dynamic Island countdown — needs Xcode to wire up the targets |

---

## Web app & landing page (`web/`)

A Vite + React + TypeScript + Tailwind PWA. The same site serves both the marketing landing page (`/`) and the timer app (`/app`).

### Run locally

```bash
cd web
npm install
npm run dev
```

Open <http://localhost:5173>.

### Build for production

```bash
npm run build      # generates icons + builds to dist/
npm run preview    # serve the production build
```

The output in `dist/` is a fully static site (HTML/JS/CSS + service worker + manifest) — deploy it to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront, etc).

### Features

- **Ambient progress line** at the top of the viewport (fixed across scroll)
- **Onboarding flow** — 4-step intro for first-time visitors: pick the line, set the rhythm, request notifications. Gated by `localStorage.focusline:onboarded`.
- **Pomodoro cycle bar** — when Pomodoro mode is on, a segmented work / break / long-break rhythm visualization renders under the big countdown, showing where you are in the cycle.
- **Day plan** — load up your day's tasks with estimated minutes; the line becomes your day, segmented and auto-advancing. Big countdown shows time left on the current task; below it: what's next and how much of the day remains.
- **Intention field** — one-line "what are you focusing on?" captured at start, surfaced in history
- **Quick-start presets**: 5 / 15 / 25 / 50 minutes
- **Custom durations** up to 10 hours
- **Pause / resume / cancel** on every running session
- **Pomodoro cycle**: work → short break → long break, with configurable durations and long-break cadence
- **Appearance**: 8 colors, 4 thicknesses, all persisted
- **Today stats** + **12-week heatmap**: completed sessions, total focus time, day streak, GitHub-style activity grid
- **Do Not Disturb helper**: platform-aware setup instructions for macOS Focus, iOS Focus, Android DND, Windows Focus assist, plus a start-of-session reminder banner
- **Local-only storage** — nothing leaves your device, no accounts, no tracking
- **Web Notifications** when sessions end (with optional chime)
- **Drift-free timer** that survives tab throttling (wall-clock based, not setInterval-counted)
- **Keyboard shortcuts**: `Space` pause/resume, `R` reset, `F` fullscreen, `1`–`4` presets
- **Installable PWA**: works offline once cached, installs to home screen on iOS / Android / desktop, with manifest **shortcuts** (long-press the app icon to start a 25-min / 50-min / Pomodoro block instantly)
- **Fullscreen mode** so the line sits at the true screen edge

### Tech notes

- `src/lib/timer.ts` — a wall-clock-based timer engine (no setInterval drift), publishes state to React via subscription
- `src/pages/TimerApp.tsx` — the running app
- `src/pages/Landing.tsx` — the marketing site with platform-aware install instructions
- `scripts/generate-icons.mjs` — renders all PWA / iOS / OG icons from `public/favicon.svg` via `sharp`
- `vite.config.ts` — `vite-plugin-pwa` config (autoUpdate service worker, manifest, offline precaching)

---

## macOS native menubar app (`macos/`)

A small Swift / SwiftUI menubar app. It draws the line as a borderless floating `NSWindow` at the top of every connected display.

### Features

- **Custom-drawn status item** — a small black rounded square containing the line itself, filling as time passes (replaces the SF Symbol `timer` icon)
- **`NSPopover` + SwiftUI dropdown** instead of `NSMenu` — idle state shows intention input, preset grid, day-rhythm bars, inline color + thickness pickers; running state shows big countdown, action buttons, "up next" breadcrumb
- **Tabbed Preferences window** (General · Pomodoro · Appearance · Shortcuts · Focus & DND · About) with a 196-px sidebar
- **Custom-duration sheet** with slider, quick chips, and live "= 0h 42m" hint
- **Intention sheet** with focused field, recent chips, and "↵ start / ⎋ skip" hints
- **Menubar countdown text** (`MM:SS`) beside the custom icon
- **Pause / resume / cancel** from the popover (`⌘P`, `⌘.`)
- **Global hotkey** `⌃⌥⌘F` — start / pause / resume from anywhere
- **Pomodoro cycle** with configurable work/break/long-break durations
- **Do Not Disturb integration** via macOS Shortcuts (`shortcuts run "FocusLine On"` / `"FocusLine Off"`) — create those two Shortcuts once and FocusLine flips Focus for you on every work block
- **Multi-monitor**: a line per display, recreated when screens change
- **Always-on-top, across every Space**, click-through
- **Local notification** when a session ends

### Build

Open `macos/MenuBarTimer.xcodeproj` in Xcode and run. The app uses the `accessory` activation policy (no dock icon).

---

---

## iOS app + Live Activity (`ios/`)

Source code for an iOS app + Widget Extension that puts the FocusLine countdown on the **lock screen** and **Dynamic Island** for the entire session. Live Activities can't be scaffolded without Xcode — see [`ios/README.md`](ios/README.md) for the one-time Xcode setup (create app + widget extension, drop in the files, build to device).

### Features

- **Four-tab layout** (Home / Plan / Stats / Settings) via a floating glass capsule tab bar
- **Pause / resume / cancel** with accurate clock-based progress (no setInterval drift)
- **Pomodoro chaining** — work → short break → work → … → long break, auto-advancing
- **Cycle bar** visualization (shared with macOS via `CycleBar.swift`)
- **Today stats** — sessions, focused-time, streak
- **Small (2 × 2) and Medium (4 × 2) home-screen widgets** plus the Live Activity
- ActivityKit Live Activity with compact / minimal / expanded Dynamic Island presentations
- Lock-screen card showing the ambient line, phase, intention, and countdown
- Light-mode default matching the paper/ink/tomato brand
- Shared `@AppStorage` keys with the macOS app (color, thickness, durations, Pomodoro)
- Local notification scheduled for end-of-session

---

## Why two — well, three — versions?

The web app is the primary product and works on every device from a single codebase. The macOS native version exists because:

- A true `NSStatusItem` is a better fit for macOS than a browser tab
- Floating windows with `.canJoinAllSpaces` behave better than a fullscreen browser
- Memory footprint is ~10 MB vs ~150 MB for any browser-hosted app

Both share the same product idea and visual language.

---

## License

MIT.
