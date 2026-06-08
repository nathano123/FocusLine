// OnboardingFlow.tsx
// 4-step intro shown to first-time visitors of /app. Gated by
// localStorage.focusline:onboarded. Mounts unconditionally; renders nothing
// when the flag is set. Steps:
//   1. Welcome — brand mark + headline + "Get started"
//   2. Pick the line — live preview + color + thickness pickers
//   3. Pomodoro? — toggle + minute steppers
//   4. Notifications & DND — request permission, link to DND helper, finish
//
// All copy / spacing is taken from WebOnboarding artboard.

import { useEffect, useRef, useState } from 'react'
import { track } from '../lib/track'

const COLORS: { name: string; value: string }[] = [
  { name: 'Tomato', value: 'oklch(0.66 0.21 28)' },
  { name: 'Cobalt', value: 'oklch(0.66 0.18 250)' },
  { name: 'Spring', value: 'oklch(0.72 0.17 145)' },
  { name: 'Amber', value: 'oklch(0.78 0.16 80)' },
  { name: 'Violet', value: 'oklch(0.62 0.22 310)' },
  { name: 'Pink', value: 'oklch(0.74 0.18 5)' },
  { name: 'Graphite', value: 'oklch(0.20 0.01 80)' },
]
const THICKNESSES = [
  { name: 'Hair', px: 1 },
  { name: 'Thin', px: 2 },
  { name: 'Med', px: 4 },
  { name: 'Bold', px: 7 },
  { name: 'Slab', px: 12 },
]

const STORAGE_KEY = 'focusline:onboarded'
const SETTINGS_KEY = 'focusline:settings'

