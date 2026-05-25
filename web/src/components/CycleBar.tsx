// src/components/CycleBar.tsx
//
// Pomodoro cycle visualization. Drop into web/src/components/.
//
// Renders the rhythm work → short break → work → short break → … → long break
// as a row of segments. Work blocks are 4× wide, short breaks 1× wide,
// the long break 3× wide. Completed segments are filled solid; the active
// segment has an outline and an inner fill clipped to currentProgress.

import { type CSSProperties, type FC } from 'react'

export type CycleBarProps = {
  /** How many work blocks have been completed so far in the current cycle. */
  completedWorkBlocks: number
  /** Are we currently in a break (not a work block)? */
  isInBreak: boolean
  /** 0…1 progress through the *current* segment. */
  currentProgress: number
  /** After this many work blocks, the cycle inserts a long break. */
  cyclesBeforeLongBreak: number
  /** Accent color for work segments (the line color the user picked). */
  accentColor: string
  /** Color for short breaks. */
  shortBreakColor?: string
  /** Color for the long break. */
  longBreakColor?: string
  /** Height in pixels. Defaults to 28. */
  height?: number
  className?: string
}

type Seg =
  | { kind: 'work'; weight: 4; done: boolean; active: boolean }
  | { kind: 'short'; weight: 1; done: boolean; active: boolean }
  | { kind: 'long'; weight: 3; done: boolean; active: boolean }

export const CycleBar: FC<CycleBarProps> = ({
  completedWorkBlocks,
  isInBreak,
  currentProgress,
  cyclesBeforeLongBreak,
  accentColor,
  shortBreakColor = 'oklch(0.72 0.17 145)',
  longBreakColor = 'oklch(0.66 0.18 250)',
  height = 28,
  className,
}) => {
  const segments = buildSegments(completedWorkBlocks, isInBreak, cyclesBeforeLongBreak)
  const totalWeight = segments.reduce((acc, s) => acc + s.weight, 0)

  return (
    <div className={className} style={{ display: 'flex', gap: 6, height }}>
      {segments.map((seg, idx) => {
        const color = colorFor(seg, accentColor, shortBreakColor, longBreakColor)
        const flex = `${seg.weight} 1 0%`
        const segStyle: CSSProperties = {
          flex,
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: seg.done ? color : seg.active ? 'transparent' : 'rgba(0,0,0,0.05)',
          border: seg.active ? `1px solid ${color}` : 'none',
        }
        return (
          <div key={idx} style={segStyle}>
            {seg.active && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${Math.max(0, Math.min(1, currentProgress)) * 100}%`,
                  background: color,
                  transition: 'width 100ms linear',
                }}
              />
            )}
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: '"Geist Mono", ui-monospace, monospace',
                fontSize: 9.5,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: seg.done ? 'white' : seg.active ? color : 'rgba(0,0,0,0.4)',
                pointerEvents: 'none',
              }}
            >
              {label(seg)}
            </span>
          </div>
        )
      })}
    </div>
  )

  // unused but kept for type narrowing of totalWeight if you want to read it elsewhere
  void totalWeight
}

function label(seg: Seg): string {
  switch (seg.kind) {
    case 'work': return '25'
    case 'short': return '5m'
    case 'long': return '15m'
  }
}

function colorFor(seg: Seg, accent: string, short: string, long: string) {
  switch (seg.kind) {
    case 'work': return accent
    case 'short': return short
    case 'long': return long
  }
}

/**
 * Builds the rhythm: [work, short, work, short, …, work, long] where
 * `cyclesBeforeLongBreak` work blocks precede the long break.
 */
function buildSegments(
  completedWorkBlocks: number,
  isInBreak: boolean,
  cyclesBeforeLongBreak: number
): Seg[] {
  const n = Math.max(2, cyclesBeforeLongBreak)
  // We render relative to the *current* cycle position: clamp completed to [0, n].
  const completedInThisCycle = completedWorkBlocks % n
  const out: Seg[] = []
  for (let i = 0; i < n; i++) {
    const workDone = i < completedInThisCycle
    const workActive = i === completedInThisCycle && !isInBreak
    out.push({ kind: 'work', weight: 4, done: workDone, active: workActive })
    if (i < n - 1) {
      const breakIndex = i // there are n-1 short breaks before the long one
      const breakDone = breakIndex < completedInThisCycle - (isInBreak ? 1 : 0)
      const breakActive =
        breakIndex === completedInThisCycle - (isInBreak ? 1 : 0) && isInBreak
      out.push({ kind: 'short', weight: 1, done: breakDone, active: breakActive })
    }
  }
  out.push({ kind: 'long', weight: 3, done: false, active: false })
  return out
}

export default CycleBar
