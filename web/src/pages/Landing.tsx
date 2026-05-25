import { useEffect, useRef, useState } from 'react'

const COLORS = [
  { name: 'Tomato', value: 'oklch(0.66 0.21 28)' },
  { name: 'Cobalt', value: 'oklch(0.66 0.18 250)' },
  { name: 'Spring', value: 'oklch(0.72 0.17 145)' },
  { name: 'Amber', value: 'oklch(0.78 0.16 80)' },
  { name: 'Violet', value: 'oklch(0.62 0.22 310)' },
  { name: 'Graphite', value: 'oklch(0.20 0.01 80)' },
]
const THICKNESSES = [
  { name: 'Thin', px: 2 },
  { name: 'Med', px: 4 },
  { name: 'Bold', px: 7 },
  { name: 'Slab', px: 12 },
]
const DURATIONS = [5, 15, 25, 50]

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="bg-paper text-ink-900">
      <ScrollProgress />
      <FloatingLine />

      {/* Nav */}
      <Nav onLaunch={onLaunch} />

      {/* Hero */}
      <header className="mx-auto max-w-[1240px] px-8 pb-10 pt-20 sm:pt-24">
        <div className="animate-slide-up">
          <div className="eyebrow mb-7"><span>v1.0 · all platforms</span></div>
          <h1 className="m-0 max-w-[14ch] text-balance text-[clamp(48px,7.6vw,104px)] font-medium leading-[0.95] tracking-tighter">
            Focus without<br />
            <em className="hero-em not-italic" style={{ color: 'var(--accent)' }}>
              watching the clock.
            </em>
          </h1>
          <p className="mt-7 max-w-[52ch] text-[clamp(17px,1.6vw,21px)] leading-snug text-ink-800">
            FocusLine is an ambient focus timer. Instead of a countdown number competing for your attention,
            a thin line at the edge of your screen fills as time elapses. You sense the progress — you
            don't stare at it.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3.5">
            <button onClick={onLaunch} className="btn-primary">
              Launch FocusLine
              <ArrowRight />
            </button>
            <a href="#customize" className="btn-ghost">
              Try it live
              <ArrowRight />
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-5 font-mono text-[12px] text-ink-600">
            <span className="inline-flex items-center gap-2"><Dot /> Free &amp; open source</span>
            <span className="inline-flex items-center gap-2"><Dot /> Web, macOS, iOS</span>
            <span className="inline-flex items-center gap-2"><Dot /> No account, no tracking</span>
          </div>
        </div>

        <div className="mt-20 grid items-center gap-16 md:grid-cols-[1.25fr_1fr]">
          <div>
            <div className="eyebrow mb-4"><span className="num">A1</span>The whole product</div>
            <h2 className="m-0 max-w-[18ch] text-balance text-[clamp(28px,3.5vw,44px)] font-medium leading-[1.05] tracking-tight">
              One line. One menubar icon. Or one tab. That's it.
            </h2>
            <p className="mt-4 max-w-[46ch] text-[16px] text-ink-800">
              No floating windows. No popovers. No notifications you have to dismiss. The timer lives where
              focus tools should — out of the way until you need it.
            </p>
          </div>
          <MiniScreen />
        </div>
      </header>

      <Rule />

      {/* Why a line */}
      <section id="why" className="mx-auto max-w-[1240px] px-8 py-24">
        <div className="eyebrow mb-5"><span className="num">01</span>Why a line?</div>
        <h2 className="m-0 max-w-[18ch] text-balance text-[clamp(36px,5vw,64px)] font-medium leading-[1.0] tracking-tight">
          A timer should be{' '}
          <em className="not-italic" style={{ color: 'var(--accent)' }}>felt</em>, not watched.
        </h2>
        <p className="mt-5 max-w-[56ch] text-[clamp(17px,1.4vw,19px)] text-ink-800">
          Every other focus app shouts a giant countdown at you. The numbers tick down. You glance. You
          glance again. The whole point of a focus timer is to <em>not</em> look at it — so we removed
          everything you could look at.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <BadCard />
          <GoodCard />
        </div>
      </section>

      <Rule />

      {/* Customizer */}
      <section id="customize" className="mx-auto max-w-[1240px] px-8 py-24">
        <div className="eyebrow mb-5"><span className="num">02</span>Make it yours</div>
        <h2 className="m-0 max-w-[18ch] text-balance text-[clamp(36px,5vw,64px)] font-medium leading-[1.0] tracking-tight">
          Try the timer right here.
        </h2>
        <p className="mt-5 max-w-[56ch] text-[clamp(17px,1.4vw,19px)] text-ink-800">
          Pick a color, a thickness, a duration. The preview runs in real-time. Hit start — the line
          fills across the top of the preview the same way it would across your screen.
        </p>
        <Customizer onLaunch={onLaunch} />
      </section>

      <Rule />

      {/* Day plan */}
      <section id="plan" className="mx-auto max-w-[1240px] px-8 py-24">
        <div className="grid items-start gap-16 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="eyebrow mb-5"><span className="num">03</span>The new bit</div>
            <h2 className="m-0 max-w-[16ch] text-balance text-[clamp(36px,5vw,64px)] font-medium leading-[1.0] tracking-tight">
              Or let the line carry your whole day.
            </h2>
            <p className="mt-5 max-w-[48ch] text-[17px] text-ink-800">
              Add your tasks with estimated minutes. The line becomes your day, segmented into the work
              ahead. The current task lives on the line. The big number tells you how much time you have
              left on it. The small line beneath whispers what's next.
            </p>
            <ul className="mt-6 space-y-2 text-[15px] text-ink-800">
              <li className="flex gap-3"><Tick />Current task surfaced inline, no window switching</li>
              <li className="flex gap-3"><Tick />Auto-advance with a chime between tasks</li>
              <li className="flex gap-3"><Tick />Glance the line and you know: how far, what's next</li>
              <li className="flex gap-3"><Tick />Skip, finish early, or pause without losing the plan</li>
            </ul>
            <button onClick={onLaunch} className="btn-primary mt-8">
              Plan your day
              <ArrowRight />
            </button>
          </div>
          <DayPlanDemo />
        </div>
      </section>

      <Rule />

      {/* Menubar */}
      <section className="mx-auto max-w-[1240px] px-8 py-24">
        <div className="grid items-center gap-20 md:grid-cols-2">
          <div>
            <div className="eyebrow mb-5"><span className="num">04</span>The whole interface</div>
            <h2 className="m-0 max-w-[18ch] text-balance text-[clamp(36px,5vw,64px)] font-medium leading-[1.0] tracking-tight">
              Controls live in the menubar.
            </h2>
            <p className="mt-5 max-w-[56ch] text-[17px] text-ink-800">
              On macOS, click the menubar icon for presets, custom durations, color, thickness, and
              pause/resume. No window to manage. No keyboard shortcut to memorize — though there is one
              if you want it.
            </p>
            <div className="mt-7 space-y-3">
              <ShortcutRow keyLabel="⌃⌥⌘F" desc="Start / pause / resume from anywhere" />
              <ShortcutRow keyLabel="⌘P" desc="Play / pause the current session" />
              <ShortcutRow keyLabel="⌘." desc="Cancel and reset" />
              <ShortcutRow keyLabel="⌘1–4" desc="Start a 5 / 15 / 25 / 50 min preset" />
            </div>
          </div>
          <MenubarMock />
        </div>
      </section>

      <Rule />

      {/* Features grid */}
      <section id="features" className="mx-auto max-w-[1240px] px-8 py-24">
        <div className="eyebrow mb-5"><span className="num">05</span>Every detail</div>
        <h2 className="m-0 max-w-[18ch] text-balance text-[clamp(36px,5vw,64px)] font-medium leading-[1.0] tracking-tight">
          Small app. Considered choices.
        </h2>
        <p className="mt-5 max-w-[56ch] text-[17px] text-ink-800">
          FocusLine does a small number of things deliberately well — and gets out of your way the rest
          of the time.
        </p>
        <FeaturesGrid />
      </section>

      {/* Download */}
      <section id="download" className="relative mt-24 overflow-hidden bg-ink-950 px-8 py-28 text-white">
        <div className="absolute left-0 top-0 h-1 w-full origin-left animate-pulse" style={{ background: 'var(--accent)' }} />
        <div className="mx-auto max-w-[1240px]">
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <span className="num" style={{ color: 'var(--accent)' }}>06</span>Ship it
          </div>
          <div className="mt-8 grid items-end gap-20 md:grid-cols-[2fr_1fr]">
            <div>
              <h2 className="m-0 max-w-[16ch] text-balance text-[clamp(48px,7vw,92px)] font-medium leading-[0.95] tracking-tighter">
                Quiet your screen.<br />Get more done.
              </h2>
              <p className="mt-7 max-w-[56ch] text-[18px] text-white/65">
                FocusLine is free and open source. One install, no account, no analytics. Works offline.
                Use the web app on any device, or grab the native macOS menubar build.
              </p>
              <div className="mt-8 flex flex-wrap gap-5 font-mono text-[11px] uppercase tracking-widest text-white/55">
                <span>↳ macOS 13 Ventura or later</span>
                <span>↳ Web app · Mac · iOS · Windows · Android · Linux</span>
                <span>↳ v1.0</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 text-ink-950">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-medium tracking-tight">Free</span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-600">MIT license</span>
              </div>
              <button onClick={onLaunch} className="relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-ink-950 px-5 py-4 text-[15px] font-medium text-white">
                <ArrowDown />
                Launch web app
              </button>
              <a
                href="https://github.com/nathano123/FocusLine/releases"
                target="_blank"
                rel="noreferrer"
                className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-600 hover:text-ink-900"
              >
                Download for macOS →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-8 px-8 py-16">
        <div className="flex max-w-[36ch] flex-col gap-2">
          <a href="#" className="inline-flex items-center gap-2.5">
            <span className="brand-mark" />
            <span className="text-[16px] font-semibold tracking-normal">FocusLine</span>
          </a>
          <p className="m-0 text-[13px] leading-relaxed text-ink-600">
            An ambient focus timer that quietly carries your day. Made because every Pomodoro app got the
            form factor wrong.
          </p>
        </div>
        <div className="flex flex-wrap gap-14">
          <FooterCol title="Product" links={[
            { href: '#why', label: 'Why a line' },
            { href: '#customize', label: 'Customize' },
            { href: '#plan', label: 'Day plan' },
            { href: '#download', label: 'Download' },
          ]} />
          <FooterCol title="Source" links={[
            { href: 'https://github.com/nathano123/FocusLine', label: 'GitHub' },
            { href: 'https://github.com/nathano123/FocusLine/releases', label: 'Releases' },
            { href: 'https://github.com/nathano123/FocusLine/issues', label: 'Report bug' },
          ]} />
          <FooterCol title="Soon" links={[
            { href: '#', label: 'Calendar bridge' },
            { href: '#', label: 'Ambient mode SDK' },
            { href: '#', label: 'CI status line' },
          ]} />
        </div>
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Nav({ onLaunch }: { onLaunch: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav
      className={`sticky top-0 z-30 backdrop-blur-md transition ${
        scrolled ? 'border-b border-rule' : 'border-b border-transparent'
      }`}
      style={{ background: 'color-mix(in oklab, #FAFAF7 80%, transparent)' }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-8 py-4">
        <a href="#" className="flex items-center gap-2.5">
          <span className="brand-mark" />
          <span className="text-[17px] font-semibold tracking-normal">FocusLine</span>
        </a>
        <div className="hidden gap-7 text-[14.5px] text-ink-800 sm:flex">
          <a href="#why" className="hover:text-ink-950">Why</a>
          <a href="#customize" className="hover:text-ink-950">Customize</a>
          <a href="#plan" className="hover:text-ink-950">Day plan</a>
          <a href="#features" className="hover:text-ink-950">Features</a>
          <a href="#download" className="hover:text-ink-950">Download</a>
        </div>
        <button onClick={onLaunch} className="nav-cta">
          Launch app
          <ArrowRight />
        </button>
      </div>
    </nav>
  )
}

function FloatingLine() {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const cycle = 30_000
      let p = ((now - start) % cycle) / cycle
      if (p > 0.93) p = 0.93 + (1 - 0.93) * Math.min(1, (p - 0.93) / 0.04)
      if (ref.current) ref.current.style.width = `${(p * 100).toFixed(2)}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-40 h-1"
      style={{ background: 'var(--accent)', width: 0 }}
      aria-hidden
    />
  )
}

function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const pct = Math.min(100, (doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight)) * 100)
      if (ref.current) ref.current.style.width = `${pct}%`
    }
    document.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => document.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-50 h-[3px] w-0 transition-[width] duration-100"
      style={{ background: 'var(--accent)' }}
      aria-hidden
    />
  )
}

function Rule() {
  return <div className="mx-auto h-px max-w-[1240px] bg-rule" />
}

function Dot() {
  return <span className="h-[5px] w-[5px] rounded-full bg-ink-400" />
}

function Tick() {
  return (
    <span className="mt-1.5 h-1.5 w-3.5 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} aria-hidden />
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8m0 0L7 3m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v8m0 0l-3-3m3 3l3-3M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Hero mini-screen mockup ────────────────────────────────────────────────
function MiniScreen() {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    let raf = 0
    const t = (n: number) => { setNow(n); raf = requestAnimationFrame(t) }
    raf = requestAnimationFrame(t)
    return () => cancelAnimationFrame(raf)
  }, [])
  const cycle = 30_000
  let p = (now % cycle) / cycle
  if (p > 0.93) p = 0.93 + (1 - 0.93) * Math.min(1, (p - 0.93) / 0.04)
  const remaining = Math.max(0, Math.round(25 * 60 * (1 - p)))
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl p-1 shadow-2xl"
         style={{ background: 'linear-gradient(160deg, #c6c2b6 0%, #8a8578 100%)' }}>
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#1a1a17]">
        <div className="relative flex h-6 shrink-0 items-center gap-3.5 border-b border-white/5 bg-white/5 px-2.5 text-[11px] text-white/85 backdrop-blur">
          <span className="h-[9px] w-[9px] rounded-sm bg-white/90" />
          <span className="font-medium">Xcode</span>
          <span className="opacity-60">File</span>
          <span className="opacity-60">Edit</span>
          <span className="opacity-60">View</span>
          <span className="flex-1" />
          <span className="relative inline-block h-[11px] w-[11px] rounded-full border-[1.5px] border-white/85" />
          <span className="font-mono text-[10px] opacity-70 tabular-nums">{mm}:{ss}</span>
        </div>
        <div className="absolute left-0 top-6 z-10 h-1" style={{ width: `${p * 100}%`, background: 'var(--accent)' }} />
        <div className="flex-1 p-4.5">
          <div className="flex h-full flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.04] p-3">
            <div className="flex gap-1.5">
              <i className="h-2 w-2 rounded-full" style={{ background: '#ff5f57' }} />
              <i className="h-2 w-2 rounded-full" style={{ background: '#febc2e' }} />
              <i className="h-2 w-2 rounded-full" style={{ background: '#28c840' }} />
            </div>
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="h-1.5 w-[70%] rounded bg-white/10" />
              <div className="h-1.5 w-full rounded bg-white/10" />
              <div className="h-1.5 w-[40%] rounded bg-white/10" />
              <div className="h-1.5 w-[70%] rounded bg-white/10" />
              <div className="h-1.5 w-full rounded bg-white/10" />
              <div className="h-1.5 w-[40%] rounded bg-white/10" />
              <div className="h-1.5 w-[70%] rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Why a line: bad / good cards ───────────────────────────────────────────
function BadCard() {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    let raf = 0
    const t = (n: number) => { setNow(n); raf = requestAnimationFrame(t) }
    raf = requestAnimationFrame(t)
    return () => cancelAnimationFrame(raf)
  }, [])
  const cycle = 30_000
  let p = (now % cycle) / cycle
  if (p > 0.93) p = 0.93 + (1 - 0.93) * Math.min(1, (p - 0.93) / 0.04)
  const remaining = Math.max(0, Math.round(25 * 60 * (1 - p)))
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-paper-2 p-8">
      <h3 className="m-0 font-mono text-[13px] font-medium uppercase tracking-widest text-ink-600">The usual</h3>
      <div className="relative mt-5 grid h-60 place-items-center overflow-hidden rounded-xl border border-white/5 bg-[#0F0F0E]">
        <span className="absolute left-3.5 top-3.5 font-mono text-[10.5px] uppercase tracking-widest text-white/40">Countdown timer</span>
        <span className="font-mono text-[88px] font-medium tabular-nums tracking-tight text-white">{mm}:{ss}</span>
      </div>
      <p className="mt-5 text-[22px] font-medium leading-snug tracking-tight">Pulls your eye every few seconds.</p>
      <p className="mt-2 max-w-[30ch] text-[14.5px] text-ink-800">
        Big foreground numbers create urgency, then anxiety, then a habit of checking. The opposite of flow.
      </p>
    </div>
  )
}

function GoodCard() {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    let raf = 0
    const t = (n: number) => { setNow(n); raf = requestAnimationFrame(t) }
    raf = requestAnimationFrame(t)
    return () => cancelAnimationFrame(raf)
  }, [])
  const cycle = 30_000
  let p = (now % cycle) / cycle
  if (p > 0.93) p = 0.93 + (1 - 0.93) * Math.min(1, (p - 0.93) / 0.04)
  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-white p-8">
      <h3 className="m-0 font-mono text-[13px] font-medium uppercase tracking-widest text-ink-600">FocusLine</h3>
      <div className="relative mt-5 h-60 overflow-hidden rounded-xl border border-white/5 bg-[#0F0F0E]">
        <div className="absolute left-0 top-0 h-1" style={{ width: `${p * 100}%`, background: 'var(--accent)' }} />
        <div className="flex h-full flex-col gap-2.5 p-7">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-white/40">Ambient progress line</span>
          <div className="mt-2.5 h-1.5 w-[90%] rounded bg-white/[0.07]" />
          <div className="h-1.5 w-[70%] rounded bg-white/[0.07]" />
          <div className="h-1.5 w-[80%] rounded bg-white/[0.07]" />
          <div className="h-1.5 w-[50%] rounded bg-white/[0.07]" />
          <div className="h-1.5 w-[90%] rounded bg-white/[0.07]" />
          <div className="h-1.5 w-[70%] rounded bg-white/[0.07]" />
        </div>
      </div>
      <p className="mt-5 text-[22px] font-medium leading-snug tracking-tight">Sits in peripheral vision.</p>
      <p className="mt-2 max-w-[30ch] text-[14.5px] text-ink-800">
        Your brain registers the line's growth without focal attention. You know how far you've come
        without breaking flow.
      </p>
    </div>
  )
}

// ── Customizer ─────────────────────────────────────────────────────────────
function Customizer({ onLaunch }: { onLaunch: () => void }) {
  const [colorIdx, setColorIdx] = useState(0)
  const [thickIdx, setThickIdx] = useState(1)
  const [duration, setDuration] = useState(25)
  const [running, setRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const speed = 6
  const rafRef = useRef(0)
  const lastRef = useRef(performance.now())
  useEffect(() => {
    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      if (running) {
        setElapsed(e => {
          const total = duration * 60
          const next = e + dt * speed
          return next >= total ? 0 : next
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, duration])
  useEffect(() => setElapsed(0), [duration])

  const total = duration * 60
  const p = Math.min(1, elapsed / total)
  const remaining = Math.max(0, Math.round(total - elapsed))
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const elMm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const elSs = String(Math.floor(elapsed % 60)).padStart(2, '0')
  const color = COLORS[colorIdx].value
  const thick = THICKNESSES[thickIdx].px

  return (
    <div className="mt-14 grid items-stretch gap-14 md:grid-cols-[1.4fr_1fr]">
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl shadow-2xl"
           style={{ background: 'linear-gradient(160deg, #1a1a17 0%, #0a0a0a 100%)' }}>
        <div className="absolute left-0 top-0 z-[2]" style={{ width: `${p * 100}%`, height: thick, background: color, transition: 'height .2s ease' }} />
        <div className="relative z-[3] flex h-7 shrink-0 items-center gap-4.5 border-b border-white/5 bg-white/5 px-3.5 text-[12px] text-white/85 backdrop-blur">
          <span className="h-2.5 w-2.5 rounded-sm bg-white/85" />
          <span className="font-semibold">Xcode</span>
          <span className="opacity-55">File</span>
          <span className="opacity-55">Edit</span>
          <span className="opacity-55">View</span>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] opacity-85 tabular-nums">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: `conic-gradient(${color} ${(p * 100).toFixed(1)}%, rgba(255,255,255,0.2) 0)` }} />
            {mm}:{ss}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-9 font-mono text-[12px] text-white/60">
          <CodeLine n={1}>{<span className="text-white/30">// TimerModel.swift</span>}</CodeLine>
          <CodeLine n={2}>{<><span className="text-[#C8A8FF]">import</span> SwiftUI</>}</CodeLine>
          <CodeLine n={3}>&nbsp;</CodeLine>
          <CodeLine n={4}>{<><span className="text-[#C8A8FF]">class</span> TimerModel: ObservableObject {'{'}</>}</CodeLine>
          <CodeLine n={5}>{<>  <span className="text-[#C8A8FF]">@Published var</span> progress: <span className="text-[#C8A8FF]">Double</span> = 0</>}</CodeLine>
          <CodeLine n={6}>{<>  <span className="text-[#C8A8FF]">@Published var</span> isRunning: <span className="text-[#C8A8FF]">Bool</span> = <span className="text-[#C8A8FF]">false</span></>}</CodeLine>
          <CodeLine n={7}>{<>  <span className="text-[#C8A8FF]">let</span> duration: TimeInterval = <span className="text-[#98E5A0]">{duration * 60}</span></>}</CodeLine>
          <CodeLine n={8}>&nbsp;</CodeLine>
          <CodeLine n={9}>{<>  <span className="text-[#C8A8FF]">func</span> tick() {'{'}</>}</CodeLine>
          <CodeLine n={10}>{<>    progress += 0.1 / duration<span style={{ color: 'var(--accent)' }}>{running ? ' ▍' : ''}</span></>}</CodeLine>
          <CodeLine n={11}>{'  }'}</CodeLine>
          <CodeLine n={12}>{'}'}</CodeLine>
        </div>
        <div className="absolute bottom-5 right-6 z-[4] flex gap-3.5 font-mono text-[11px] uppercase tracking-widest text-white/50">
          <span>Elapsed <span className="text-white">{elMm}:{elSs}</span></span>
          <span>Remaining <span className="text-white">{mm}:{ss}</span></span>
        </div>
      </div>

      <div className="flex flex-col gap-7">
        <Control label="Duration">
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-[10px] border bg-white px-0 py-3 font-mono text-[13px] transition ${
                  duration === d ? 'border-ink-950 bg-ink-950 text-white' : 'border-rule text-ink-800 hover:border-ink-600'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </Control>
        <Control label="Line color">
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setColorIdx(i)}
                aria-label={c.name}
                title={c.name}
                className={`h-9 w-9 rounded-full border-2 p-[3px] transition hover:scale-105 ${
                  colorIdx === i ? 'border-ink-950' : 'border-transparent'
                }`}
              >
                <span className="block h-full w-full rounded-full" style={{ background: c.value }} />
              </button>
            ))}
          </div>
        </Control>
        <Control label="Line thickness">
          <div className="flex gap-2">
            {THICKNESSES.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setThickIdx(i)}
                className={`flex flex-1 flex-col items-center gap-2 rounded-[10px] border bg-white py-3.5 transition ${
                  thickIdx === i ? 'border-ink-950' : 'border-rule hover:border-ink-600'
                }`}
              >
                <span className="block w-7 rounded-[2px]" style={{ height: t.px, background: color }} />
                <span className="font-mono text-[10.5px] text-ink-600">{t.name}</span>
              </button>
            ))}
          </div>
        </Control>
        <div className="mt-1 flex gap-2">
          <button
            onClick={() => setRunning(r => !r)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-ink-950 px-4 py-3.5 text-[14px] font-medium text-white"
          >
            {running ? (<><PauseGlyph /> Pause</>) : (<><PlayGlyph /> Start</>)}
          </button>
          <button
            onClick={() => setElapsed(0)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-rule bg-white px-4 py-3.5 text-[14px] font-medium text-ink-900 hover:border-ink-950"
          >
            Reset
          </button>
        </div>
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-600">
          Preview is running 6× real-time. In the app it's smooth, second-by-second.
        </p>
        <button onClick={onLaunch} className="mt-1 self-start font-mono text-[12px] uppercase tracking-widest text-ink-700 underline-offset-4 hover:text-ink-950 hover:underline">
          Open the full app →
        </button>
      </div>
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-3 block font-mono text-[11px] uppercase tracking-widest text-ink-600">{label}</label>
      {children}
    </div>
  )
}

function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 shrink-0 text-right text-white/20 tabular-nums">{n}</span>
      <span>{children}</span>
    </div>
  )
}

function PauseGlyph() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <rect x="0" y="0" width="3" height="12" fill="currentColor" />
      <rect x="7" y="0" width="3" height="12" fill="currentColor" />
    </svg>
  )
}
function PlayGlyph() {
  return <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M0 0L10 6L0 12V0Z" fill="currentColor" /></svg>
}

// ── Day plan demo ──────────────────────────────────────────────────────────
function DayPlanDemo() {
  const tasks = [
    { title: 'Standup notes', minutes: 10 },
    { title: 'Ship onboarding PR', minutes: 45 },
    { title: 'Inbox triage', minutes: 15 },
    { title: 'Design review', minutes: 30 },
    { title: 'Write changelog', minutes: 20 },
  ]
  const totalMin = tasks.reduce((s, t) => s + t.minutes, 0)
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    let raf = 0
    const t = (n: number) => { setNow(n); raf = requestAnimationFrame(t) }
    raf = requestAnimationFrame(t)
    return () => cancelAnimationFrame(raf)
  }, [])
  const cycle = 24_000
  const p = (now % cycle) / cycle
  // Compute which task we're "in"
  let acc = 0
  let activeIdx = 0
  for (let i = 0; i < tasks.length; i++) {
    const slice = tasks[i].minutes / totalMin
    if (p < acc + slice) { activeIdx = i; break }
    acc += slice
  }
  const active = tasks[activeIdx]
  const sliceStart = acc
  const sliceFrac = active.minutes / totalMin
  const taskP = Math.min(1, (p - sliceStart) / sliceFrac)
  const taskRemainingSec = Math.round(active.minutes * 60 * (1 - taskP))
  const taskMm = String(Math.floor(taskRemainingSec / 60)).padStart(2, '0')
  const taskSs = String(taskRemainingSec % 60).padStart(2, '0')
  const next = tasks[activeIdx + 1]
  const dayRemainingMin = Math.round(totalMin * (1 - p))

  return (
    <div className="rounded-2xl border border-rule bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">Now</div>
          <div className="mt-1 text-2xl font-medium tracking-tight text-ink-950">{active.title}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-3xl font-medium tabular-nums text-ink-950">{taskMm}:{taskSs}</div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-600">left on task</div>
        </div>
      </div>

      {/* Segmented day line */}
      <div className="mt-5 relative h-2 w-full overflow-hidden rounded-full bg-ink-200">
        {tasks.map((task, i) => {
          let leftAcc = 0
          for (let k = 0; k < i; k++) leftAcc += tasks[k].minutes / totalMin
          const widthPct = (task.minutes / totalMin) * 100
          const offsetPct = leftAcc * 100
          let fillPct = 0
          if (i < activeIdx) fillPct = 100
          else if (i === activeIdx) fillPct = taskP * 100
          return (
            <div
              key={i}
              className="absolute top-0 h-full overflow-hidden"
              style={{ left: `${offsetPct}%`, width: `calc(${widthPct}% - 1px)` }}
            >
              <div
                className="h-full transition-[width] duration-100 ease-linear"
                style={{
                  width: `${fillPct}%`,
                  background: 'var(--accent)',
                  opacity: i < activeIdx ? 0.45 : 1,
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
        <div className="truncate text-ink-700">
          {next ? (
            <>
              <span className="text-ink-500">Up next:</span>{' '}
              <span className="text-ink-900">{next.title}</span>
              <span className="text-ink-500"> · {next.minutes}m</span>
            </>
          ) : (
            <span className="text-ink-500">Last task</span>
          )}
        </div>
        <div className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-ink-600">
          {dayRemainingMin}m left today
        </div>
      </div>

      <ul className="mt-5 divide-y divide-rule border-t border-rule">
        {tasks.map((task, i) => (
          <li key={i} className={`flex items-center gap-3 py-2.5 text-sm ${i === activeIdx ? 'text-ink-950' : i < activeIdx ? 'text-ink-500 line-through' : 'text-ink-800'}`}>
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                i < activeIdx ? 'border-ink-700 bg-ink-700 text-white' : i === activeIdx ? 'border-ink-950' : 'border-ink-400'
              }`}
            >
              {i < activeIdx && (
                <svg width="8" height="8" viewBox="0 0 14 14" fill="none"><path d="M3 7.2 5.8 10 11 4.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
            <span className="flex-1 truncate">{task.title}</span>
            <span className="font-mono text-[11px] text-ink-600">{task.minutes}m</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Menubar mock ───────────────────────────────────────────────────────────
function MenubarMock() {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    let raf = 0
    const t = (n: number) => { setNow(n); raf = requestAnimationFrame(t) }
    raf = requestAnimationFrame(t)
    return () => cancelAnimationFrame(raf)
  }, [])
  const cycle = 30_000
  let p = (now % cycle) / cycle
  if (p > 0.93) p = 0.93 + (1 - 0.93) * Math.min(1, (p - 0.93) / 0.04)
  const remaining = Math.max(0, Math.round(25 * 60 * (1 - p)))
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  return (
    <div className="relative min-h-[360px] rounded-2xl p-3.5" style={{ background: 'linear-gradient(160deg, #f0eee5 0%, #d6d3c6 100%)' }}>
      <div className="relative flex h-6 items-center gap-3.5 rounded-md bg-white/60 px-2.5 text-[11.5px] text-black/80 backdrop-blur">
        <span className="font-semibold">Finder</span>
        <span className="font-mono text-[10.5px] opacity-60">File</span>
        <span className="font-mono text-[10.5px] opacity-60">Edit</span>
        <span className="font-mono text-[10.5px] opacity-60">View</span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-950 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-white">
          <span className="h-[9px] w-[9px] rounded-full" style={{ background: `conic-gradient(var(--accent) ${(p * 100).toFixed(1)}%, rgba(255,255,255,0.25) 0)` }} />
          {mm}:{ss}
        </span>
        <span className="font-mono text-[10.5px] opacity-60">100%</span>
        <span className="font-mono text-[10.5px] opacity-60">Wed 9:02</span>
      </div>
      <div className="absolute right-6 top-12 w-[246px] rounded-xl p-1.5 text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_30px_60px_-20px_rgba(0,0,0,0.25)] backdrop-blur"
           style={{ background: 'rgba(245,243,236,0.92)' }}>
        <DropdownRow label="Start 5 min" k="⌘1" />
        <DropdownRow label="Start 15 min" k="⌘2" />
        <DropdownRow label="Start 25 min" k="⌘3" active />
        <DropdownRow label="Start 50 min" k="⌘4" />
        <div className="my-1 mx-1.5 h-px bg-black/10" />
        <DropdownRow label="Custom duration…" k="⌘D" />
        <DropdownRow label="Start day plan" k="⌘⏎" />
        <div className="my-1 mx-1.5 h-px bg-black/10" />
        <div className="px-2.5 pt-2 pb-1 font-mono text-[11px] uppercase tracking-wide text-ink-600">Line color</div>
        <div className="flex gap-1.5 px-2.5 pb-2 pt-1">
          {COLORS.map((c, i) => (
            <i
              key={c.name}
              className="inline-block h-4 w-4 rounded-full"
              style={{
                background: c.value,
                boxShadow: i === 0 ? '0 0 0 2px white, 0 0 0 3px #0A0A0A' : undefined,
              }}
            />
          ))}
        </div>
        <DropdownRow label="Thickness · Medium" k="›" />
        <div className="my-1 mx-1.5 h-px bg-black/10" />
        <DropdownRow label="Pause" k="⌘P" />
        <DropdownRow label="Quit FocusLine" k="⌘Q" />
      </div>
    </div>
  )
}

function DropdownRow({ label, k, active = false }: { label: string; k: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${
        active ? 'text-white' : 'text-ink-900 hover:text-white'
      }`}
      style={active ? { background: 'var(--accent)' } : undefined}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--accent)' }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}
    >
      <span>{label}</span>
      <span className="font-mono text-[11px] opacity-50">{k}</span>
    </div>
  )
}

// ── Features ──────────────────────────────────────────────────────────────
function FeaturesGrid() {
  const features = [
    { num: '01', title: 'Pause / resume / cancel', body: 'Tap the menubar icon or hit ⌘P to pause. The line freezes mid-fill until you come back.' },
    { num: '02', title: 'Pomodoro and Day plan', body: 'Classic work/break cycles, or load up your day\'s tasks and let the line walk through them.' },
    { num: '03', title: 'Intention field', body: 'One-line "what are you focusing on?" captured at start, surfaced beside the timer and in history.' },
    { num: '04', title: 'Multi-monitor aware', body: 'A line on every connected display. Plug in a new one mid-session and FocusLine adapts.' },
    { num: '05', title: 'Meeting countdown', body: 'Point it at a Google Calendar iCal feed and the line counts down to your next meeting.' },
    { num: '06', title: 'Do Not Disturb', body: 'Auto-toggle macOS Focus when a work block starts, restore on completion (one-time Shortcuts setup).' },
    { num: '07', title: 'Weekly heatmap', body: 'A small, honest grid of focus minutes per day. No badges, no streaks-as-pressure.' },
    { num: '08', title: 'Global hotkey', body: '⌃⌥⌘F from anywhere on macOS to start, pause, or resume the current session.' },
    { num: '09', title: 'iOS Live Activity', body: 'Pin the countdown to your lock screen and Dynamic Island for the whole session.' },
  ]
  return (
    <div className="mt-14 grid border-t border-rule sm:grid-cols-2 md:grid-cols-3" style={{ borderLeft: '1px solid #E7E6DF' }}>
      {features.map((f) => (
        <div key={f.num} className="border-b border-r border-rule bg-paper p-9">
          <span className="font-mono text-[11px] tracking-widest text-ink-400">{f.num}</span>
          <h4 className="mt-6 m-0 text-[19px] font-medium tracking-tight">{f.title}</h4>
          <p className="mt-2.5 mb-5 text-[14.5px] leading-relaxed text-ink-800">{f.body}</p>
          <div className="flex h-14 items-center rounded-lg bg-paper-2 px-3.5">
            <FeatureGlyph glyph={f.num} />
          </div>
        </div>
      ))}
    </div>
  )
}

function FeatureGlyph({ glyph }: { glyph: string }) {
  // Render small line-themed graphics matching the brand
  const c = 'var(--accent)'
  switch (glyph) {
    case '01':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <line x1="0" y1="10" x2="80" y2="10" stroke="#0A0A0A" strokeWidth="3" />
          <line x1="100" y1="4" x2="100" y2="16" stroke="#0A0A0A" strokeWidth="3" />
          <line x1="108" y1="4" x2="108" y2="16" stroke="#0A0A0A" strokeWidth="3" />
          <line x1="120" y1="10" x2="200" y2="10" stroke="#0A0A0A" strokeWidth="3" strokeDasharray="2 4" opacity="0.3" />
        </svg>
      )
    case '02':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <line x1="0" y1="10" x2="60" y2="10" stroke={c} strokeWidth="3" />
          <line x1="64" y1="10" x2="100" y2="10" stroke="#0A0A0A" strokeWidth="3" opacity="0.5" />
          <line x1="104" y1="10" x2="160" y2="10" stroke={c} strokeWidth="3" />
          <line x1="164" y1="10" x2="200" y2="10" stroke="#0A0A0A" strokeWidth="3" opacity="0.5" />
        </svg>
      )
    case '03':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <line x1="0" y1="10" x2="200" y2="10" stroke={c} strokeWidth="3" />
          <text x="10" y="9" fontFamily="Geist Mono, monospace" fontSize="9" fill="#0A0A0A">SHIP THE LANDING PAGE</text>
        </svg>
      )
    case '04':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <rect x="2" y="3" width="80" height="14" rx="1" fill="none" stroke="#0A0A0A" strokeWidth="1.5" />
          <line x1="4" y1="3" x2="80" y2="3" stroke={c} strokeWidth="2" />
          <rect x="100" y="6" width="60" height="8" rx="1" fill="none" stroke="#0A0A0A" strokeWidth="1.5" />
          <line x1="100" y1="6" x2="160" y2="6" stroke={c} strokeWidth="2" />
          <line x1="170" y1="10" x2="200" y2="10" stroke="#0A0A0A" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.3" />
        </svg>
      )
    case '05':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <line x1="0" y1="10" x2="140" y2="10" stroke={c} strokeWidth="3" />
          <rect x="146" y="4" width="50" height="12" rx="2" fill="#0A0A0A" />
          <text x="153" y="13" fontFamily="Geist Mono, monospace" fontSize="9" fill="white">3:00 PM</text>
        </svg>
      )
    case '06':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <line x1="0" y1="10" x2="200" y2="10" stroke={c} strokeWidth="3" />
          <circle cx="100" cy="10" r="6" fill="#FAFAF7" stroke="#0A0A0A" strokeWidth="1.5" />
          <line x1="96" y1="10" x2="104" y2="10" stroke="#0A0A0A" strokeWidth="1.5" />
        </svg>
      )
    case '07':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          {[...Array(12)].map((_, i) => (
            <rect key={i} x={i * 16} y={4} width="12" height="12" rx="2" fill={i % 3 === 0 ? c : i % 4 === 0 ? '#0A0A0A' : '#E7E6DF'} opacity={i % 3 === 0 ? 1 : 0.7} />
          ))}
        </svg>
      )
    case '08':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <rect x="2" y="4" width="22" height="12" rx="2" fill="none" stroke="#0A0A0A" strokeWidth="1.5" />
          <text x="13" y="13" fontFamily="Geist Mono, monospace" fontSize="9" fill="#0A0A0A" textAnchor="middle">⌃</text>
          <rect x="28" y="4" width="22" height="12" rx="2" fill="none" stroke="#0A0A0A" strokeWidth="1.5" />
          <text x="39" y="13" fontFamily="Geist Mono, monospace" fontSize="9" fill="#0A0A0A" textAnchor="middle">⌥</text>
          <rect x="54" y="4" width="22" height="12" rx="2" fill="none" stroke="#0A0A0A" strokeWidth="1.5" />
          <text x="65" y="13" fontFamily="Geist Mono, monospace" fontSize="9" fill="#0A0A0A" textAnchor="middle">⌘</text>
          <rect x="80" y="4" width="22" height="12" rx="2" fill={c} />
          <text x="91" y="13" fontFamily="Geist Mono, monospace" fontSize="9" fill="white" textAnchor="middle">F</text>
          <line x1="110" y1="10" x2="200" y2="10" stroke={c} strokeWidth="3" />
        </svg>
      )
    case '09':
      return (
        <svg width="100%" height="20" viewBox="0 0 200 20">
          <rect x="50" y="1" width="100" height="18" rx="9" fill="#0A0A0A" />
          <circle cx="60" cy="10" r="3" fill={c} />
          <text x="70" y="13" fontFamily="Geist Mono, monospace" fontSize="9" fill="white">17:48 · Focus</text>
        </svg>
      )
    default:
      return null
  }
}

// ── Misc small bits ────────────────────────────────────────────────────────
function ShortcutRow({ keyLabel, desc }: { keyLabel: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-3.5">
      <span className="w-16 shrink-0 font-mono text-[12px] text-ink-600">{keyLabel}</span>
      <span className="text-ink-800">{desc}</span>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h5 className="m-0 font-mono text-[11px] font-medium uppercase tracking-widest text-ink-600">{title}</h5>
      {links.map((l) => (
        <a key={l.label} href={l.href} className="text-[14px] text-ink-800 hover:text-ink-950" target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {l.label}
        </a>
      ))}
    </div>
  )
}
