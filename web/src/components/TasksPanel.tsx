import { useEffect, useState } from 'react'
import {
  Task,
  computeProgress,
  formatHMS,
  formatMinutesShort,
  planEngine,
  totalPlanMinutes,
  usePlanState,
} from '../lib/plan'
import { DayLine } from './DayLine'
import { track } from '../lib/track'

export function TasksPanel({
  accent,
  onChimeRequested,
}: {
  accent: string
  onChimeRequested?: () => void
}) {
  const state = usePlanState()
  const now = useNow(state.activeIndex !== null && !state.paused ? 200 : 1000)
  const progress = computeProgress(state, now)
  const [newTitle, setNewTitle] = useState('')
  const [newMinutes, setNewMinutes] = useState('25')

  // Fire chime on task completion
  useEffect(() => {
    planEngine.onComplete(() => {
      onChimeRequested?.()
    })
    return () => planEngine.onComplete(null)
  }, [onChimeRequested, state.tasks.length])

  const addTask = () => {
    const title = newTitle.trim()
    const minutes = Math.max(1, Math.min(600, Number(newMinutes) || 0))
    if (!title) return
    planEngine.addTask({ title, estimated: minutes })
    
    setNewTitle('')
    setNewMinutes('25')
  }

  const isRunning = state.activeIndex !== null
  const active = isRunning ? state.tasks[state.activeIndex!] : null
  const nextIdx = isRunning
    ? state.tasks.findIndex((t, i) => i > state.activeIndex! && !t.done)
    : state.tasks.findIndex(t => !t.done)
  const next = nextIdx >= 0 ? state.tasks[nextIdx] : null
  const totalLeft = totalPlanMinutes(state.tasks)
  const doneCount = state.tasks.filter(t => t.done).length

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow"><span className="num">03</span>Day plan</h2>
        {state.tasks.length > 0 && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-600">
            {doneCount}/{state.tasks.length} done · {formatMinutesShort(totalLeft)} left
          </span>
        )}
      </div>

      {/* Running snapshot */}
      {isRunning && active && (
        <div className="rounded-2xl border border-rule bg-white p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">Now</div>
              <div className="mt-1 text-2xl font-medium tracking-tight text-ink-950">{active.title}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-3xl font-medium tabular-nums text-ink-950">{formatHMS(progress.taskRemainingMs)}</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">left on task</div>
            </div>
          </div>

          <div className="mt-4">
            <DayLine state={state} accent={accent} thickness={8} nowMs={now} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-700">
            <div className="truncate">
              {next ? (
                <>
                  <span className="text-ink-500">Up next:</span>{' '}
                  <span className="text-ink-900">{next.title}</span>
                  <span className="text-ink-500"> · {next.estimated}m</span>
                </>
              ) : (
                <span className="text-ink-500">Last task</span>
              )}
            </div>
            <div className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-ink-600">
              {formatHMS(progress.dayRemainingMs)} left today
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {state.paused ? (
              <button onClick={() => { planEngine.resume() }} className="btn-primary py-2.5 text-sm">Resume</button>
            ) : (
              <button onClick={() => { planEngine.pause() }} className="btn-primary py-2.5 text-sm">Pause</button>
            )}
            <button onClick={() => { planEngine.completeCurrent() }} className="btn-ghost py-2.5 text-sm">Finish task</button>
            <button onClick={() => { planEngine.skip() }} className="btn-ghost py-2.5 text-sm">Skip</button>
            <button onClick={() => { planEngine.cancel() }} className="ml-auto text-xs text-ink-500 hover:text-ink-900">
              End plan
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="rounded-2xl border border-rule bg-white">
        {state.tasks.length === 0 ? (
          <div className="p-6 text-sm text-ink-600">
            Add the things you want to get done today. Each takes an estimated number of minutes — the
            line will walk through them in order, with a chime between each.
          </div>
        ) : (
          <ul>
            {state.tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                isActive={i === state.activeIndex}
                isLast={i === state.tasks.length - 1}
                onCheck={(done) => { planEngine.updateTask(task.id, { done });  }}
                onRename={(title) => planEngine.updateTask(task.id, { title })}
                onMinutes={(est) => { planEngine.updateTask(task.id, { estimated: est });  }}
                onUp={() => { planEngine.moveTask(task.id, -1);  }}
                onDown={() => { planEngine.moveTask(task.id, 1);  }}
                onRemove={() => { planEngine.removeTask(task.id);  }}
                onStart={() => { planEngine.startTaskAt(i);  }}
                planRunning={isRunning}
              />
            ))}
          </ul>
        )}

        {/* New task */}
        <form
          onSubmit={(e) => { e.preventDefault(); addTask() }}
          className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-rule p-3"
        >
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task…"
            className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-ink-700 focus:outline-none"
          />
          <input
            value={newMinutes}
            onChange={(e) => setNewMinutes(e.target.value)}
            type="number"
            min={1}
            max={600}
            className="w-20 rounded-lg border border-rule bg-paper px-3 py-2 text-center font-mono text-sm text-ink-900 focus:border-ink-700 focus:outline-none"
            aria-label="estimated minutes"
          />
          <button type="submit" className="rounded-lg bg-ink-950 px-4 py-2 text-sm font-medium text-white">
            Add
          </button>
        </form>
      </div>

      {!isRunning && state.tasks.some(t => !t.done) && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              const undone = state.tasks.filter(t => !t.done)
              track('plan_started', {
                task_count: undone.length,
                total_minutes: undone.reduce((s, t) => s + t.estimated, 0),
              })
              planEngine.startPlan()
            }}
            className="btn-primary text-sm"
          >
            Start day plan
            <ArrowRight />
          </button>
        </div>
      )}
    </section>
  )
}

