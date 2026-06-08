# FocusLine event taxonomy

Every event tracked by the web app + landing page. Same PostHog project covers both.

## Privacy contract

We **never** send raw user content. The following are explicitly masked / lengthened:

- The intention field text → only `has_intention` (bool) or `*_length` (int)
- Task titles → only `task_title_length` (int)
- Meeting summaries (when re-added) → only `summary_length`
- Calendar URLs → never sent
- Session recording masks all `<input>` and any element with `[data-ph-mask]`

## Super properties (attached to every event)

Stamped automatically once the user opens `/app`:

| Property | From |
|---|---|
| `color` | settings.color (oklch string) |
| `thickness` | settings.thickness (px) |
| `pomodoro_mode` | settings.pomodoroMode |
| `sound_enabled` | settings.soundOn |
| `dnd_reminder_enabled` | settings.dndReminder |
| `work_minutes` | settings.workMinutes |
| `short_break_minutes` | settings.shortBreakMinutes |
| `long_break_minutes` | settings.longBreakMinutes |
| `cycles_before_long_break` | settings.cyclesBeforeLongBreak |

## User properties

Set once on first visit:

| Property | Source |
|---|---|
| `first_seen_at` | ISO timestamp |
| `first_seen_referrer` | `document.referrer` |
| `first_seen_path` | landing or app |
| `first_seen_app_version` | hard-coded `'1.0.0'` |

Updated on every load:

| Property | Source |
|---|---|
| `last_seen_at` | ISO timestamp |
| `app_version` | `'1.0.0'` |
| `display_mode` | `'pwa'` if installed, else `'browser'` |
| `screen_width / height` | `screen.{width,height}` |
| `viewport_width / height` | `innerWidth / innerHeight` |
| `language` | `navigator.language` |
| `timezone` | resolved IANA tz |
| `preferred_color`, `preferred_thickness`, `pomodoro_user` | mirrors super props |

---

## Lifecycle

| Event | Where | Properties |
|---|---|---|
| `$pageview` | Every route change | `path`, `$current_url` |
| `app_loaded` | Once per SPA boot | `path`, `display_mode`, `referrer` |
| `tab_hidden` | Tab loses visibility | `visible_ms` |
| `tab_visible` | Tab regains visibility | – |
| `$exception` | Uncaught error / unhandled rejection | `source`, `filename`, `lineno`, `colno` |
| `pwa_install_prompted` | `beforeinstallprompt` fires | `platforms` |
| `pwa_installed` | `appinstalled` fires | – |

## Landing (`/`)

| Event | Trigger | Properties |
|---|---|---|
| `landing_section_viewed` | Section scrolled into 40% viewport (once per section per session) | `section`: `why` / `customize` / `plan` / `features` / `download` |
| `launch_app_clicked` | Any "Launch app" CTA | `source`: `nav` / `hero` / `plan_section` / `customizer` / `download_section` |
| `landing_customizer_changed` | Color / thickness / duration picker click | `field`, `value` |
| `landing_customizer_play_toggled` | Play/pause in customizer preview | `now_running` |
| `landing_customizer_reset_clicked` | Reset in customizer preview | – |

## Onboarding (first `/app` visit)

| Event | Trigger | Properties |
|---|---|---|
| `onboarding_started` | First render of the modal | – |
| `onboarding_step_viewed` | Every time `step` advances or initial | `step` (0–3), `name`: `welcome` / `line` / `pomodoro` / `notifications` |
| `onboarding_skipped` | Skip button at any step | `last_step` |
| `onboarding_completed` | Finish on step 4 | `pomodoro`, `notif_granted` |

## Timer

| Event | Trigger | Properties |
|---|---|---|
| `timer_started` | Any preset / custom / Pomodoro start | `phase`, `minutes`, `has_intention`, `pomodoro_mode` |
| `timer_paused` | Pause button or `Space` | `source`: `mouse` / `keyboard`, `phase`, `minutes_elapsed` |
| `timer_resumed` | Resume button or `Space` | `source`, `phase`, `minutes_elapsed` |
| `timer_reset` | Reset button or `R` or Cancel | `source`, `phase`, `minutes_elapsed` |
| `timer_cancelled` | Keyboard `R` cancel during run | `source: 'keyboard'`, `phase` |
| `timer_completed` | Timer reaches zero | `phase`, `minutes`, `pomodoro_mode` |
| `preset_clicked` | Preset button or `1`–`4` | `source`, `minutes` |
| `custom_duration_submitted` | Custom-duration form submit | `minutes` |
| `pomodoro_started_clicked` | "Start Pomodoro" inline button | `minutes` |
| `fullscreen_toggled` | `F` key | `source`, `entering` |

## Day plan

| Event | Trigger | Properties |
|---|---|---|
| `plan_task_added` | New task form submit | `estimated_minutes` |
| `plan_task_check_toggled` | Checkbox flipped | `done` |
| `plan_task_minutes_changed` | Per-row estimated-minutes input | `minutes` |
| `plan_task_reordered` | Up/down arrow buttons | `direction` |
| `plan_task_removed` | × button | – |
| `plan_task_started_individually` | ▶ button on a specific row | `index` |
| `plan_started` | "Start day plan" button | `task_count`, `total_minutes` |
| `plan_paused` | Pause button while plan runs | – |
| `plan_resumed` | Resume button while plan paused | – |
| `plan_task_completed` | "Finish task" button | `task_title_length`, `estimated_minutes` |
| `plan_task_skipped` | "Skip" button | `task_title_length`, `estimated_minutes` |
| `plan_cancelled` | "End plan" button | `tasks_done`, `tasks_total` |

## Appearance & settings

| Event | Properties |
|---|---|
| `color_changed` | `color` (name) |
| `thickness_changed` | `thickness` (name), `px` |
| `sound_toggled` | `enabled` |
| `pomodoro_mode_toggled` | `enabled` |
| `pomodoro_durations_changed` | `field`: `work` / `short_break` / `long_break`, `minutes` |
| `pomodoro_cycles_changed` | `cycles_before_long_break` |
| `dnd_reminder_toggled` | `enabled` |
| `dnd_helper_expanded` | `expanded` |

## Stats & history

| Event | Properties |
|---|---|
| `stats_viewed` | – |
| `history_cleared` | `sessions_cleared` |

---

## What to build in PostHog with this

A minimal "launch dashboard":

1. **Acquisition funnel**:
   `$pageview path=/` → `launch_app_clicked` → `$pageview path=/app` → `timer_started`

2. **Activation rate**:
   Users who fired `timer_completed` ÷ users who fired `app_loaded` on `/app`.
   Filter to last 7 / 28 days.

3. **Retention**:
   Cohort: first `timer_started`.
   Return: subsequent `timer_started` within N days.
   Built-in PostHog "Retention" insight handles this natively.

4. **Engagement minutes per session**:
   Trend of `tab_visible` − `tab_hidden` pairs aggregated as `visible_ms` sum.

5. **Settings preferences by population**:
   Breakdown of `app_loaded` by super properties `color`, `thickness`, `pomodoro_mode`.

6. **PWA install conversion**:
   `pwa_install_prompted` → `pwa_installed`.

7. **Onboarding completion**:
   `onboarding_completed` ÷ (`onboarding_completed` + `onboarding_skipped`).
   Drop-off by `last_step` shows which step loses people.
