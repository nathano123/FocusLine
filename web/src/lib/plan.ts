import { useEffect, useState } from 'react'

export type Task = {
  id: string
  title: string
  /** Estimated minutes. Always > 0. */
  estimated: number
  done: boolean
}

export type PlanState = {
  tasks: Task[]
  /** Index of the currently-running task. null when no plan is active. */
  activeIndex: number | null
  /** Wall-clock ms when the active task started. */
  startedAt: number | null
  /** Wall-clock ms when the active task should end (start + estimated). */
  endsAt: number | null
  /** Paused state. When paused, we hold elapsed and ignore startedAt-based math. */
  paused: boolean
  /** Frozen elapsed (ms) at the moment of pause. 0 when running. */
  pausedElapsed: number
}

type Listener = (s: PlanState) => void

const STORAGE_KEY = 'focusline:plan:v1'

function loadInitial(): PlanState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PlanState
  } catch { /* ignore */ }
  return { tasks: [], activeIndex: null, startedAt: null, endsAt: null, paused: false, pausedElapsed: 0 }
}

class PlanEngine {
  private state: PlanState = loadInitial()
  private listeners = new Set<Listener>()
  private raf: number | null = null
  private completionHandler: ((finishedIndex: number, allDone: boolean) => void) | null = null

  getState(): PlanState { return this.state }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    fn(this.state)
    return () => { this.listeners.delete(fn) }
  }

  onComplete(fn: ((idx: number, allDone: boolean) => void) | null) {
    this.completionHandler = fn
  }

  // ── Task list editing (only safe when no plan is running) ───────────────

  setTasks(next: Task[]) {
    this.state = { ...this.state, tasks: next }
    this.persist()
  }

  addTask(task: Omit<Task, 'id' | 'done'>) {
    const t: Task = { id: crypto.randomUUID(), done: false, ...task }
    this.setTasks([...this.state.tasks, t])
  }

  updateTask(id: string, patch: Partial<Omit<Task, 'id'>>) {
    this.setTasks(this.state.tasks.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  removeTask(id: string) {
    this.setTasks(this.state.tasks.filter(t => t.id !== id))
  }

  moveTask(id: string, direction: -1 | 1) {
    const idx = this.state.tasks.findIndex(t => t.id === id)
    const target = idx + direction
    if (idx < 0 || target < 0 || target >= this.state.tasks.length) return
    const next = [...this.state.tasks]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    this.setTasks(next)
  }

  // ── Plan execution ───────────────────────────────────────────────────────

  startPlan() {
    const firstUndone = this.state.tasks.findIndex(t => !t.done)
    if (firstUndone < 0) return
    this.beginTask(firstUndone)
  }

  startTaskAt(index: number) {
    if (index < 0 || index >= this.state.tasks.length) return
    this.beginTask(index)
  }

  pause() {
    if (this.state.activeIndex === null || this.state.paused) return
    const elapsed = this.elapsedMsOf(this.state)
    this.state = { ...this.state, paused: true, pausedElapsed: elapsed, startedAt: null, endsAt: null }
    this.cancelTick()
    this.persist()
  }

  resume() {
    if (this.state.activeIndex === null || !this.state.paused) return
    const remaining = this.taskDurationMs(this.state.activeIndex) - this.state.pausedElapsed
    const now = Date.now()
    this.state = { ...this.state, paused: false, startedAt: now - this.state.pausedElapsed, endsAt: now + remaining, pausedElapsed: 0 }
    this.scheduleTick()
    this.persist()
  }

  /** Cancel the entire plan. Tasks themselves are kept; nothing is marked done. */
  cancel() {
    this.state = { ...this.state, activeIndex: null, startedAt: null, endsAt: null, paused: false, pausedElapsed: 0 }
    this.cancelTick()
    this.persist()
  }

  /** Skip current task without marking it done — moves to next undone. */
  skip() {
    if (this.state.activeIndex === null) return
    this.advance(this.state.activeIndex, /* markDone */ false)
  }

  /** Mark current task done and move on. */
  completeCurrent() {
    if (this.state.activeIndex === null) return
    this.advance(this.state.activeIndex, /* markDone */ true)
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private beginTask(index: number) {
    const dur = this.taskDurationMs(index)
    const now = Date.now()
    this.state = {
      ...this.state,
      activeIndex: index,
      startedAt: now,
      endsAt: now + dur,
      paused: false,
      pausedElapsed: 0,
    }
    this.persist()
    this.scheduleTick()
  }

  private advance(currentIndex: number, markDone: boolean) {
    this.cancelTick()
    let tasks = this.state.tasks
    if (markDone) {
      tasks = tasks.map((t, i) => i === currentIndex ? { ...t, done: true } : t)
    }
    const next = tasks.findIndex((t, i) => i > currentIndex && !t.done)
    const allDone = tasks.every(t => t.done) || next < 0
    if (allDone) {
      this.state = { ...this.state, tasks, activeIndex: null, startedAt: null, endsAt: null, paused: false, pausedElapsed: 0 }
      this.persist()
      this.completionHandler?.(currentIndex, true)
      return
    }
    this.state = { ...this.state, tasks }
    this.completionHandler?.(currentIndex, false)
    this.beginTask(next)
  }

  private taskDurationMs(index: number): number {
    const t = this.state.tasks[index]
    return Math.max(1, Math.round(t.estimated * 60_000))
  }

  private elapsedMsOf(s: PlanState): number {
    if (s.activeIndex === null) return 0
    if (s.paused) return s.pausedElapsed
    if (s.startedAt === null) return 0
    return Math.max(0, Date.now() - s.startedAt)
  }

  private scheduleTick() {
    this.cancelTick()
    const tick = () => {
      const s = this.state
      if (s.activeIndex === null || s.paused) {
        this.raf = null
        return
      }
      const elapsed = this.elapsedMsOf(s)
      const total = this.taskDurationMs(s.activeIndex)
      if (elapsed >= total) {
        // Auto-advance: mark current done, move to next
        this.advance(s.activeIndex, true)
        return
      }
      this.emit()
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  private cancelTick() {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf)
      this.raf = null
    }
  }

  private emit() {
    for (const l of this.listeners) l(this.state)
  }

  private persist() {
    this.emit()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...this.state,
        // Don't persist transient timing — if the user reloads while a plan is running,
        // we resume from idle rather than racing the wall clock.
        activeIndex: null, startedAt: null, endsAt: null, paused: false, pausedElapsed: 0,
      }))
    } catch { /* ignore */ }
  }
}

