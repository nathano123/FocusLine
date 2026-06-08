<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into FocusLine. PostHog was already partially initialized (`posthog-js` installed, `src/lib/analytics.ts` wrapper in place, `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` configured). Eight new events were added across three files — `TimerApp.tsx`, `MeetingPanel.tsx`, and `TasksPanel.tsx` — supplementing the events that were already tracked. The existing `track()` wrapper is used throughout; no architectural changes were made.

## Events

| Event | Description | File |
|---|---|---|
| `launch_app_clicked` | User clicks any "Launch FocusLine" CTA on the landing page; `source` identifies which CTA | `src/pages/Landing.tsx` |
| `macos_download_clicked` | User clicks the "Download for macOS" link | `src/pages/Landing.tsx` |
| `timer_started` | User starts a focus, short-break, or long-break timer; includes `phase`, `minutes`, `has_intention`, `pomodoro_mode` | `src/pages/TimerApp.tsx` |
| `timer_completed` | A timer finishes naturally; includes `phase`, `minutes` | `src/pages/TimerApp.tsx` |
| `timer_paused` | User pauses a running timer; includes `phase`, `minutes_elapsed` | `src/pages/TimerApp.tsx` |
| `timer_reset` | User resets or cancels a timer; includes `phase`, `minutes_elapsed` | `src/pages/TimerApp.tsx` |
| `timer_resumed` | User resumes a paused timer; includes `phase`, `minutes_elapsed` | `src/pages/TimerApp.tsx` |
| `color_changed` | User changes the line color in Appearance; includes `color` name | `src/pages/TimerApp.tsx` |
| `thickness_changed` | User changes the line thickness in Appearance; includes `thickness` name and `px` | `src/pages/TimerApp.tsx` |
| `pomodoro_mode_toggled` | User toggles Pomodoro mode on or off; includes `enabled` | `src/pages/TimerApp.tsx` |
| `stats_viewed` | User opens the Stats panel | `src/pages/TimerApp.tsx` |
| `fullscreen_toggled` | User enters or exits fullscreen mode; includes `fullscreen` boolean | `src/pages/TimerApp.tsx` |
| `onboarding_completed` | First-time user finishes all 4 onboarding steps; includes `pomodoro`, `notif_granted` | `src/components/OnboardingFlow.tsx` |
| `onboarding_skipped` | First-time user skips the onboarding flow; includes `last_step` | `src/components/OnboardingFlow.tsx` |
| `plan_task_added` | User adds a task to the day plan; includes `estimated_minutes` | `src/components/TasksPanel.tsx` |
| `plan_started` | User starts a day plan; includes `task_count`, `total_minutes` | `src/components/TasksPanel.tsx` |
| `plan_task_completed` | User manually finishes the current task early; includes `task_title` | `src/components/TasksPanel.tsx` |
| `plan_task_skipped` | User skips the current task; includes `task_title` | `src/components/TasksPanel.tsx` |
| `plan_cancelled` | User ends the day plan early; includes `tasks_done`, `tasks_total` | `src/components/TasksPanel.tsx` |
| `plan_all_tasks_completed` | All tasks in the day plan finish automatically; includes `tasks_total` | `src/components/TasksPanel.tsx` |
| `meeting_countdown_configured` | User saves a meeting countdown (ICS feed or manual); includes `mode` | `src/components/MeetingPanel.tsx` |

## Next steps

We've built a dashboard and five insights for you to keep an eye on user behavior:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/195661/dashboard/730552)
- [App launches by source](https://eu.posthog.com/project/195661/insights/1q9ZSnqD) — Which landing page CTA converts best
- [Daily timer sessions](https://eu.posthog.com/project/195661/insights/EpxagJRy) — Unique users starting timers per day
- [Day plan completion rate](https://eu.posthog.com/project/195661/insights/QvOccunt) — % of started plans that finish fully
- [Onboarding: completed vs skipped](https://eu.posthog.com/project/195661/insights/wr4ZLcnu) — First-run experience quality
- [Feature adoption](https://eu.posthog.com/project/195661/insights/fsMJGwAr) — Pomodoro, meeting countdown, color customization uptake

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
