import { Navbar } from '../components/Navbar'
import { useTransactions } from '../hooks/useTransactions'
import { useAIZoneClassifier } from '../hooks/useAIZoneClassifier'
import { useRef, useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Zone = 'income' | 'expenses' | 'assets' | 'liabilities' | 'source'

interface PortId     { zone: Zone }
interface Connection { fromZone: Zone; toZone: Zone }
interface Bubble     { label: string; amount?: number; aiReason?: string }

// ─── Port side per zone ───────────────────────────────────────────────────────
const PORT_SIDES: Record<Zone, 'right' | 'bottom'> = {
  income:      'right',
  expenses:    'right',
  assets:      'bottom',
  liabilities: 'bottom',
  source:      'bottom',
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const ZONE_COLORS: Record<Zone, string> = {
  income:      '#4ade80',
  expenses:    '#f87171',
  assets:      '#60a5fa',
  liabilities: '#fbbf24',
  source:      '#a78bfa',
}
const ZONE_GLOW: Record<Zone, string> = {
  income:      'rgba(74,222,128,0.10)',
  expenses:    'rgba(248,113,113,0.10)',
  assets:      'rgba(96,165,250,0.10)',
  liabilities: 'rgba(251,191,36,0.10)',
  source:      'rgba(167,139,250,0.10)',
}
const BUBBLE_CLASSES: Record<Zone, string> = {
  income:      'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  expenses:    'border-red-400/30     bg-red-400/10     text-red-300',
  assets:      'border-blue-400/30    bg-blue-400/10    text-blue-300',
  liabilities: 'border-amber-400/30   bg-amber-400/10   text-amber-300',
  source:      'border-violet-400/30  bg-violet-400/10  text-violet-300',
}
const DOT_COLORS: Record<Zone, string> = {
  income:      'bg-emerald-400',
  expenses:    'bg-red-400',
  assets:      'bg-blue-400',
  liabilities: 'bg-amber-400',
  source:      'bg-violet-400',
}
const ZONE_LABELS: Record<Zone, string> = {
  income:      'Income',
  expenses:    'Expenses',
  assets:      'Assets',
  liabilities: 'Liabilities',
  source:      'Money Source',
}

// ─── Arrow routing ────────────────────────────────────────────────────────────
function drawSmoothArrow(
  svgEl: SVGSVGElement,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fromZone: Zone,
  toZone: Zone,
  connIdx: number,
) {
  const color    = ZONE_COLORS[fromZone]
  const fromSide = PORT_SIDES[fromZone]
  const toSide   = PORT_SIDES[toZone]
  const laneOffset = connIdx * 18

  let c1x: number, c1y: number, c2x: number, c2y: number

  if (fromSide === 'right' && toSide === 'right') {
    const rx = Math.max(p1.x, p2.x) + 50 + laneOffset
    c1x = rx; c1y = p1.y; c2x = rx; c2y = p2.y
  } else if (fromSide === 'bottom' && toSide === 'bottom') {
    const by = Math.max(p1.y, p2.y) + 50 + laneOffset
    c1x = p1.x; c1y = by; c2x = p2.x; c2y = by
  } else if (fromSide === 'right' && toSide === 'bottom') {
    const bendX = p2.x + 30 + laneOffset
    c1x = bendX; c1y = p1.y; c2x = p2.x; c2y = p1.y + 30
  } else {
    c1x = p1.x; c1y = p2.y - 30 - laneOffset; c2x = p1.x + 30; c2y = p2.y
  }

  const d = `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`

  let defs = svgEl.querySelector('defs')
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    svgEl.insertBefore(defs, svgEl.firstChild)
  }

  const markerId = `mk-${connIdx}`
  defs.querySelector(`#${markerId}`)?.remove()
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
  marker.setAttribute('id', markerId)
  marker.setAttribute('markerWidth',  '10')
  marker.setAttribute('markerHeight', '10')
  marker.setAttribute('refX', '9')
  marker.setAttribute('refY', '5')
  marker.setAttribute('orient', 'auto')
  const mp = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  mp.setAttribute('d', 'M0,1 L0,9 L9,5 z')
  mp.setAttribute('fill', color)
  mp.setAttribute('opacity', '0.9')
  marker.appendChild(mp)
  defs.appendChild(marker)

  const mkPath = (sw: string, op: string, extra?: Record<string, string>) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', d)
    p.setAttribute('stroke', color)
    p.setAttribute('stroke-width', sw)
    p.setAttribute('fill', 'none')
    p.setAttribute('opacity', op)
    p.setAttribute('stroke-linecap', 'round')
    p.setAttribute('stroke-linejoin', 'round')
    if (extra) Object.entries(extra).forEach(([k, v]) => p.setAttribute(k, v))
    return p
  }

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.appendChild(mkPath('10', '0.04'))
  g.appendChild(mkPath('3',  '0.12'))
  g.appendChild(mkPath('1.5', '0.90', { 'marker-end': `url(#${markerId})` }))
  svgEl.appendChild(g)
}

