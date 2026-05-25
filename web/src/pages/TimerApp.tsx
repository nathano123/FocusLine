import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalState } from '../lib/storage'
import {
  Phase,
  formatRemaining,
  timerEngine,
  useDocumentTitle,
  useTimerState,
} from '../lib/timer'
import { WeeklyHeatmap } from '../components/WeeklyHeatmap'
import { MeetingPanel } from '../components/MeetingPanel'
import { DndCard } from '../components/DndCard'
import { TasksPanel } from '../components/TasksPanel'
import { DayLine } from '../components/DayLine'
import { CycleBar } from '../components/CycleBar'
import { OnboardingFlow } from '../components/OnboardingFlow'
import { usePlanState, computeProgress } from '../lib/plan'
import type { MeetingSource } from '../lib/meeting'

const COLORS: { name: string; value: string }[] = [
  { name: 'Tomato', value: 'oklch(0.66 0.21 28)' },
  { name: 'Cobalt', value: 'oklch(0.66 0.18 250)' },
  { name: 'Spring', value: 'oklch(0.72 0.17 145)' },
  { name: 'Amber', value: 'oklch(0.78 0.16 80)' },
  { name: 'Violet', value: 'oklch(0.62 0.22 310)' },
  { name: 'Graphite', value: 'oklch(0.20 0.01 80)' },
]

const THICKNESSES: { name: string; value: number }[] = [
  { name: 'Thin', value: 2 },
  { name: 'Med', value: 4 },
  { name: 'Bold', value: 7 },
  { name: 'Slab', value: 12 },
]

const PRESETS = [5, 15, 25, 50]

type Settings = {
  color: string
  thickness: number
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
  pomodoroMode: boolean
  soundOn: boolean
  dndReminder: boolean
}

const DEFAULT_SETTINGS: Settings = {
  color: COLORS[0].value,
  thickness: THICKNESSES[1].value,
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  pomodoroMode: false,
  soundOn: true,
  dndReminder: true,
}

type SessionRecord = {
  id: string
  phase: Phase
  startedAt: number
  durationMs: number
  completed: boolean
  intention?: string
}