export function OnboardingFlow() {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  })
  const [step, setStep] = useState(0)
  const [color, setColor] = useState(COLORS[0].value)
  const [thickness, setThickness] = useState(THICKNESSES[2].px)
  const [pomodoro, setPomodoro] = useState(false)
  const [workMin, setWorkMin] = useState(25)
  const [shortBreakMin, setShortBreakMin] = useState(5)
  const [longBreakMin, setLongBreakMin] = useState(15)
  const [notifGranted, setNotifGranted] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof Notification !== 'undefined') setNotifGranted(Notification.permission)
  }, [])

  if (!open) return null

  const finish = () => {
    // Merge into existing settings so we don't clobber things the user changed later.
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      const prev = raw ? JSON.parse(raw) : {}
      const next = {
        ...prev,
        color,
        thickness,
        pomodoroMode: pomodoro,
        workMinutes: workMin,
        shortBreakMinutes: shortBreakMin,
        longBreakMinutes: longBreakMin,
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    } catch { /* ignore */ }
    localStorage.setItem(STORAGE_KEY, 'true')
    track('onboarding_completed', { pomodoro, notif_granted: notifGranted === 'granted' })
    setOpen(false)
    // Reload so TimerApp picks up the new settings via useLocalState's lazy init.
    // (useLocalState reads localStorage on first render only.)
    window.location.reload()
  }

  const skip = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    track('onboarding_skipped', { last_step: step })
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to FocusLine"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/40 px-6 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[18px] border border-rule bg-paper shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]">
        {/* Top progress strip */}
        <div className="absolute left-0 right-0 top-0 flex h-1 gap-[3px] px-[3px] pt-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="flex-1 rounded-full"
              style={{ background: i <= step ? color : 'rgba(0,0,0,0.08)' }}
            />
          ))}
        </div>

        <div className="px-8 pb-7 pt-12">
          {step === 0 && <StepWelcome onNext={() => setStep(1)} onSkip={skip} accent={color} />}
          {step === 1 && (
            <StepLine
              color={color}
              thickness={thickness}
              onColor={setColor}
              onThickness={setThickness}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
              onSkip={skip}
            />
          )}
          {step === 2 && (
            <StepPomodoro
              enabled={pomodoro}
              workMin={workMin}
              shortBreakMin={shortBreakMin}
              longBreakMin={longBreakMin}
              onEnabled={setPomodoro}
              onWork={setWorkMin}
              onShort={setShortBreakMin}
              onLong={setLongBreakMin}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              onSkip={skip}
            />
          )}
          {step === 3 && (
            <StepNotifications
              notifGranted={notifGranted}
              onRequest={async () => {
                if (typeof Notification === 'undefined') return
                try {
                  const r = await Notification.requestPermission()
                  setNotifGranted(r)
                } catch { /* ignore */ }
              }}
              onBack={() => setStep(2)}
              onFinish={finish}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Steps ───────────────────────────────────────────────────────────────────

function StepWelcome({ onNext, onSkip, accent }: { onNext: () => void; onSkip: () => void; accent: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto inline-block">
        <BrandMark size={48} color={accent} />
      </div>
      <h2 className="mt-6 text-balance text-[36px] font-medium leading-[1.0] tracking-tight text-ink-950">
        Focus without<br />
        <em className="not-italic" style={{ color: accent }}>watching the clock.</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[40ch] text-[15px] leading-snug text-ink-700">
        A thin line at the edge of your screen fills as time elapses. You sense the progress —
        you don't stare at it.
      </p>
      <div className="mt-7 flex items-center justify-center gap-3">
        <button onClick={onNext} className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-sm font-medium text-white">
          Get started <ArrowRight />
        </button>
        <button onClick={onSkip} className="font-mono text-[11px] uppercase tracking-widest text-ink-600 hover:text-ink-900">
          Skip intro
        </button>
      </div>
    </div>
  )
}

function StepLine({
  color, thickness, onColor, onThickness, onBack, onNext, onSkip,
}: {
  color: string
  thickness: number
  onColor: (v: string) => void
  onThickness: (v: number) => void
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}) {
  // Live looping preview
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const cycle = 12_000
      let p = ((now - start) % cycle) / cycle
      if (p > 0.93) p = 0.93 + (1 - 0.93) * Math.min(1, (p - 0.93) / 0.04)
      if (ref.current) ref.current.style.width = `${(p * 100).toFixed(2)}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div>
      <Eyebrow num="02">Pick the line</Eyebrow>
      <h2 className="mt-3 text-[28px] font-medium leading-[1.05] tracking-tight text-ink-950">
        Choose a color and thickness.
      </h2>
      <p className="mt-2 text-[14px] text-ink-700">You'll see this every working day. Pick something you stop noticing.</p>

      {/* Preview window */}
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-rule bg-[#0F0F0E] p-5">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10" style={{ height: thickness }}>
          <div ref={ref} className="h-full" style={{ width: 0, background: color, boxShadow: `0 0 12px ${color}88` }} />
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-1.5 w-[80%] rounded bg-white/10" />
          <div className="h-1.5 w-[70%] rounded bg-white/10" />
          <div className="h-1.5 w-[50%] rounded bg-white/10" />
        </div>
      </div>

      {/* Color */}
      <div className="mt-6">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">Color</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => onColor(c.value)}
              aria-label={c.name}
              className={`h-9 w-9 rounded-full border-2 p-[3px] transition hover:scale-105 ${color === c.value ? 'border-ink-950' : 'border-transparent'}`}
            >
              <span className="block h-full w-full rounded-full" style={{ background: c.value }} />
            </button>
          ))}
        </div>
      </div>

      {/* Thickness */}
      <div className="mt-5">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">Thickness</div>
        <div className="mt-2 flex gap-2">
          {THICKNESSES.map((t) => (
            <button
              key={t.name}
              onClick={() => onThickness(t.px)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-lg border bg-white px-2 py-3 text-sm transition ${
                thickness === t.px ? 'border-ink-950' : 'border-rule hover:border-ink-600'
              }`}
            >
              <span className="block w-6 rounded-[2px]" style={{ height: t.px, background: color }} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-600">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <FooterRow onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </div>
  )
}

