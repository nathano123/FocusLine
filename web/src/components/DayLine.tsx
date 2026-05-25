import type { PlanState } from '../lib/plan'

/**
 * The segmented day line. Each task occupies a slice proportional to its estimated minutes.
 * Completed tasks render as fully filled (in the accent color, dimmed).
 * Active task: its slice fills as time elapses within it.
 * Upcoming tasks: empty (the slice background only).
 */
export function DayLine({
  state,
  accent,
  thickness,
  nowMs,
  showLabels = false,
}: {
  state: PlanState
  accent: string
  thickness: number
  nowMs: number
  showLabels?: boolean
}) {
  const totalMs = state.tasks.reduce((s, t) => s + t.estimated * 60_000, 0)
  if (state.tasks.length === 0 || totalMs === 0) return null

  let cumulativeMs = 0
  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden rounded-full bg-ink-200" style={{ height: thickness }}>
        {state.tasks.map((task, i) => {
          const widthPct = (task.estimated * 60_000 / totalMs) * 100
          const offsetPct = (cumulativeMs / totalMs) * 100
          cumulativeMs += task.estimated * 60_000
          const isActive = i === state.activeIndex
          // The slice's fill: complete=full, active=task elapsed fraction, upcoming=0
          let fillPct = 0
          if (task.done) {
            fillPct = 100
          } else if (isActive) {
            const start = state.startedAt
            const elapsed = state.paused
              ? state.pausedElapsed
              : start !== null ? Math.max(0, nowMs - start) : 0
            fillPct = Math.min(100, (elapsed / (task.estimated * 60_000)) * 100)
          }
          return (
            <div
              key={task.id}
              className="absolute top-0 h-full overflow-hidden"
              style={{ left: `${offsetPct}%`, width: `calc(${widthPct}% - 1px)` }}
              aria-label={`${task.title} — ${task.estimated} minutes`}
              title={`${task.title} · ${task.estimated} min`}
            >
              <div
                className="h-full transition-[width] duration-100 ease-linear"
                style={{
                  width: `${fillPct}%`,
                  backgroundColor: task.done ? accent : accent,
                  opacity: task.done ? 0.45 : isActive ? 1 : 0.85,
                  boxShadow: isActive ? `0 0 10px ${accent}66` : undefined,
                }}
              />
            </div>
          )
        })}
        {/* tick marks between tasks */}
        {state.tasks.slice(0, -1).map((_, i) => {
          let acc = 0
          for (let k = 0; k <= i; k++) acc += state.tasks[k].estimated * 60_000
          const pct = (acc / totalMs) * 100
          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{ left: `calc(${pct}% - 0.5px)`, width: 1, backgroundColor: '#FAFAF7' }}
            />
          )
        })}
      </div>

      {showLabels && (
        <div className="relative mt-1.5 h-3 w-full">
          {state.tasks.map((task, i) => {
            let leftMs = 0
            for (let k = 0; k < i; k++) leftMs += state.tasks[k].estimated * 60_000
            const widthPct = (task.estimated * 60_000 / totalMs) * 100
            const offsetPct = (leftMs / totalMs) * 100
            return (
              <div
                key={task.id}
                className="absolute truncate font-mono text-[10px] uppercase tracking-widest text-ink-500"
                style={{ left: `${offsetPct}%`, width: `${widthPct}%`, paddingRight: 6 }}
              >
                {task.title}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