export const planEngine = new PlanEngine()

export function usePlanState(): PlanState {
  const [s, set] = useState<PlanState>(() => planEngine.getState())
  useEffect(() => planEngine.subscribe(set), [])
  return s
}

// ── Derived helpers ────────────────────────────────────────────────────────

export function totalPlanMinutes(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.done ? 0 : t.estimated), 0)
}

export function totalPlanMs(tasks: Task[]): number {
  return totalPlanMinutes(tasks) * 60_000
}

export type PlanProgress = {
  /** ms remaining on the active task. 0 when idle. */
  taskRemainingMs: number
  /** ms remaining across all upcoming + active. 0 when idle. */
  dayRemainingMs: number
  /** progress within the active task, 0..1. 0 when idle. */
  taskProgress: number
  /** progress through the whole day's plan, 0..1. */
  dayProgress: number
  /** offsets (ms from day start) for each task boundary. Length = tasks.length + 1. */
  boundariesMs: number[]
}

/** Computes derived progress; call this from a useEffect with the active state and a now ticker. */
export function computeProgress(s: PlanState, now: number = Date.now()): PlanProgress {
  const totalMs = s.tasks.reduce((sum, t) => sum + t.estimated * 60_000, 0)
  const boundariesMs = [0]
  let acc = 0
  for (const t of s.tasks) {
    acc += t.estimated * 60_000
    boundariesMs.push(acc)
  }
  if (s.activeIndex === null) {
    const finishedMs = s.tasks.reduce((sum, t) => sum + (t.done ? t.estimated * 60_000 : 0), 0)
    return {
      taskRemainingMs: 0,
      dayRemainingMs: Math.max(0, totalMs - finishedMs),
      taskProgress: 0,
      dayProgress: totalMs > 0 ? finishedMs / totalMs : 0,
      boundariesMs,
    }
  }
  const taskTotal = Math.max(1, s.tasks[s.activeIndex].estimated * 60_000)
  const taskElapsed = s.paused
    ? s.pausedElapsed
    : Math.max(0, Math.min(taskTotal, now - (s.startedAt ?? now)))
  const taskRemaining = Math.max(0, taskTotal - taskElapsed)
  // Day-level: completed tasks (done flag) contribute their full duration; the current task
  // contributes its elapsed; upcoming contribute 0.
  let completedMs = 0
  for (let i = 0; i < s.tasks.length; i++) {
    if (i < s.activeIndex) {
      completedMs += s.tasks[i].estimated * 60_000
    }
  }
  const dayElapsed = completedMs + taskElapsed
  const dayRemaining = Math.max(0, totalMs - dayElapsed)
  return {
    taskRemainingMs: taskRemaining,
    dayRemainingMs: dayRemaining,
    taskProgress: taskElapsed / taskTotal,
    dayProgress: totalMs > 0 ? dayElapsed / totalMs : 0,
    boundariesMs,
  }
}

export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatMinutesShort(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
