// Minimal ICS (iCalendar) parser focused on the subset FocusLine cares about:
// - Non-recurring VEVENTs
// - Simple weekly recurrence (RRULE:FREQ=WEEKLY[;BYDAY=...;COUNT=N;UNTIL=...])
// - Simple daily recurrence (RRULE:FREQ=DAILY[;COUNT=N;UNTIL=...])
// Everything fancier (monthly/yearly, EXDATEs, full TZID handling) is ignored.
// We only care about: "is there a meeting in the next 24 hours and when?"

export type CalendarEvent = {
  uid: string
  summary: string
  /** Absolute UTC ms */
  start: number
  /** Absolute UTC ms */
  end: number
}

const HORIZON_DAYS = 14 // how far into the future we expand recurrences

const DAY_MS = 24 * 60 * 60 * 1000

const BYDAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
}

export function parseIcs(text: string, now = Date.now()): CalendarEvent[] {
  // Unfold continued lines: lines beginning with a space or tab are continuations.
  const unfolded: string[] = []
  for (const raw of text.split(/\r?\n/)) {
    if (/^[\s\t]/.test(raw) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += raw.slice(1)
    } else {
      unfolded.push(raw)
    }
  }

  const events: CalendarEvent[] = []
  let cur: Record<string, string> | null = null
  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      cur = {}
    } else if (line === 'END:VEVENT') {
      if (cur && cur.DTSTART && cur.SUMMARY) {
        events.push(...expandEvent(cur, now))
      }
      cur = null
    } else if (cur) {
      const idx = line.indexOf(':')
      if (idx === -1) continue
      const keyWithParams = line.slice(0, idx)
      const value = line.slice(idx + 1)
      const key = keyWithParams.split(';')[0]
      // Preserve TZID/VALUE params by storing them as `KEY;params`
      cur[key] = value
      const params = keyWithParams.includes(';') ? keyWithParams.slice(keyWithParams.indexOf(';') + 1) : ''
      if (params) cur[`${key}_PARAMS`] = params
    }
  }
  return events.sort((a, b) => a.start - b.start)
}

function expandEvent(v: Record<string, string>, now: number): CalendarEvent[] {
  const startMs = parseIcsDate(v.DTSTART, v.DTSTART_PARAMS)
  const endMs = v.DTEND
    ? parseIcsDate(v.DTEND, v.DTEND_PARAMS)
    : startMs + 30 * 60 * 1000
  if (Number.isNaN(startMs)) return []
  const durationMs = endMs - startMs
  const summary = unescape(v.SUMMARY || '(untitled event)')
  const uid = v.UID || `${startMs}-${summary}`

  const rrule = v.RRULE
  if (!rrule) {
    return [{ uid, summary, start: startMs, end: endMs }]
  }

  const parts: Record<string, string> = {}
  for (const seg of rrule.split(';')) {
    const [k, val] = seg.split('=')
    if (k && val !== undefined) parts[k] = val
  }
  const freq = parts.FREQ
  if (freq !== 'WEEKLY' && freq !== 'DAILY') {
    // Unsupported recurrence — at least surface the original instance if it's still in the future
    return startMs > now - durationMs ? [{ uid, summary, start: startMs, end: endMs }] : []
  }

  const until = parts.UNTIL ? parseIcsDate(parts.UNTIL, '') : Infinity
  const count = parts.COUNT ? Number(parts.COUNT) : Infinity
  const horizon = now + HORIZON_DAYS * DAY_MS

  const out: CalendarEvent[] = []

  if (freq === 'DAILY') {
    let occ = 0
    for (let t = startMs; t <= horizon && t <= until && occ < count; t += DAY_MS) {
      if (t + durationMs >= now) {
        out.push({ uid: `${uid}-${t}`, summary, start: t, end: t + durationMs })
      }
      occ++
    }
    return out
  }

  // WEEKLY
  const byday = parts.BYDAY ? parts.BYDAY.split(',').map((d) => BYDAY_MAP[d]).filter((n) => n !== undefined) : null
  let occ = 0
  // Walk day-by-day up to horizon
  for (let t = startMs; t <= horizon && t <= until && occ < count; t += DAY_MS) {
    const dow = new Date(t).getDay()
    if (byday) {
      if (!byday.includes(dow)) continue
    } else if ((t - startMs) % (7 * DAY_MS) !== 0) {
      continue
    }
    if (t + durationMs >= now) {
      out.push({ uid: `${uid}-${t}`, summary, start: t, end: t + durationMs })
    }
    occ++
  }
  return out
}

function parseIcsDate(value: string, params: string): number {
  // Forms:
  //   20260520T140000Z              → UTC
  //   20260520T140000               → floating (treat as local)
  //   20260520                      → all-day (DATE)
  //   TZID=...;DTSTART:20260520T140000 → params has TZID — we approximate as local
  const isAllDay = /^\d{8}$/.test(value)
  if (isAllDay) {
    const y = Number(value.slice(0, 4))
    const m = Number(value.slice(4, 6)) - 1
    const d = Number(value.slice(6, 8))
    return new Date(y, m, d, 0, 0, 0, 0).getTime()
  }
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/)
  if (!m) return NaN
  const [, Y, Mo, D, H, Mi, S, Z] = m
  if (Z === 'Z' || /TZID=UTC/i.test(params)) {
    return Date.UTC(+Y, +Mo - 1, +D, +H, +Mi, +S)
  }
  // Treat as local time (best-effort — proper TZID handling would need IANA tz data)
  return new Date(+Y, +Mo - 1, +D, +H, +Mi, +S).getTime()
}

function unescape(s: string): string {
  return s.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ').replace(/\\\\/g, '\\')
}

/** Next event starting from `now` within the next 24 hours, if any. */
export function nextEvent(events: CalendarEvent[], now = Date.now()): CalendarEvent | null {
  const cutoff = now + DAY_MS
  for (const e of events) {
    if (e.start >= now && e.start <= cutoff) return e
  }
  return null
}
