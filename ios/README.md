# FocusLine iOS — Live Activity scaffold

This folder is **source code, not an Xcode project**. iOS Live Activities require an Xcode-managed app target plus a Widget Extension target. You need to do a small one-time setup in Xcode, then drop these files in.

## Why it has to be set up in Xcode

ActivityKit (the Live Activity / Dynamic Island API) only links from a *Widget Extension* target, with `NSSupportsLiveActivities = true` declared in the **app's** Info.plist and the matching attribute type defined in code shared between the app and the extension. There is no way to scaffold this purely from text files — Xcode has to generate the entitlements, signing, and build phases. The Swift sources below are everything else.

## One-time setup

1. **Create the iOS app.** In Xcode: File → New → Project → iOS → App. Product name: `FocusLine`. Interface: SwiftUI. Language: Swift. Bundle identifier: pick anything you own.
2. **Add the Widget Extension.** In the project navigator, click the project → File → New → Target → Widget Extension. Name it `FocusLineWidget`. Check **"Include Live Activity"**. Embed it in the FocusLine app target when prompted.
3. **Enable Live Activities** on the app target: Info tab → add a row `NSSupportsLiveActivities` = `YES`.
4. **Add a shared file group** that both targets reference: drag `FocusLineActivityAttributes.swift` into the project; in the file inspector check both **FocusLine** and **FocusLineWidget** targets. (Live Activity attributes must be visible to both.)
5. **Drop the source files** below into the matching targets:

| File | Target |
|---|---|
| [`FocusLineApp.swift`](FocusLineApp.swift) | FocusLine (app) |
| [`ContentView.swift`](ContentView.swift) | FocusLine (app) |
| [`TimerStore.swift`](TimerStore.swift) | FocusLine (app) |
| [`CycleBar.swift`](CycleBar.swift) | FocusLine (app) — shared with macOS |
| [`FocusLineActivityAttributes.swift`](FocusLineActivityAttributes.swift) | **Both** (app + widget) |
| [`FocusLineWidgetBundle.swift`](FocusLineWidgetBundle.swift) | FocusLineWidget |
| [`FocusLineLiveActivity.swift`](FocusLineLiveActivity.swift) | FocusLineWidget |
| [`SmallWidget.swift`](SmallWidget.swift) | FocusLineWidget |
| [`MediumWidget.swift`](MediumWidget.swift) | FocusLineWidget |

6. **Add the color assets.** `ContentView.swift` references `Color(.paper)`, `Color(.paper2)`, `Color(.rule)`, and `Color(.ink600)` — these resolve via xcassets (iOS 17+ ColorResource). In Assets.xcassets create:

   | Name | Hex |
   |---|---|
   | Paper | `#FAFAF7` |
   | Paper2 | `#F2F1EA` |
   | Rule | `#E7E6DF` |
   | Ink600 | `#6E6E68` |

   Set each to **sRGB**, **Universal**, with the same hex for both Any Appearance and Dark Appearance (the app pins itself to light via `.preferredColorScheme(.light)`).

7. **Build and run** on a real device (Live Activities don't show up on the simulator's Dynamic Island reliably — the lock-screen variant works on simulator).

## What you get

- A SwiftUI iOS app with the same simple UI as the macOS app — pick a duration, start, see the line fill, end with a notification.
- A **Live Activity** that pins to the lock screen and Dynamic Island for the entire focus block.
  - Compact / minimal / expanded Dynamic Island presentations
  - Lock-screen card with the FocusLine ambient line as the centerpiece
- An `ActivityAttributes` model carrying the session’s phase, intention, color, and start/end timestamps so the widget can render itself.

## What's intentionally not here

- Background updates via push (`ActivityKit` push). For a focus timer you don't need them — the system renders the countdown locally using `Date.now.timer(...)` style views.
- iCloud sync, account creation, or any server.

## Migrating the web app's settings

The iOS app uses `@AppStorage` keys that mirror the web app:
- `focusline.color`, `focusline.thickness`
- `focusline.workMinutes`, `focusline.shortBreakMinutes`, `focusline.longBreakMinutes`
- `focusline.pomodoroMode`

If you later add CloudKit-backed `NSUbiquitousKeyValueStore`, you can share settings across devices for free.

---

When you're ready to publish, add a real app icon, set the bundle ID, register an App Store Connect record, and submit. The Live Activity is the killer feature here — it's the closest a phone can get to the ambient line.
