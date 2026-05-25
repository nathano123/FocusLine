import { useEffect, useState } from 'react'

type Platform = 'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown'

function detect(): Platform {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Mac/.test(ua)) return 'mac'
  if (/Win/.test(ua)) return 'windows'
  if (/Linux/.test(ua)) return 'linux'
  return 'unknown'
}

export function DndCard({
  enabled,
  setEnabled,
  expanded,
  setExpanded,
}: {
  enabled: boolean
  setEnabled: (v: boolean) => void
  expanded: boolean
  setExpanded: (v: boolean) => void
}) {
  const [platform, setPlatform] = useState<Platform>('unknown')
  useEffect(() => setPlatform(detect()), [])

  const instructions = instructionsFor(platform)

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow"><span className="num">06</span>Do Not Disturb</h2>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className="flex items-center gap-3 text-sm text-ink-800"
        >
          <span
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${
              enabled ? 'bg-ink-950' : 'bg-ink-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                enabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </span>
          {enabled ? 'Remind me when a session starts' : 'Off'}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-rule bg-white p-4">
        <p className="text-sm text-ink-700">
          Browsers can't toggle your system Do Not Disturb on their own. On every platform there's a one-time
          setup that lets you flip DND with a single tap or keystroke — FocusLine then reminds you to use it
          when a focus block starts.
        </p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink-700 underline-offset-4 hover:text-ink-950 hover:underline"
        >
          {expanded ? 'Hide setup' : `Show setup for ${platformLabel(platform)}`}
        </button>
        {expanded && (
          <div className="mt-4 space-y-3 text-sm text-ink-800">
            <h3 className="m-0 text-base font-medium text-ink-950">{instructions.title}</h3>
            <ol className="space-y-2">
              {instructions.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-2 font-mono text-[10px] text-ink-700">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            {instructions.tip && <p className="font-mono text-[11px] uppercase tracking-widest text-ink-500">{instructions.tip}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

function platformLabel(p: Platform): string {
  return { mac: 'macOS', windows: 'Windows', linux: 'Linux', ios: 'iOS', android: 'Android', unknown: 'your device' }[p]
}

function instructionsFor(p: Platform): { title: string; steps: string[]; tip?: string } {
  switch (p) {
    case 'mac':
      return {
        title: 'macOS Focus',
        steps: [
          'Open Control Center → Focus.',
          'Pick a Focus mode (e.g., “Do Not Disturb”) and assign a keyboard shortcut in System Settings → Keyboard → Keyboard Shortcuts → Mission Control.',
          'When a session starts, press your shortcut. Press it again to turn Focus off after the chime.',
        ],
        tip: 'For full automation, download the native FocusLine macOS app — it can toggle Focus for you via a Shortcuts integration.',
      }
    case 'ios':
      return {
        title: 'iOS Focus',
        steps: [
          'Settings → Focus → Do Not Disturb (or create a “Focus” mode).',
          'Add an automation: Shortcuts app → Automation → Create Personal Automation → Time of Day.',
          'Use the Back Tap accessibility shortcut (Settings → Accessibility → Touch → Back Tap) to toggle Focus with a double-tap on the back of the phone.',
        ],
      }
    case 'android':
      return {
        title: 'Android Do Not Disturb',
        steps: [
          'Open Quick Settings (swipe down twice) and long-press “Do Not Disturb” to configure.',
          'Drag the DND tile to the top of Quick Settings so it’s one swipe away.',
          'Tap it when a session starts; tap it again when the chime sounds.',
        ],
        tip: 'On Pixel and Samsung devices you can also create a Routines/Modes automation that fires on a notification keyword.',
      }
    case 'windows':
      return {
        title: 'Windows Focus / Notifications',
        steps: [
          'Settings → System → Notifications → Do not disturb. Enable it manually, or schedule it.',
          'Pin “Focus assist” to your Action Center for fast toggling (Win + N).',
          'Optional: write a tiny PowerShell script bound to a hotkey via PowerToys Keyboard Manager.',
        ],
      }
    case 'linux':
      return {
        title: 'Linux notifications',
        steps: [
          'GNOME: toggle Notifications via the system menu.',
          'KDE: enable Do Not Disturb in the system tray.',
          'Bind it to a custom keyboard shortcut in your DE’s settings.',
        ],
      }
    default:
      return {
        title: 'Set up a quick DND toggle',
        steps: [
          'Find your OS’s Do Not Disturb setting.',
          'Bind it to a keyboard shortcut or quick-access tile.',
          'Toggle it when FocusLine reminds you.',
        ],
      }
  }
}