export function TimerApp({ onExit }: { onExit: () => void }) {
  const state = useTimerState()
  useDocumentTitle(state)
  const plan = usePlanState()

  const [settings, setSettings] = useLocalState<Settings>('focusline:settings', DEFAULT_SETTINGS)
  const [history, setHistory] = useLocalState<SessionRecord[]>('focusline:history', [])
  const [cycleCount, setCycleCount] = useLocalState<number>('focusline:cycle', 0)
  const [meetingSource, setMeetingSource] = useLocalState<MeetingSource>('focusline:meeting', { kind: 'none' })
  const [dndExpanded, setDndExpanded] = useLocalState<boolean>('focusline:dndExpanded', false)
  const [showStats, setShowStats] = useState(false)
  const [intention, setIntention] = useState('')
  const [dndBanner, setDndBanner] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Drive accent CSS variable so global styling picks it up
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.color)
  }, [settings.color])

  // Tick for plan progress display
  useEffect(() => {
    if (plan.activeIndex === null || plan.paused) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [plan.activeIndex, plan.paused])

  // Notifications
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // PWA shortcut params (/app?start=25, /app?start=pomodoro)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const start = params.get('start')
    if (!start) return
    if (start === 'pomodoro') {
      setSettings((s) => ({ ...s, pomodoroMode: true }))
      timerEngine.start('work', settings.workMinutes * 60_000)
    } else {
      const m = Number(start)
      if (m > 0 && m <= 600) timerEngine.start('work', m * 60_000)
    }
    window.history.replaceState({}, '', '/app')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const playChime = useCallback(() => {
    if (!settings.soundOn) return
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(880, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.6)
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9)
      o.start(); o.stop(ctx.currentTime + 0.95)
    } catch { /* audio blocked */ }
  }, [settings.soundOn])

  const notify = useCallback((title: string, body: string) => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      try { new Notification(title, { body, silent: !settings.soundOn }) } catch {/**/}
    }
  }, [settings.soundOn])

  const startPhase = useCallback(
    (phase: Phase, minutes: number, intentionText?: string) => {
      timerEngine.start(phase, minutes * 60_000)
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          phase,
          startedAt: Date.now(),
          durationMs: minutes * 60_000,
          completed: false,
          intention: phase === 'work' && intentionText ? intentionText.trim() || undefined : undefined,
        },
        ...prev.slice(0, 199),
      ])
      if (phase === 'work' && settings.dndReminder) {
        setDndBanner(true)
        window.setTimeout(() => setDndBanner(false), 6000)
      }
    },
    [setHistory, settings.dndReminder]
  )

  const startWork = useCallback(
    (minutes: number) => { startPhase('work', minutes, intention); setIntention('') },
    [startPhase, intention]
  )

  const startCustom = useCallback(
    (minutes: number) => { if (Number.isFinite(minutes) && minutes > 0) startWork(minutes) },
    [startWork]
  )

  useEffect(() => {
    const handler = () => {
      const finished = timerEngine.getState()
      setHistory((prev) => {
        const [head, ...tail] = prev
        if (!head) return prev
        return [{ ...head, completed: true }, ...tail]
      })
      if (finished.phase === 'work') {
        playChime()
        if (settings.pomodoroMode) {
          const nextCycle = cycleCount + 1
          setCycleCount(nextCycle)
          const isLong = nextCycle % settings.cyclesBeforeLongBreak === 0
          const phase: Phase = isLong ? 'long-break' : 'short-break'
          const mins = isLong ? settings.longBreakMinutes : settings.shortBreakMinutes
          notify('Work block complete', `Starting a ${mins}-minute ${isLong ? 'long break' : 'break'}.`)
          setTimeout(() => startPhase(phase, mins), 400)
        } else {
          notify('Time’s up', 'Your focus session is complete.')
        }
      } else if (finished.phase === 'short-break' || finished.phase === 'long-break') {
        playChime()
        notify('Break complete', 'Ready for another focus block?')
      }
    }
    timerEngine.setOnComplete(handler)
    return () => timerEngine.setOnComplete(null)
  }, [cycleCount, settings, notify, playChime, setCycleCount, setHistory, startPhase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (e.key === ' ') {
        e.preventDefault()
        if (state.phase === 'idle') return
        state.running ? timerEngine.pause() : timerEngine.resume()
      } else if (e.key === 'r' || e.key === 'R') {
        timerEngine.reset()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      } else if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1
        startWork(PRESETS[idx])
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, startWork])

  // ── Decide what the ambient line is doing right now ─────────────────────
  // Priority: plan running > single timer running > idle
  const planRunning = plan.activeIndex !== null
  const planProgress = useMemo(() => computeProgress(plan, now), [plan, now])

  // Single-timer progress
  const timerProgress = state.total > 0 ? Math.min(1, state.elapsed / state.total) : 0
  const remaining = Math.max(0, state.total - state.elapsed)

  const todayStats = useMemo(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startMs = startOfDay.getTime()
    const today = history.filter((h) => h.startedAt >= startMs)
    const work = today.filter((h) => h.phase === 'work')
    const focusMs = work.reduce((acc, h) => acc + (h.completed ? h.durationMs : 0), 0)
    return {
      sessions: work.filter((h) => h.completed).length,
      focusMinutes: Math.round(focusMs / 60_000),
      streak: computeStreak(history),
    }
  }, [history])

  return (
    <div className="relative min-h-full bg-paper text-ink-900">
      <OnboardingFlow />
      {/* The ambient line — fixed at the top. In plan mode, it's a segmented day-line. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50"
        style={{ height: settings.thickness, background: '#E7E6DF' }}
        aria-hidden
      >
        {planRunning ? (
          <DayLine state={plan} accent={settings.color} thickness={settings.thickness} nowMs={now} />
        ) : (
          <div
            className="h-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${timerProgress * 100}%`,
              backgroundColor: settings.color,
              boxShadow: state.running ? `0 0 12px ${settings.color}66` : 'none',
            }}
          />
        )}
      </div>

      {/* DND banner */}
      {dndBanner && (
        <div
          role="status"
          className="fixed inset-x-0 z-40 mx-auto mt-2 flex max-w-md animate-fade-in items-center gap-3 rounded-full border border-rule bg-white/95 px-4 py-2 text-sm text-ink-900 shadow-lg backdrop-blur"
          style={{ top: settings.thickness + 4, left: '50%', transform: 'translateX(-50%)' }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: settings.color }} />
          <span>Focus block started — turn on Do Not Disturb.</span>
          <button onClick={() => setDndBanner(false)} className="ml-auto text-xs text-ink-500 hover:text-ink-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Top app bar */}
      <header
        className="mx-auto flex max-w-3xl items-center justify-between px-6 pb-6"
        style={{ paddingTop: 24 + settings.thickness }}
      >
        <button onClick={onExit} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[12px] uppercase tracking-widest text-ink-600 hover:text-ink-900">
          <Chevron /> Home
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowStats((s) => !s)} className="rounded-full px-3 py-1.5 font-mono text-[12px] uppercase tracking-widest text-ink-600 hover:text-ink-900">
            {showStats ? 'Hide stats' : 'Stats'}
          </button>
          <button onClick={toggleFullscreen} className="rounded-full px-3 py-1.5 font-mono text-[12px] uppercase tracking-widest text-ink-600 hover:text-ink-900">
            Fullscreen
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-32">
        {/* Hero countdown — either plan or single-timer */}
        <div className="mt-8 text-center">
          {planRunning ? (
            <PlanHero plan={plan} progress={planProgress} accent={settings.color} />
          ) : (
            <>
              <PhaseLabel state={state} cycle={cycleCount} settings={settings} />
              <div className="mt-4 font-mono text-7xl font-medium tabular-nums leading-[0.92] tracking-tight text-ink-950 sm:text-[120px]">
                {state.phase === 'idle' ? '—:—' : formatRemaining(remaining)}
              </div>
              {state.phase === 'work' && history[0]?.intention && (
                <div className="mt-3 text-base text-ink-700">
                  <span className="text-ink-500">on</span> {history[0].intention}
                </div>
              )}
              <div className="mt-6 flex items-center justify-center gap-2">
                {state.phase === 'idle' ? (
                  <span className="font-mono text-[12px] uppercase tracking-widest text-ink-600">
                    Pick a duration or start a day plan
                  </span>
                ) : state.running ? (
                  <button onClick={() => timerEngine.pause()} className="btn-primary py-2.5 text-sm">Pause</button>
                ) : (
                  <>
                    <button onClick={() => timerEngine.resume()} className="btn-primary py-2.5 text-sm">Resume</button>
                    <button onClick={() => timerEngine.reset()} className="btn-ghost py-2.5 text-sm">Reset</button>
                  </>
                )}
                {state.phase !== 'idle' && state.running && (
                  <button onClick={() => timerEngine.reset()} className="rounded-full px-3 py-1.5 text-xs text-ink-500 hover:text-ink-900">
                    Cancel
                  </button>
                )}
              </div>

              {settings.pomodoroMode && state.phase !== 'idle' && (
                <div className="mt-8 text-left">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-600">Cycle</div>
                  <CycleBar
                    completedWorkBlocks={cycleCount}
                    isInBreak={state.phase === 'short-break' || state.phase === 'long-break'}
                    currentProgress={timerProgress}
                    cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
                    accentColor={settings.color}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Single timer quick-start */}
        {!planRunning && (
          <section className="mt-14">
            <h2 className="eyebrow"><span className="num">01</span>Single timer</h2>
            <input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="What are you focusing on? (optional)"
              maxLength={120}
              className="mt-4 w-full rounded-2xl border border-rule bg-white px-4 py-3 text-ink-900 placeholder:text-ink-500 focus:border-ink-700 focus:outline-none"
            />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => startWork(m)}
                  className="group rounded-2xl border border-rule bg-white px-4 py-5 text-left transition hover:border-ink-700"
                >
                  <div className="text-2xl font-medium tracking-tight text-ink-950">
                    {m}<span className="text-base font-normal text-ink-500"> min</span>
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-500">Press {i + 1}</div>
                </button>
              ))}
            </div>
            <CustomDuration onStart={startCustom} />
          </section>
        )}

        {/* Pomodoro cycle */}
        {!planRunning && (
          <section className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow"><span className="num">02</span>Pomodoro cycle</h2>
              <Toggle
                checked={settings.pomodoroMode}
                onChange={(v) => setSettings({ ...settings, pomodoroMode: v })}
                label={settings.pomodoroMode ? 'On' : 'Off'}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <NumberField label="Work" suffix="min" value={settings.workMinutes} onChange={(v) => setSettings({ ...settings, workMinutes: v })} />
              <NumberField label="Short break" suffix="min" value={settings.shortBreakMinutes} onChange={(v) => setSettings({ ...settings, shortBreakMinutes: v })} />
              <NumberField label="Long break" suffix="min" value={settings.longBreakMinutes} onChange={(v) => setSettings({ ...settings, longBreakMinutes: v })} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-600">
              <span>
                Long break every{' '}
                <input
                  type="number" min={2} max={12}
                  value={settings.cyclesBeforeLongBreak}
                  onChange={(e) => setSettings({ ...settings, cyclesBeforeLongBreak: clamp(Number(e.target.value), 2, 12) })}
                  className="mx-1 w-14 rounded-md border border-rule bg-white px-2 py-1 text-center text-ink-900 focus:border-ink-700 focus:outline-none"
                />{' '}
                work blocks
              </span>
              <button onClick={() => startWork(settings.workMinutes)} className="btn-primary py-2.5 text-sm">
                Start Pomodoro
              </button>
            </div>
          </section>
        )}

        {/* Day plan (tasks) */}
        <div className="mt-14">
          <TasksPanel accent={settings.color} onChimeRequested={playChime} />
        </div>

        {/* Appearance */}
        <section className="mt-14">
          <h2 className="eyebrow"><span className="num">04</span>Appearance</h2>
          <div className="mt-4 space-y-5">
            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-600">Color</div>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setSettings({ ...settings, color: c.value })}
                    aria-label={c.name}
                    className={`h-9 w-9 rounded-full border-2 p-[3px] transition hover:scale-105 ${
                      settings.color === c.value ? 'border-ink-950' : 'border-transparent'
                    }`}
                  >
                    <span className="block h-full w-full rounded-full" style={{ background: c.value }} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-600">Thickness</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {THICKNESSES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSettings({ ...settings, thickness: t.value })}
                    className={`flex flex-col items-center gap-2 rounded-2xl border bg-white px-3 py-3.5 text-sm transition ${
                      settings.thickness === t.value ? 'border-ink-950' : 'border-rule hover:border-ink-600'
                    }`}
                  >
                    <span className="block w-7 rounded-[2px]" style={{ height: t.value, backgroundColor: settings.color }} />
                    <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-600">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              checked={settings.soundOn}
              onChange={(v) => setSettings({ ...settings, soundOn: v })}
              label="Play chime when a session or task ends"
            />
          </div>
        </section>

        {/* Meeting countdown */}
        <MeetingPanel source={meetingSource} setSource={setMeetingSource} accent={settings.color} />

        {/* DND helper */}
        <DndCard
          enabled={settings.dndReminder}
          setEnabled={(v) => setSettings({ ...settings, dndReminder: v })}
          expanded={dndExpanded}
          setExpanded={setDndExpanded}
        />

        {/* Stats */}
        {showStats && (
          <section className="mt-14 animate-fade-in">
            <h2 className="eyebrow"><span className="num">07</span>Today</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Sessions" value={todayStats.sessions.toString()} />
              <Stat label="Focus time" value={`${todayStats.focusMinutes} min`} />
              <Stat label="Day streak" value={todayStats.streak.toString()} />
            </div>
            <div className="mt-4">
              <WeeklyHeatmap history={history} accent={settings.color} />
            </div>
            <HistoryList history={history} />
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-500 hover:text-ink-900">
                Clear history
              </button>
            )}
          </section>
        )}

        <KeyboardHelp />
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function PlanHero({
  plan,
  progress,
  accent,
}: {
  plan: ReturnType<typeof usePlanState>
  progress: ReturnType<typeof computeProgress>
  accent: string
}) {
  const active = plan.activeIndex !== null ? plan.tasks[plan.activeIndex] : null
  if (!active) return null
  const next = plan.tasks.find((t, i) => i > (plan.activeIndex ?? -1) && !t.done)
  return (
    <div>
      <div className="font-mono text-[12px] uppercase tracking-widest text-ink-600">
        {plan.paused ? 'Paused' : 'Now'}
      </div>
      <div className="mt-2 text-3xl font-medium tracking-tight text-ink-950 sm:text-4xl">{active.title}</div>
      <div className="mt-3 font-mono text-7xl font-medium tabular-nums tracking-tight text-ink-950 sm:text-8xl">
        {formatHMS(progress.taskRemainingMs)}
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-600">
        Left on task · {formatHMS(progress.dayRemainingMs)} left today
      </div>
      {next && (
        <div className="mt-3 text-sm text-ink-700">
          <span className="text-ink-500">Up next:</span>{' '}
          <span className="text-ink-900">{next.title}</span>
          <span className="text-ink-500"> · {next.estimated}m</span>
        </div>
      )}
      {/* Accent ref so the segmented top line uses it — accent is already applied via prop */}
      <span className="sr-only" style={{ color: accent }} />
    </div>
  )
}

