import { useEffect, useRef, useState } from 'react'

export type Phase = 'idle' | 'work' | 'short-break' | 'long-break'

export type TimerState = {
  phase: Phase
  /** Total duration of the current phase, in ms. */
  total: number
  /** Elapsed time within the current phase, in ms. */
  elapsed: number
  running: boolean
}

type Listener = (s: TimerState) => void

/**
 * Drift-free timer engine: tracks an absolute wall-clock start and accumulates
 * paused time, instead of incrementing a counter. Survives tab throttling.
 */
class TimerEngine {
  private listeners = new Set<Listener>()
  private state: TimerState = { phase: 'idle', total: 0, elapsed: 0, running: false }
  private startedAt: number | null = null
  private accumulated = 0
  private raf: number | null = null
  private onComplete: (() => void) | null = null

  subscribe(l: Listener) {
    this.listeners.add(l)
    l(this.state)
    return () => {
      this.listeners.delete(l)
    }
  }

  setOnComplete(cb: (() => void) | null) {
    this.onComplete = cb
  }

  getState(): TimerState {
    return this.state
  }

  start(phase: Phase, durationMs: number) {
    this.cancelRaf()
    this.startedAt = performance.now()
    this.accumulated = 0
    this.state = { phase, total: durationMs, elapsed: 0, running: true }
    this.emit()
    this.tick()
  }

  pause() {
    if (!this.state.running || this.startedAt === null) return
    this.accumulated += performance.now() - this.startedAt
    this.startedAt = null
    this.state = { ...this.state, running: false, elapsed: this.accumulated }
    this.cancelRaf()
    this.emit()
  }

  resume() {
    if (this.state.running || this.state.phase === 'idle') return
    this.startedAt = performance.now()
    this.state = { ...this.state, running: true }
    this.emit()
    this.tick()
  }

  reset() {
    this.cancelRaf()
    this.startedAt = null
    this.accumulated = 0
    this.state = { phase: 'idle', total: 0, elapsed: 0, running: false }
    this.emit()
  }

  private tick = () => {
    if (!this.state.running) return
    const now = performance.now()
    const liveElapsed = this.accumulated + (this.startedAt !== null ? now - this.startedAt : 0)
    const elapsed = Math.min(liveElapsed, this.state.total)
    this.state = { ...this.state, elapsed }
    this.emit()
    if (elapsed >= this.state.total) {
      this.complete()
      return
    }
    this.raf = requestAnimationFrame(this.tick)
  }

  private complete() {
    this.cancelRaf()
    this.startedAt = null
    this.accumulated = 0
    const completedPhase = this.state.phase
    this.state = { ...this.state, running: false, elapsed: this.state.total }
    this.emit()
    this.onComplete?.()
    // Caller (hook) decides what to do next based on completedPhase.
    void completedPhase
  }

  private cancelRaf() {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf)
      this.raf = null
    }
  }

  private emit() {
    for (const l of this.listeners) l(this.state)
  }
}

export const timerEngine = new TimerEngine()

export function useTimerState(): TimerState {
  const [state, setState] = useState<TimerState>(() => timerEngine.getState())
  useEffect(() => timerEngine.subscribe(setState), [])
  return state
}

export function useDocumentTitle(state: TimerState) {
  const lastRef = useRef<string>('')
  useEffect(() => {
    let title = 'FocusLine'
    if (state.phase !== 'idle' && state.total > 0) {
      const remaining = Math.max(0, state.total - state.elapsed)
      title = `${formatRemaining(remaining)} · FocusLine`
    }
    if (lastRef.current !== title) {
      document.title = title
      lastRef.current = title
    }
  }, [state])
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    return `${h}:${String(mm).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
