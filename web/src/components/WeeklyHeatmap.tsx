type Day = { date: Date; minutes: number }

const WEEKS = 12

export function WeeklyHeatmap({
  history,
  accent,
}: {
  history: { phase: string; startedAt: number; durationMs: number; completed: boolean }[]
  accent: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Anchor on Monday for nicer columns; walk back WEEKS*7 days
  const startDow = (today.getDay() + 6) % 7 // 0 = Mon
  const gridStart = new Date(today)
  gridStart.setDate(gridStart.getDate() - startDow - (WEEKS - 1) * 7)

  const dayMs = 24 * 60 * 60 * 1000
  const totalDays = WEEKS * 7
  const days: Day[] = Array.from({ length: totalDays }, (_, i) => ({
    date: new Date(gridStart.getTime() + i * dayMs),
    minutes: 0,
  }))

  for (const h of history) {
    if (h.phase !== 'work' || !h.completed) continue
    const ts = new Date(h.startedAt)
    ts.setHours(0, 0, 0, 0)
    const idx = Math.floor((ts.getTime() - gridStart.getTime()) / dayMs)
    if (idx >= 0 && idx < totalDays) {
      days[idx].minutes += h.durationMs / 60_000
    }
  }

  const max = Math.max(60, ...days.map((d) => d.minutes))

  // Column-major: weeks across, days top-to-bottom
  const columns: Day[][] = []
  for (let w = 0; w < WEEKS; w++) {
    columns.push(days.slice(w * 7, w * 7 + 7))
  }

  // Aggregates for the bottom legend
  const totalMinutes = Math.round(days.reduce((a, d) => a + d.minutes, 0))
  const totalBlocks = history.filter((h) => h.phase === 'work' && h.completed).length
  const totalHours = Math.floor(totalMinutes / 60)
  const totalRemMin = totalMinutes % 60

  return (
    <div className="rounded-2xl border border-rule bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink-600">Last {WEEKS} weeks</h3>
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-600">
          {totalMinutes} min total
        </span>
      </div>
      <div className="mt-3 flex gap-[3px]" role="img" aria-label="Weekly focus heatmap">
        <div className="flex flex-col gap-[3px] pr-2 font-mono text-[10px] text-ink-500">
          <span className="h-3 leading-3">Mon</span>
          <span className="h-3 leading-3" />
          <span className="h-3 leading-3">Wed</span>
          <span className="h-3 leading-3" />
          <span className="h-3 leading-3">Fri</span>
          <span className="h-3 leading-3" />
          <span className="h-3 leading-3">Sun</span>
        </div>
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((d, ri) => {
              const intensity = d.minutes === 0 ? 0 : Math.min(1, 0.18 + (d.minutes / max) * 0.82)
              const future = d.date > today
              const isToday = d.date.getTime() === today.getTime()
              return (
                <div
                  key={ri}
                  title={`${d.date.toDateString()} — ${Math.round(d.minutes)} min`}
                  className={`h-3 w-3 rounded-[3px] border ${
                    future ? 'border-transparent bg-paper-2' : 'border-rule'
                  } ${isToday ? '!border-ink-700' : ''}`}
                  style={{
                    backgroundColor: future
                      ? undefined
                      : d.minutes === 0
                      ? '#F2F1EA'
                      : oklchWithAlpha(accent, intensity),
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-600">
        <span>Less</span>
        {[0.18, 0.36, 0.54, 0.72, 0.9].map((o) => (
          <span
            key={o}
            className="h-3 w-3 rounded-[3px] border border-rule"
            style={{ background: oklchWithAlpha(accent, o) }}
          />
        ))}
        <span>More</span>
        <span className="flex-1" />
        <span className="normal-case tracking-normal text-ink-700">
          {totalBlocks} work block{totalBlocks === 1 ? '' : 's'} · {totalHours}h {totalRemMin}m total
        </span>
      </div>
    </div>
  )
}

function oklchWithAlpha(color: string, alpha: number): string {
  // Accept either #rrggbb or oklch(...) — both flow through to color-mix for alpha.
  // Falls back to opacity on the wrapping span if color-mix is unsupported.
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', 'color-mix(in oklab, red, blue)')) {
    return `color-mix(in oklab, ${color} ${Math.round(alpha * 100)}%, #F2F1EA)`
  }
  const m = color.match(/^#([0-9a-f]{6})$/i)
  if (m) {
    const v = parseInt(m[1], 16)
    const r = (v >> 16) & 0xff
    const g = (v >> 8) & 0xff
    const b = v & 0xff
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`
  }
  return color
}