// ─── Port dot ─────────────────────────────────────────────────────────────────
function PortDot({ zone, isActive, onClick }: {
  zone: Zone
  isActive: boolean
  onClick: (zone: Zone) => void
}) {
  const color = ZONE_COLORS[zone]
  const side  = PORT_SIDES[zone]

  const posStyle: React.CSSProperties =
    side === 'right'
      ? { position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', zIndex: 30 }
      : { position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(zone) }}
      style={{
        ...posStyle,
        width: 24, height: 24,
        borderRadius: '50%',
        border: `2.5px solid ${color}`,
        background: isActive ? `${color}44` : 'rgba(13,26,18,0.92)',
        boxShadow: isActive
          ? `0 0 0 5px ${color}30, 0 0 16px ${color}60`
          : `0 0 8px ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color,
        opacity: isActive ? 1 : 0.55,
        transition: 'all 0.15s',
      }} />
    </button>
  )
}

// ─── Zone panel ───────────────────────────────────────────────────────────────
function ZonePanel({
  zone, bubbles, total, activePort, zoneRef, onPortClick, aiLoading,
}: {
  zone: Zone
  bubbles: Bubble[]
  total?: string
  activePort: PortId | null
  zoneRef: (el: HTMLDivElement | null) => void
  onPortClick: (zone: Zone) => void
  aiLoading?: boolean
}) {
  const isActive = activePort?.zone === zone
  return (
    <div
      ref={zoneRef}
      className="relative flex flex-col gap-4 p-6 transition-all duration-200 flex-1"
      style={{
        minHeight: 190,
        ...(isActive ? { background: ZONE_GLOW[zone] } : {}),
      }}
    >
      {isActive && (
        <span
          className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full"
          style={{ background: ZONE_COLORS[zone], opacity: 0.8 }}
        />
      )}
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${DOT_COLORS[zone]}`} />
        <span className="text-[17px] font-semibold text-white/90 font-serif">{ZONE_LABELS[zone]}</span>
        {total && <span className="ml-auto font-mono text-sm text-white/25">{total}</span>}
        {/* AI badge for zones that AI manages */}
        {(zone === 'assets' || zone === 'liabilities' || zone === 'expenses') && (
          <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border ${
            aiLoading
              ? 'border-violet-400/30 text-violet-400/60 animate-pulse'
              : 'border-violet-400/20 text-violet-400/40'
          }`}>
            {aiLoading ? '✦ AI…' : '✦ AI'}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 content-start flex-1">
        {aiLoading ? (
          // Skeleton loading state
          <>
            {[1, 2, 3].map(i => (
              <span key={i} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm animate-pulse w-20 h-7" />
            ))}
          </>
        ) : bubbles.length === 0 ? (
          <span className="text-sm text-white/20 italic">No data yet</span>
        ) : (
          bubbles.map((b, i) => (
            <span
              key={i}
              title={b.aiReason}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium cursor-default ${BUBBLE_CLASSES[zone]}`}
            >
              {b.label}
            </span>
          ))
        )}
      </div>
      <PortDot zone={zone} isActive={isActive} onClick={onPortClick} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CashflowPage() {
  const { transactions, income, expense } = useTransactions()
  const { classified, loading: aiLoading, error: aiError, classify } = useAIZoneClassifier()

  // ── Run AI classification whenever transactions change ───────────────────────
  useEffect(() => {
    if (transactions.length > 0) {
      classify(transactions)
    }
  }, [transactions, classify])

  // ── Income bubbles (from Supabase, grouped by category) ─────────────────────
  const incomeBubbles: Bubble[] = Object.entries(
    transactions
      .filter(t => t.type === 'income')
      .reduce<Record<string, number>>((a, t) => {
        const k = t.category.toLowerCase()
        return { ...a, [k]: (a[k] ?? 0) + t.amount }
      }, {})
  ).map(([label]) => ({ label }))

  // ── AI-classified bubbles split by zone ─────────────────────────────────────
  const expenseBubbles: Bubble[] = classified
    .filter(c => c.zone === 'expenses')
    .map(c => ({ label: c.category, amount: c.amount, aiReason: c.reason }))

  const assetBubbles: Bubble[] = classified
    .filter(c => c.zone === 'assets')
    .map(c => ({ label: c.category, amount: c.amount, aiReason: c.reason }))

  const liabilityBubbles: Bubble[] = classified
    .filter(c => c.zone === 'liabilities')
    .map(c => ({ label: c.category, amount: c.amount, aiReason: c.reason }))

  const [activePort,  setActivePort]  = useState<PortId | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [exporting,   setExporting]   = useState(false)
  const [svgSize,     setSvgSize]     = useState({ w: 0, h: 0 })

  const zoneRefs   = useRef<Partial<Record<Zone, HTMLDivElement>>>({})
  const svgRef     = useRef<SVGSVGElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const exportRef  = useRef<HTMLDivElement>(null)
  const sourceRef  = useRef<HTMLDivElement>(null)

  // ── Resize observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return
      const r = wrapperRef.current.getBoundingClientRect()
      setSvgSize({ w: r.width, h: r.height })
    }
    update()
    const ro = new ResizeObserver(update)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Port center coords ───────────────────────────────────────────────────────
  const getPortCenter = useCallback((zone: Zone) => {
    const el   = zone === 'source' ? sourceRef.current : zoneRefs.current[zone]
    const wrap = wrapperRef.current
    if (!el || !wrap) return null

    const er   = el.getBoundingClientRect()
    const wr   = wrap.getBoundingClientRect()
    const side = PORT_SIDES[zone]

    if (side === 'right')  return { x: er.right - wr.left, y: er.top - wr.top + er.height / 2 }
    if (side === 'bottom') return { x: er.left - wr.left + er.width / 2, y: er.bottom - wr.top }
    return null
  }, [])

  // ── Redraw arrows ────────────────────────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl || !wrapperRef.current) return
    ;[...svgEl.children].forEach(c => { if (c.tagName !== 'defs') c.remove() })
    connections.forEach((c, i) => {
      const p1 = getPortCenter(c.fromZone)
      const p2 = getPortCenter(c.toZone)
      if (p1 && p2) drawSmoothArrow(svgEl, p1, p2, c.fromZone, c.toZone, i)
    })
  }, [connections, svgSize, getPortCenter])

  // ── Port click ───────────────────────────────────────────────────────────────
  function handlePortClick(zone: Zone) {
    if (!activePort) { setActivePort({ zone }); return }
    if (activePort.zone === zone) { setActivePort(null); return }
    const from = activePort.zone
    setActivePort(null)
    if (!connections.some(c => c.fromZone === from && c.toZone === zone)) {
      setConnections(prev => [...prev, { fromZone: from, toZone: zone }])
    }
  }

  // ── Export PDF ───────────────────────────────────────────────────────────────
  async function handleExport() {
    if (exporting) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF }   = await import('jspdf')

      const modernColorRe = /\b(oklab|oklch|color-mix|color)\s*\(/g
      const allEls = document.querySelectorAll<HTMLElement>('*')
      const patches: Array<{ el: HTMLElement; prop: string; original: string }> = []
      const CSS_PROPS = [
        'color', 'background-color', 'border-color',
        'border-top-color', 'border-right-color',
        'border-bottom-color', 'border-left-color',
        'outline-color', 'box-shadow', 'text-decoration-color',
      ] as const

      allEls.forEach(el => {
        const computed = getComputedStyle(el)
        CSS_PROPS.forEach(prop => {
          const val = computed.getPropertyValue(prop)
          if (val && modernColorRe.test(val)) {
            modernColorRe.lastIndex = 0
            const original = el.style.getPropertyValue(prop)
            patches.push({ el, prop, original })
            el.style.setProperty(prop, prop === 'color' ? '#ffffff' : 'rgba(20,40,30,0.85)', 'important')
          }
        })
      })

      const canvas = await html2canvas(exportRef.current!, {
        backgroundColor: '#0d1f18',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        ignoreElements: el => el.tagName === 'BUTTON' && el.textContent?.includes('Export'),
      })

      patches.forEach(({ el, prop, original }) => {
        if (original) el.style.setProperty(prop, original)
        else el.style.removeProperty(prop)
      })

      const w = canvas.width / 2, h = canvas.height / 2
      const pdf = new jsPDF({
        orientation: w > h ? 'landscape' : 'portrait',
        unit: 'px',
        format: [w, h],
      })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h)
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      pdf.setFontSize(8); pdf.setTextColor(74, 222, 128)
      pdf.text(`Trackora · Cash Flow Map · ${date}`, 12, h - 8)
      pdf.save('trackora-cashflow.pdf')
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Export failed. Check the console for details.')
    } finally {
      setExporting(false)
    }
  }

  const hintText = activePort
    ? `"${ZONE_LABELS[activePort.zone]}" selected — click another section's port to connect.`
    : 'Click a ● port to start, then click another port to draw a flow arrow.'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main
        ref={exportRef}
        className="container mx-auto px-4 py-10 space-y-10 animate-fade-up"
        style={{ overflow: 'visible' }}
      >

        {/* ── Header row ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Cash Flow</p>
            <h1 className="display-serif text-4xl md:text-5xl font-semibold">Your money flow map</h1>
            <p className="text-sm text-white/35 mt-2">
              Click the <span className="text-white/60">●</span> ports to draw Kiyosaki-style flow arrows.
              <span className="ml-2 text-violet-400/50">✦ AI sorts your expenses into the right zones.</span>
            </p>
          </div>

          {/* ── Money Source circle node ────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="text-xs uppercase tracking-widest text-violet-400/60">Money Source</span>
            <div
              ref={el => {
                sourceRef.current = el
                if (el) zoneRefs.current['source'] = el
              }}
              className="relative"
            >
              <button
                onClick={() => handlePortClick('source')}
                style={{
                  width: 64, height: 64,
                  borderRadius: '50%',
                  border: `2.5px solid ${ZONE_COLORS['source']}`,
                  background: activePort?.zone === 'source'
                    ? `${ZONE_COLORS['source']}22`
                    : 'rgba(13,26,18,0.8)',
                  boxShadow: activePort?.zone === 'source'
                    ? `0 0 0 6px ${ZONE_COLORS['source']}22, 0 0 24px ${ZONE_COLORS['source']}55`
                    : `0 0 12px ${ZONE_COLORS['source']}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: ZONE_COLORS['source'],
                  opacity: activePort?.zone === 'source' ? 1 : 0.5,
                  transition: 'all 0.2s',
                }} />
              </button>
            </div>
            <span className="text-xs text-violet-300/50">tap to connect</span>
          </div>
        </div>

        {/* ── AI error banner ─────────────────────────────────────────────────── */}
        {aiError && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
            <span>⚠</span>
            <span>AI classification failed: {aiError}. Zones may be empty.</span>
          </div>
        )}

        {/* ── Diagram wrapper ─────────────────────────────────────────────────── */}
        <div ref={wrapperRef} className="relative" style={{ overflow: 'visible' }}>

          <svg
            ref={svgRef}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none', zIndex: 50, overflow: 'visible',
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 items-stretch">

            {/* ── Income Statement ─────────────────────────────────────────── */}
            <div className="glass-card rounded-3xl overflow-visible flex flex-col">
              <p className="px-6 pt-5 pb-1 text-[10px] uppercase tracking-widest text-emerald-400/50 flex-shrink-0">
                Income Statement
              </p>
              <div className="flex flex-col flex-1 divide-y divide-white/[0.07] overflow-visible">
                <ZonePanel
                  zone="income"
                  bubbles={incomeBubbles}
                  total={`$${income.toLocaleString()}`}
                  activePort={activePort}
                  zoneRef={el => { if (el) zoneRefs.current['income'] = el }}
                  onPortClick={handlePortClick}
                />
                {/* Expenses zone — AI-classified subset of expense transactions */}
                <ZonePanel
                  zone="expenses"
                  bubbles={expenseBubbles}
                  total={`$${expenseBubbles.reduce((s, b) => s + (b.amount ?? 0), 0).toLocaleString()}`}
                  activePort={activePort}
                  zoneRef={el => { if (el) zoneRefs.current['expenses'] = el }}
                  onPortClick={handlePortClick}
                  aiLoading={aiLoading}
                />
              </div>
            </div>

            {/* ── Balance Sheet ────────────────────────────────────────────── */}
            <div className="glass-card rounded-3xl overflow-visible flex flex-col">
              <p className="px-6 pt-5 pb-1 text-[10px] uppercase tracking-widest text-emerald-400/50 flex-shrink-0">
                Balance Sheet
              </p>
              <div className="grid grid-cols-2 divide-x divide-white/[0.07] flex-1 overflow-visible">
                {/* Assets zone — AI-classified from expense transactions */}
                <ZonePanel
                  zone="assets"
                  bubbles={assetBubbles}
                  activePort={activePort}
                  zoneRef={el => { if (el) zoneRefs.current['assets'] = el }}
                  onPortClick={handlePortClick}
                  aiLoading={aiLoading}
                />
                {/* Liabilities zone — AI-classified from expense transactions */}
                <ZonePanel
                  zone="liabilities"
                  bubbles={liabilityBubbles}
                  activePort={activePort}
                  zoneRef={el => { if (el) zoneRefs.current['liabilities'] = el }}
                  onPortClick={handlePortClick}
                  aiLoading={aiLoading}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── Hint + Export ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className={[
            'flex-1 min-w-[200px] glass-card rounded-2xl px-6 py-4 text-sm transition-colors duration-300',
            activePort ? 'text-emerald-300/80' : 'text-white/40',
          ].join(' ')}>
            {hintText}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-medium
                       bg-emerald-400/10 border border-emerald-400/30 text-emerald-300
                       hover:bg-emerald-400/20 hover:border-emerald-400/50
                       disabled:opacity-50 disabled:cursor-wait transition-all duration-200"
          >
            {exporting ? '⏳ Generating PDF…' : '↓ Export to PDF'}
          </button>
        </div>

        {/* ── Connection tags ───────────────────────────────────────────────── */}
        {connections.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {connections.map((c, i) => (
              <span
                key={i}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full
                           border border-white/10 text-white/50 bg-white/[0.03]"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ZONE_COLORS[c.fromZone] }} />
                {ZONE_LABELS[c.fromZone]} → {ZONE_LABELS[c.toZone]}
                <button
                  onClick={() => setConnections(prev => prev.filter((_, j) => j !== i))}
                  className="ml-1 opacity-40 hover:opacity-90 text-base leading-none transition-opacity"
                >×</button>
              </span>
            ))}
            <button
              onClick={() => setConnections([])}
              className="text-xs px-4 py-2 rounded-full border border-white/10
                         text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

      </main>
    </div>
  )
}