function TaskRow({
  task,
  isActive,
  isLast,
  planRunning,
  onCheck,
  onRename,
  onMinutes,
  onUp,
  onDown,
  onRemove,
  onStart,
}: {
  task: Task
  isActive: boolean
  isLast: boolean
  planRunning: boolean
  onCheck: (done: boolean) => void
  onRename: (title: string) => void
  onMinutes: (minutes: number) => void
  onUp: () => void
  onDown: () => void
  onRemove: () => void
  onStart: () => void
}) {
  return (
    <li className={`group flex items-center gap-3 px-3 py-2.5 ${!isLast ? 'border-b border-rule' : ''} ${isActive ? 'bg-paper-2' : ''}`}>
      <button
        type="button"
        onClick={() => onCheck(!task.done)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          task.done ? 'border-ink-700 bg-ink-700 text-white' : 'border-ink-400 hover:border-ink-700'
        }`}
        aria-label={task.done ? 'Mark not done' : 'Mark done'}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path d="M3 7.2 5.8 10 11 4.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <input
        value={task.title}
        onChange={(e) => onRename(e.target.value)}
        className={`flex-1 bg-transparent text-sm focus:outline-none ${
          task.done ? 'text-ink-500 line-through' : 'text-ink-900'
        }`}
      />
      <div className="flex items-center gap-1 font-mono text-xs text-ink-600">
        <input
          value={task.estimated}
          onChange={(e) => onMinutes(Math.max(1, Math.min(600, Number(e.target.value) || 1)))}
          type="number"
          min={1}
          max={600}
          className="w-12 rounded border border-transparent bg-transparent px-1 py-0.5 text-right tabular-nums focus:border-rule focus:bg-white focus:outline-none"
        />
        m
      </div>
      <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        {!planRunning && !task.done && (
          <button
            onClick={onStart}
            className="rounded p-1 text-ink-600 hover:bg-paper-2 hover:text-ink-950"
            title="Start this task now"
            aria-label="Start"
          >
            <PlayIcon />
          </button>
        )}
        <button onClick={onUp} className="rounded p-1 text-ink-600 hover:bg-paper-2 hover:text-ink-950" aria-label="Move up"><Chevron dir="up" /></button>
        <button onClick={onDown} className="rounded p-1 text-ink-600 hover:bg-paper-2 hover:text-ink-950" aria-label="Move down"><Chevron dir="down" /></button>
        <button onClick={onRemove} className="rounded p-1 text-ink-600 hover:bg-paper-2 hover:text-ink-950" aria-label="Remove">×</button>
      </div>
    </li>
  )
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function PlayIcon() {
  return <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5L2 1.5z" /></svg>
}
function Chevron({ dir }: { dir: 'up' | 'down' }) {
  const path = dir === 'up' ? 'M3 8l4-4 4 4' : 'M3 6l4 4 4-4'
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function ArrowRight() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