function formatHMS(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function PhaseLabel({ state, cycle, settings }: { state: { phase: Phase; running: boolean }; cycle: number; settings: Settings }) {
  if (state.phase === 'idle') {
    return <div className="font-mono text-[12px] uppercase tracking-widest text-ink-600">Ready</div>
  }
  const label = state.phase === 'work' ? 'Focus' : state.phase === 'short-break' ? 'Short break' : 'Long break'
  const indicator = state.running ? '●' : '⏸'
  return (
    <div className="font-mono text-[12px] uppercase tracking-widest text-ink-700">
      {indicator} {label}
      {settings.pomodoroMode && state.phase === 'work' && (
        <span className="ml-2 text-ink-500">block {cycle + 1}</span>
      )}
    </div>
  )
}

function CustomDuration({ onStart }: { onStart: (m: number) => void }) {
  const [value, setValue] = useState('')
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const m = Number(value); if (m > 0) { onStart(m); setValue('') } }}
      className="mt-3 flex gap-2"
    >
      <input
        type="number" min={1} max={600}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Custom minutes"
        className="flex-1 rounded-2xl border border-rule bg-white px-4 py-3 text-ink-900 placeholder:text-ink-500 focus:border-ink-700 focus:outline-none"
      />
      <button type="submit" className="btn-ghost py-3 text-sm">Start</button>
    </form>
  )
}

