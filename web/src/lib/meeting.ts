import { useEffect, useState } from 'react'
import { CalendarEvent, nextEvent, parseIcs } from './ics'

export type MeetingSource =
  | { kind: 'none' }
  | { kind: 'manual'; summary: string; startMs: number }
  | { kind: 'ics'; url: string }

export type MeetingStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; next: CalendarEvent | null; fetchedAt: number }

const REFRESH_MS = 5 * 60 * 1000

export function useNextMeeting(source: MeetingSource): MeetingStatus {
  const [status, setStatus] = useState<MeetingStatus>({ state: 'idle' })

  useEffect(() => {
    let cancelled = false
    let timer: number | null = null

    async function tick() {
      if (source.kind === 'none') {
        setStatus({ state: 'idle' })
        return
      }
      if (source.kind === 'manual') {
        if (!Number.isFinite(source.startMs) || source.startMs < Date.now()) {
          setStatus({ state: 'ready', next: null, fetchedAt: Date.now() })
          return
        }
        setStatus({
          state: 'ready',
          fetchedAt: Date.now(),
          next: {
            uid: `manual-${source.startMs}`,
            summary: source.summary || 'Meeting',
            start: source.startMs,
            end: source.startMs + 30 * 60 * 1000,
          },
        })
        return
      }
      setStatus({ state: 'loading' })
      try {
        const res = await fetch(source.url, { credentials: 'omit' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        if (cancelled) return
        const events = parseIcs(text)
        setStatus({ state: 'ready', next: nextEvent(events), fetchedAt: Date.now() })
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Failed to fetch'
        setStatus({ state: 'error', message: msg })
      }
    }

    tick()
    timer = window.setInterval(tick, REFRESH_MS)
    return () => {
      cancelled = true
      if (timer !== null) window.clearInterval(timer)
    }
  }, [source.kind, source.kind === 'ics' ? source.url : '', source.kind === 'manual' ? source.startMs : 0, source.kind === 'manual' ? source.summary : ''])

  return status
}
