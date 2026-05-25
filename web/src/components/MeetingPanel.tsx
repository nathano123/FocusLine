import { useEffect, useState } from 'react'
import { MeetingSource, useNextMeeting } from '../lib/meeting'

export function MeetingPanel({
  source,
  setSource,
  accent,
}: {
  source: MeetingSource
  setSource: (s: MeetingSource) => void
  accent: string
}) {
  const status = useNextMeeting(source)
  const [mode, setMode] = useState<'ics' | 'manual'>(source.kind === 'manual' ? 'manual' : 'ics')

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow"><span className="num">05</span>Meeting countdown</h2>
        {source.kind !== 'none' && (
          <button
            onClick={() => setSource({ kind: 'none' })}
            className="font-mono text-[11px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
          >
            Disable
          </button>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-rule bg-white p-4">
        <NextMeetingDisplay status={status} accent={accent} />

        <div className="mt-5 flex gap-1 rounded-lg bg-paper-2 p-1 text-sm">
          <button
            onClick={() => setMode('ics')}
            className={`flex-1 rounded-md px-3 py-1.5 transition ${
              mode === 'ics' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Calendar feed
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 rounded-md px-3 py-1.5 transition ${
              mode === 'manual' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Manual
          </button>
        </div>

        {mode === 'ics' ? (
          <IcsForm source={source} setSource={setSource} />
        ) : (
          <ManualForm source={source} setSource={setSource} />
        )}
      </div>
    </section>
  )
}

function NextMeetingDisplay({
  status,
  accent,
}: {
  status: ReturnType<typeof useNextMeeting>
  accent: string
}) {
  const now = useNow(1000)

  if (status.state === 'idle') {
    return <p className="text-sm text-ink-600">No meeting countdown configured.</p>
  }
  if (status.state === 'loading') {
    return <p className="text-sm text-ink-600">Loading calendar…</p>
  }
  if (status.state === 'error') {
    return (
      <p className="text-sm" style={{ color: 'oklch(0.55 0.20 28)' }}>
        Couldn't load calendar: {status.message}. Many providers block cross-origin fetches — Google Calendar's
        public iCal URLs work; others may not.
      </p>
    )
  }
  const next = status.next
  if (!next) {
    return <p className="text-sm text-ink-600">No upcoming meeting in the next 24 hours.</p>
  }
  const remainingMs = Math.max(0, next.start - now)
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">Next meeting</div>
        <div className="mt-1 text-lg font-medium tracking-tight text-ink-950">{next.summary}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-3xl font-medium tabular-nums" style={{ color: accent }}>
          {formatCountdown(remainingMs)}
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">{formatLocal(next.start)}</div>
      </div>
    </div>
  )
}

function IcsForm({ source, setSource }: { source: MeetingSource; setSource: (s: MeetingSource) => void }) {
  const [url, setUrl] = useState(source.kind === 'ics' ? source.url : '')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = url.trim()
        if (trimmed) setSource({ kind: 'ics', url: trimmed })
      }}
      className="mt-4 space-y-3"
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        type="url"
        placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
        className="w-full rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-ink-700 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-500">
          Secret iCal URL · refreshed every 5 minutes · stored locally
        </p>
        <button type="submit" className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
      </div>
    </form>
  )
}

function ManualForm({ source, setSource }: { source: MeetingSource; setSource: (s: MeetingSource) => void }) {
  const defaultTime =
    source.kind === 'manual' && source.startMs > Date.now()
      ? toTimeString(source.startMs)
      : toTimeString(Date.now() + 60 * 60 * 1000)
  const [summary, setSummary] = useState(source.kind === 'manual' ? source.summary : '')
  const [time, setTime] = useState(defaultTime)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const [h, m] = time.split(':').map(Number)
        const target = new Date()
        target.setHours(h, m, 0, 0)
        if (target.getTime() < Date.now()) target.setDate(target.getDate() + 1)
        setSource({ kind: 'manual', summary: summary || 'Meeting', startMs: target.getTime() })
      }}
      className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
    >
      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="What’s the meeting?"
        className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-ink-500 focus:outline-none"
      />
      <input
        value={time}
        onChange={(e) => setTime(e.target.value)}
        type="time"
        className="rounded-lg border border-rule bg-paper px-3 py-2 text-sm text-ink-900 focus:border-ink-700 focus:outline-none"
      />
      <button type="submit" className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white">
        Set
      </button>
    </form>
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

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatLocal(ms: number): string {
  const d = new Date(ms)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return sameDay ? `today at ${time}` : `${d.toLocaleDateString(undefined, { weekday: 'short' })} at ${time}`
}

function toTimeString(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