function NumberField({
  label, value, onChange, suffix,
}: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="block rounded-2xl border border-rule bg-white px-3 py-3">
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <input
          type="number" min={1} max={600}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value), 1, 600))}
          className="w-full bg-transparent text-2xl font-medium tabular-nums text-ink-950 focus:outline-none"
        />
        {suffix && <span className="text-sm text-ink-500">{suffix}</span>}
      </div>
    </label>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm text-ink-800"
    >
      <span className={`relative inline-flex h-6 w-10 items-center rounded-full transition ${checked ? 'bg-ink-950' : 'bg-ink-300'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </span>
      {label}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rule bg-white px-4 py-4">
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">{label}</div>
      <div className="mt-1 text-2xl font-medium tracking-tight text-ink-950">{value}</div>
    </div>
  )
}

function HistoryList({ history }: { history: SessionRecord[] }) {
  if (history.length === 0) {
    return <p className="mt-4 text-sm text-ink-500">No sessions yet. The first one's always the hardest.</p>
  }
  return (
    <ul className="mt-4 divide-y divide-rule rounded-2xl border border-rule bg-white">
      {history.slice(0, 12).map((h) => (
        <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`h-2 w-2 shrink-0 rounded-full ${h.completed ? 'bg-emerald-500' : 'bg-ink-300'}`} />
            <span className="shrink-0 capitalize text-ink-900">{h.phase.replace('-', ' ')}</span>
            <span className="shrink-0 font-mono text-[11px] text-ink-500">{Math.round(h.durationMs / 60_000)}m</span>
            {h.intention && (
              <span className="truncate text-ink-700" title={h.intention}>· {h.intention}</span>
            )}
          </div>
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-ink-500">{relativeTime(h.startedAt)}</span>
        </li>
      ))}
    </ul>
  )
}

function KeyboardHelp() {
  return (
    <section className="mt-16 rounded-2xl border border-rule bg-white p-5 text-sm text-ink-700">
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink-600">Keyboard</h3>
      <div className="mt-3 grid grid-cols-2 gap-y-2 sm:grid-cols-4">
        <Kbd k="Space" desc="Pause / resume" />
        <Kbd k="R" desc="Reset" />
        <Kbd k="F" desc="Fullscreen" />
        <Kbd k="1–4" desc="Presets" />
      </div>
    </section>
  )
}

function Kbd({ k, desc }: { k: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-xs text-ink-900">{k}</kbd>
      <span>{desc}</span>
    </div>
  )
}

function Chevron() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function computeStreak(history: SessionRecord[]): number {
  const days = new Set<string>()
  for (const h of history) {
    if (h.phase !== 'work' || !h.completed) continue
    const d = new Date(h.startedAt)
    d.setHours(0, 0, 0, 0)
    days.add(d.toISOString().slice(0, 10))
  }
  if (days.size === 0) return 0
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  else document.documentElement.requestFullscreen().catch(() => {})
}