function StepPomodoro({
  enabled, workMin, shortBreakMin, longBreakMin,
  onEnabled, onWork, onShort, onLong,
  onBack, onNext, onSkip,
}: {
  enabled: boolean
  workMin: number
  shortBreakMin: number
  longBreakMin: number
  onEnabled: (v: boolean) => void
  onWork: (v: number) => void
  onShort: (v: number) => void
  onLong: (v: number) => void
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div>
      <Eyebrow num="03">Pomodoro cycle</Eyebrow>
      <h2 className="mt-3 text-[28px] font-medium leading-[1.05] tracking-tight text-ink-950">
        Want breaks built in?
      </h2>
      <p className="mt-2 text-[14px] text-ink-700">
        Work blocks chain into short breaks, then a longer break. You can change these any time.
      </p>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-rule bg-white px-4 py-3">
        <div>
          <div className="text-[14px] font-medium text-ink-900">Enable Pomodoro</div>
          <div className="text-[12px] text-ink-600">Auto-advance work → break → work.</div>
        </div>
        <Toggle checked={enabled} onChange={onEnabled} />
      </div>

      <div className={`mt-4 grid grid-cols-3 gap-3 ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
        <NumberCard label="Work" value={workMin} onChange={onWork} />
        <NumberCard label="Short break" value={shortBreakMin} onChange={onShort} />
        <NumberCard label="Long break" value={longBreakMin} onChange={onLong} />
      </div>

      <FooterRow onBack={onBack} onNext={onNext} onSkip={onSkip} nextLabel={enabled ? 'Continue' : 'Skip'} />
    </div>
  )
}

function StepNotifications({
  notifGranted, onRequest, onBack, onFinish,
}: {
  notifGranted: NotificationPermission
  onRequest: () => void
  onBack: () => void
  onFinish: () => void
}) {
  return (
    <div>
      <Eyebrow num="04">Notifications &amp; DND</Eyebrow>
      <h2 className="mt-3 text-[28px] font-medium leading-[1.05] tracking-tight text-ink-950">
        We'll only ping when a block finishes.
      </h2>
      <p className="mt-2 text-[14px] text-ink-700">
        One soft chime + a notification, then silence. You can always mute either later.
      </p>

      <div className="mt-6 rounded-2xl border border-rule bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-medium text-ink-900">Browser notifications</div>
            <div className="text-[12px] text-ink-600">Used when a session ends.</div>
          </div>
          {notifGranted === 'granted' ? (
            <span className="rounded-full bg-paper-2 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-700">Granted</span>
          ) : notifGranted === 'denied' ? (
            <span className="rounded-full bg-paper-2 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-700">Blocked</span>
          ) : (
            <button onClick={onRequest} className="rounded-full bg-ink-950 px-3.5 py-1.5 text-[13px] font-medium text-white">
              Enable
            </button>
          )}
        </div>
        <div className="mt-3 border-t border-rule pt-3 text-[12px] text-ink-600">
          Want to silence other apps during a focus block? Set up a one-tap Do Not Disturb shortcut on your OS — FocusLine will remind you when a block starts. You can configure this in <span className="text-ink-900">Settings → DND</span>.
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button onClick={onBack} className="font-mono text-[11px] uppercase tracking-widest text-ink-600 hover:text-ink-900">
          ← Back
        </button>
        <button onClick={onFinish} className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-sm font-medium text-white">
          Finish <ArrowRight />
        </button>
      </div>
    </div>
  )
}

// ── Small atoms ─────────────────────────────────────────────────────────────

function FooterRow({
  onBack, onNext, onSkip, nextLabel = 'Continue',
}: { onBack: () => void; onNext: () => void; onSkip: () => void; nextLabel?: string }) {
  return (
    <div className="mt-7 flex items-center justify-between">
      <button onClick={onBack} className="font-mono text-[11px] uppercase tracking-widest text-ink-600 hover:text-ink-900">
        ← Back
      </button>
      <div className="flex items-center gap-3">
        <button onClick={onSkip} className="font-mono text-[11px] uppercase tracking-widest text-ink-600 hover:text-ink-900">
          Skip intro
        </button>
        <button onClick={onNext} className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white">
          {nextLabel} <ArrowRight />
        </button>
      </div>
    </div>
  )
}

function Eyebrow({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-widest text-ink-600">
      <span className="h-px w-6 bg-ink-600 opacity-70" />
      <span style={{ color: 'var(--accent)' }}>{num}</span>
      <span>{children}</span>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BrandMark({ size = 22, color = 'oklch(0.66 0.21 28)' }: { size?: number; color?: string }) {
  return (
    <div
      className="relative inline-grid place-items-center overflow-hidden bg-ink-950"
      style={{ width: size, height: size, borderRadius: size * 0.27 }}
    >
      <span
        className="absolute"
        style={{
          left: size * 0.14,
          top: size * 0.41,
          height: Math.max(2, size * 0.09),
          width: size * 0.72 * 0.85,
          background: color,
          borderRadius: 2,
        }}
      />
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${checked ? 'bg-ink-950' : 'bg-ink-300'}`}
      aria-pressed={checked}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

function NumberCard({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-2xl border border-rule bg-white px-3 py-3">
      <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-600">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <input
          type="number" min={1} max={600}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(Math.max(1, Math.min(600, n)))
          }}
          className="w-full bg-transparent text-xl font-medium tabular-nums text-ink-950 focus:outline-none"
        />
        <span className="text-xs text-ink-500">min</span>
      </div>
    </label>
  )
}
