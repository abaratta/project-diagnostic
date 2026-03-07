'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isVaultUnlocked } from '@/lib/vaultSession'
import { toJpeg } from 'html-to-image'

/* ─── Constants ──────────────────────────────────────────────────── */
const PACE_MAX_PP   = 2.0
const PERSON_MAX_PP = 1.5

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmt(n: number)                  { return Math.round(n).toLocaleString() }
function fmtD(n: number, d = 1)          { return n.toFixed(d) }
function sign(n: number, pfx = '')       { return (n >= 0 ? '+' : '') + pfx + fmt(Math.abs(Math.round(n))) }

/* ─── Canvas helpers ─────────────────────────────────────────────── */
function setupCanvas(canvas: HTMLCanvasElement): [CanvasRenderingContext2D, number, number] | null {
  const W = canvas.offsetWidth
  const H = canvas.offsetHeight
  if (!W || !H) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width  = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return [ctx, W, H]
}

function barPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return
  const rad = Math.min(r, h / 2, w / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.lineTo(x + w - rad, y)
  ctx.arcTo(x + w, y, x + w, y + rad, rad)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + rad)
  ctx.arcTo(x, y, x + rad, y, rad)
  ctx.closePath()
}

function drawBarChart(
  canvas: HTMLCanvasElement,
  nowVal: number,
  rapidVal: number,
  isMoney: boolean,
  nowLegend: string,
  rapidLegend: string,
) {
  const setup = setupCanvas(canvas)
  if (!setup) return
  const [ctx, W, H] = setup
  ctx.clearRect(0, 0, W, H)

  function fv(v: number) { return isMoney ? '$' + fmt(v) : fmtD(v, 1) }

  const maxVal  = Math.max(nowVal, rapidVal, 0.001)
  const barW    = W * 0.26
  const gap     = W * 0.12
  const totalBW = barW * 2 + gap
  const startX  = (W - totalBW) / 2
  const maxBarH = H * 0.60
  const baseY   = H * 0.76

  const nowH  = (nowVal  / maxVal) * maxBarH
  const rapH  = (rapidVal / maxVal) * maxBarH

  // Today bar
  ctx.fillStyle = '#1c2e3e'
  barPath(ctx, startX, baseY - nowH, barW, nowH, 4)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  barPath(ctx, startX, baseY - nowH, barW, nowH, 4)
  ctx.fill()

  // RAPID bar
  const grd = ctx.createLinearGradient(0, baseY - rapH, 0, baseY)
  grd.addColorStop(0, '#3dcab1')
  grd.addColorStop(1, 'rgba(61,202,177,0.55)')
  ctx.fillStyle = grd
  barPath(ctx, startX + barW + gap, baseY - rapH, barW, rapH, 4)
  ctx.fill()

  // Values above bars
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'bottom'
  ctx.font         = '700 11px Inter, sans-serif'
  ctx.fillStyle    = 'rgba(255,255,255,0.65)'
  if (nowH > 0) ctx.fillText(fv(nowVal),   startX + barW / 2,                   baseY - nowH - 5)
  ctx.fillStyle = '#3dcab1'
  if (rapH > 0) ctx.fillText(fv(rapidVal), startX + barW + gap + barW / 2, baseY - rapH - 5)

  // Legend row
  const legY = H - 10
  const items = [
    { color: 'rgba(255,255,255,0.22)', label: nowLegend,   x: startX + barW / 2 - 26 },
    { color: '#3dcab1',                label: rapidLegend, x: startX + barW + gap + barW / 2 - 32 },
  ]
  for (const item of items) {
    ctx.fillStyle = item.color
    ctx.fillRect(item.x, legY - 6, 7, 7)
    ctx.fillStyle = item.color === '#3dcab1' ? '#3dcab1' : 'rgba(255,255,255,0.45)'
    ctx.font = '500 9px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.label, item.x + 10, legY - 2)
  }
}

function drawDonut(
  canvas: HTMLCanvasElement,
  remainTimeCost: number,
  timeSaved: number,
  adSpend: number,
  centerCost: number,
) {
  const setup = setupCanvas(canvas)
  if (!setup) return
  const [ctx, W, H] = setup
  ctx.clearRect(0, 0, W, H)

  const COLORS = { time: '#2a4060', saved: '#3dcab1', ad: '#e83e8c' }
  const total = remainTimeCost + timeSaved + adSpend

  const cx = W * 0.38
  const cy = H * 0.47
  const outerR = Math.min(W * 0.30, H * 0.40)
  const innerR = outerR * 0.56
  const lineW  = outerR - innerR

  if (total <= 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, (outerR + innerR) / 2, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth   = lineW
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '600 10px Inter, sans-serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('No cost data', cx, cy)
    return
  }

  // Draw arc segments
  const segments = [
    { value: remainTimeCost, color: COLORS.time  },
    { value: adSpend,        color: COLORS.ad    },
    { value: timeSaved,      color: COLORS.saved },
  ]
  const mid = (outerR + innerR) / 2
  ctx.lineWidth = lineW
  let angle = -Math.PI / 2
  for (const seg of segments) {
    if (seg.value <= 0) continue
    const sweep = (seg.value / total) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, mid, angle + 0.025, angle + sweep - 0.025)
    ctx.strokeStyle = seg.color
    ctx.stroke()
    angle += sweep
  }
  ctx.lineWidth = 1

  // Center text
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle    = '#e83e8c'
  const fontSize = Math.round(Math.min(outerR * 0.38, 18))
  ctx.font = `800 ${fontSize}px Inter, sans-serif`
  ctx.fillText('$' + fmt(centerCost), cx, cy - 8)
  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  ctx.font      = '500 9px Inter, sans-serif'
  ctx.fillText('spend/mo now', cx, cy + 9)

  // Right-side legend
  const legX    = cx + outerR + 16
  const legItems = [
    { color: COLORS.time,  name: 'Time RAPID', val: '$' + fmt(remainTimeCost) },
    { color: COLORS.saved, name: 'Time saved',  val: '$' + fmt(timeSaved)     },
    { color: COLORS.ad,    name: 'Ad spend',    val: '$' + fmt(adSpend)       },
  ]
  const legH = 22
  const legStartY = cy - (legItems.length * legH) / 2
  legItems.forEach((item, i) => {
    if (i === 1 && timeSaved <= 0) return
    if (i === 2 && adSpend  <= 0) return
    const y = legStartY + i * legH
    ctx.fillStyle = item.color
    ctx.fillRect(legX, y, 8, 8)
    ctx.fillStyle    = 'rgba(255,255,255,0.6)'
    ctx.font         = '600 9px Inter, sans-serif'
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(item.name, legX + 12, y)
    ctx.fillStyle = item.color
    ctx.font      = '700 10px Inter, sans-serif'
    ctx.fillText(item.val,  legX + 12, y + 11)
  })

  // Bottom legend
  const botY  = H - 11
  const bots  = [
    { color: COLORS.time,  label: 'Time cost' },
    { color: COLORS.ad,    label: 'Ad spend'  },
    { color: COLORS.saved, label: 'Saved'      },
  ]
  ctx.textBaseline = 'middle'
  let bx = 10
  for (const b of bots) {
    ctx.fillStyle = b.color
    ctx.beginPath(); ctx.arc(bx + 3, botY, 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font      = '500 9px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(b.label, bx + 10, botY)
    bx += ctx.measureText(b.label).width + 24
  }
}

/* ─── SimInput ───────────────────────────────────────────────────── */
function SimInput({ label, value, onChange, prefix, suffix, half }: {
  label: string; value: string; onChange: (v: string) => void
  prefix?: string; suffix?: string; half?: boolean
}) {
  return (
    <div className={`si2${half ? ' si2--half' : ''}`}>
      <label className="si2__label">{label}</label>
      <div className="si2__wrap">
        {prefix && <span className="si2__affix">{prefix}</span>}
        <input
          type="number" className="si2__field"
          value={value} min={0} step="any"
          onChange={e => onChange(e.target.value)}
        />
        {suffix && <span className="si2__affix si2__affix--r">{suffix}</span>}
      </div>
    </div>
  )
}

/* ─── SimLever ───────────────────────────────────────────────────── */
function SimLever({ label, desc, value, onChange, avgPct, ticks, statusLabel }: {
  label: string; desc: string; value: number; onChange: (v: number) => void
  avgPct: number; ticks: string[]; statusLabel: string
}) {
  return (
    <div className="sl2">
      <div className="sl2__hdr">
        <span className="sl2__name">{label}</span>
        <span className="sl2__status">{statusLabel}</span>
      </div>
      <p className="sl2__desc">{desc}</p>
      <div className="sl2__track-wrap">
        <input
          type="range" className="slider-input"
          min={0} max={100} step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <div className="sl2__avg" style={{ left: `calc(${avgPct / 100} * (100% - 22px) + 11px)` }} />
      </div>
      <div className="sl2__ticks">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  )
}

/* ─── Toast ─────────────────────────────────────────────────────── */
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="sim2-toast">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3dcab1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {msg}
    </div>
  )
}

/* ─── Page shell ─────────────────────────────────────────────────── */
export default function SimulatorPage() {
  return <Suspense><SimulatorInner /></Suspense>
}

function SimulatorInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const key       = searchParams.get('key')
    const hasUrlKey = key === process.env.NEXT_PUBLIC_SIMULATOR_KEY
    if (!isVaultUnlocked() && !hasUrlKey) { router.replace('/'); return }
  }, [router, searchParams])

  // Meta
  const [company,  setCompany]  = useState('')
  const [date,     setDate]     = useState(() => new Date().toISOString().slice(0, 10))
  const [saveOpen, setSaveOpen] = useState(false)
  const [toast,    setToast]    = useState('')

  // Inputs
  const [leadsStr, setLeadsStr] = useState('25')
  const [convStr,  setConvStr]  = useState('3')
  const [revStr,   setRevStr]   = useState('2000')
  const [timeStr,  setTimeStr]  = useState('0.5')
  const [hourStr,  setHourStr]  = useState('35')
  const [adSpendStr, setAdSpendStr] = useState('500')

  // Sliders
  const [paceVal,   setPaceVal]   = useState(0)
  const [personVal, setPersonVal] = useState(0)
  const [autoVal,   setAutoVal]   = useState(0)

  // Canvas refs
  const clientsCanvasRef = useRef<HTMLCanvasElement>(null)
  const revenueCanvasRef = useRef<HTMLCanvasElement>(null)
  const donutCanvasRef   = useRef<HTMLCanvasElement>(null)
  const rightPanelRef    = useRef<HTMLDivElement>(null)

  // Animated DOM refs
  const annualRef    = useRef<HTMLSpanElement>(null)
  const subMonthRef  = useRef<HTMLSpanElement>(null)
  const subRoiRef    = useRef<HTMLSpanElement>(null)
  const convValRef   = useRef<HTMLSpanElement>(null)
  const convDeltRef  = useRef<HTMLSpanElement>(null)
  const cliValRef    = useRef<HTMLSpanElement>(null)
  const cliDeltRef   = useRef<HTMLSpanElement>(null)
  const timeValRef   = useRef<HTMLSpanElement>(null)
  const cBadgeRef    = useRef<HTMLSpanElement>(null)
  const rBadgeRef    = useRef<HTMLSpanElement>(null)
  const dBadgeRef    = useRef<HTMLSpanElement>(null)

  // Parsed
  const leads    = Math.max(0, parseFloat(leadsStr) || 0)
  const conv     = Math.max(0, Math.min(100, parseFloat(convStr) || 0))
  const revenue  = Math.max(0, parseFloat(revStr)   || 0)
  const timeLead = Math.max(0, parseFloat(timeStr)  || 0)
  const hourly   = Math.max(0, parseFloat(hourStr)  || 0)
  const adSpendInput = Math.max(0, parseFloat(adSpendStr) || 0)

  // Calc
  const pLift  = (paceVal   / 100) * PACE_MAX_PP
  const perLift = (personVal / 100) * PERSON_MAX_PP
  const impConv = Math.min(conv + pLift + perLift, 100)
  const convDelta = impConv - conv

  const nowClients  = leads * (conv    / 100)
  const rapClients  = leads * (impConv / 100)
  const nowRevenue  = nowClients * revenue
  const rapRevenue  = rapClients * revenue

  const timeCost    = leads * timeLead * hourly
  const adSpend     = adSpendInput
  const derivedCpl  = leads > 0 ? adSpend / leads : 0
  const autoSave    = (autoVal / 100) * timeCost
  const remTimeCost = timeCost - autoSave
  const remCost     = remTimeCost + adSpend

  const monthlyGain = (rapRevenue - nowRevenue) + autoSave
  const annualGain  = monthlyGain * 12
  const roi         = adSpend > 0 ? annualGain / (adSpend * 12) : 0

  // Lever labels
  function paceLabel(v: number) {
    if (v === 0) return 'No change'
    if (v < 34) return 'Same day'
    if (v < 67) return '~1 hr response'
    return '<5 min response'
  }
  function personLabel(v: number) {
    if (v === 0) return 'No change'
    if (v < 34) return 'Some personalisation'
    if (v < 67) return 'Tailored'
    return 'Hyper-personalised'
  }
  function autoLabel(v: number) {
    return v === 0 ? 'No change' : `${v}% time saved`
  }

  // Anim
  type A = {
    nowClients: number; rapClients: number
    nowRevenue: number; rapRevenue: number
    remTimeCost: number; autoSave: number; adSpend: number; remCost: number
    annualGain: number; monthlyGain: number; roi: number
    convDelta: number; impConv: number
  }
  const target = useRef<A>({
    nowClients: 0, rapClients: 0, nowRevenue: 0, rapRevenue: 0,
    remTimeCost: 0, autoSave: 0, adSpend: 0, remCost: 0,
    annualGain: 0, monthlyGain: 0, roi: 0, convDelta: 0, impConv: 0,
  })
  const anim = useRef<A>({ ...target.current })

  useEffect(() => {
    target.current = {
      nowClients, rapClients, nowRevenue, rapRevenue,
      remTimeCost, autoSave, adSpend, remCost,
      annualGain, monthlyGain, roi, convDelta, impConv,
    }
  }, [nowClients, rapClients, nowRevenue, rapRevenue,
      remTimeCost, autoSave, adSpend, remCost,
      annualGain, monthlyGain, roi, convDelta, impConv])

  useEffect(() => {
    let rafId: number
    function loop() {
      const t = target.current
      const a = anim.current
      const RATE = 0.14
      for (const k of Object.keys(t) as (keyof A)[]) {
        const d = t[k] - a[k]
        a[k] = Math.abs(d) > 0.01 ? a[k] + d * RATE : t[k]
      }

      // DOM updates
      const yrSign = a.annualGain >= 0 ? '+' : ''
      if (annualRef.current)   annualRef.current.textContent   = yrSign + '$' + fmt(a.annualGain) + '/yr'
      if (subMonthRef.current) subMonthRef.current.textContent = '= ' + (a.monthlyGain >= 0 ? '+' : '') + '$' + fmt(a.monthlyGain) + '/mo additional'
      if (subRoiRef.current)   subRoiRef.current.textContent   = a.roi > 0.05 ? ' · ' + fmtD(a.roi, 1) + 'x return on ad spend' : ''
      if (convValRef.current)  convValRef.current.textContent  = fmtD(a.impConv, 1) + '%'
      if (convDeltRef.current) convDeltRef.current.textContent = (a.convDelta >= 0 ? '+' : '') + fmtD(a.convDelta, 1) + 'pp'
      if (cliValRef.current)   cliValRef.current.textContent   = fmtD(a.rapClients, 1)
      if (cliDeltRef.current)  cliDeltRef.current.textContent  = (a.rapClients - a.nowClients >= 0 ? '+' : '') + fmtD(a.rapClients - a.nowClients, 1)
      if (timeValRef.current)  timeValRef.current.textContent  = '$' + fmt(a.autoSave)

      // Badges
      const cd = a.rapClients - a.nowClients
      const rd = a.rapRevenue - a.nowRevenue
      if (cBadgeRef.current) cBadgeRef.current.textContent = (cd >= 0 ? '+' : '') + fmtD(cd, 1) + ' clients'
      if (rBadgeRef.current) rBadgeRef.current.textContent = sign(rd, rd >= 0 ? '$' : '$') + (rd >= 0 ? '' : '') + '/mo'
      if (dBadgeRef.current) dBadgeRef.current.textContent = '$' + fmt(a.autoSave) + ' saved'

      // Canvas
      if (clientsCanvasRef.current) drawBarChart(clientsCanvasRef.current, a.nowClients, a.rapClients, false, 'Today', 'RAPID')
      if (revenueCanvasRef.current) drawBarChart(revenueCanvasRef.current, a.nowRevenue, a.rapRevenue, true,  'Today', 'With RAPID')
      if (donutCanvasRef.current)   drawDonut(donutCanvasRef.current, a.remTimeCost, a.autoSave, a.adSpend, a.remCost)

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const handleSave = useCallback(async (format: 'jpeg' | 'pdf') => {
    setSaveOpen(false)
    const el = rightPanelRef.current
    if (!el) return
    try {
      const dataUrl = await toJpeg(el, { quality: 0.93, backgroundColor: '#0e1117', cacheBust: true })
      if (format === 'jpeg') {
        const a = document.createElement('a')
        a.href = dataUrl; a.download = `${company || 'rapid-simulator'}-${date}.jpg`; a.click()
        setToast('Saved as JPEG')
      } else {
        const { default: jsPDF } = await import('jspdf')
        const img = new Image(); img.src = dataUrl
        await new Promise<void>(r => { img.onload = () => r() })
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [img.width, img.height] })
        pdf.addImage(dataUrl, 'JPEG', 0, 0, img.width, img.height)
        pdf.save(`${company || 'rapid-simulator'}-${date}.pdf`)
        setToast('Saved as PDF')
      }
    } catch { setToast('Export failed — try again') }
  }, [company, date])

  return (
    <div className="sim2-shell" onClick={() => saveOpen && setSaveOpen(false)}>
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

      {/* ── LEFT ── */}
      <div className="sim2-left">
        <div className="sim2-section-hd">Client inputs</div>

        <div className="si2-row">
          <SimInput label="Monthly leads"    value={leadsStr} onChange={setLeadsStr} half />
          <SimInput label="Conversion rate"  value={convStr}  onChange={setConvStr}  half suffix="%" />
        </div>
        <SimInput label="Revenue per client" value={revStr}   onChange={setRevStr}   prefix="$" />
        <div className="si2-row">
          <SimInput label="Time per lead"    value={timeStr}  onChange={setTimeStr}  half suffix="hrs" />
          <SimInput label="Hourly cost"      value={hourStr}  onChange={setHourStr}  half prefix="$" suffix="/hr" />
        </div>
        <div className="si2-row">
          <SimInput label="Monthly ad spend" value={adSpendStr} onChange={setAdSpendStr} prefix="$" half />
          <div className="si2 si2--half si2--derived">
            <span className="si2__label">Cost per lead</span>
            <span className="si2__derived-val">
              {leads > 0 && adSpendInput > 0
                ? `$${derivedCpl < 10 ? derivedCpl.toFixed(2) : Math.round(derivedCpl).toLocaleString()}`
                : '—'}
            </span>
          </div>
        </div>

        <div className="sim2-section-hd sim2-section-hd--mt">Improvement levers</div>

        <SimLever
          label="Follow-up speed"
          desc="How quickly leads are contacted after enquiring"
          value={paceVal} onChange={setPaceVal} avgPct={30}
          ticks={['Days', 'Same day', '1hr', '<5 min']}
          statusLabel={paceLabel(paceVal)}
        />
        <SimLever
          label="Personalisation"
          desc="Relevance and quality of outreach messages"
          value={personVal} onChange={setPersonVal} avgPct={25}
          ticks={['Generic', 'Some', 'Tailored', 'Hyper']}
          statusLabel={personLabel(personVal)}
        />
        <SimLever
          label="Process automation"
          desc="Proportion of lead handling that is automated"
          value={autoVal} onChange={setAutoVal} avgPct={20}
          ticks={['Manual', 'Partial', 'Mostly', 'Full']}
          statusLabel={autoLabel(autoVal)}
        />

        <div className="sim2-avg-legend">
          <span className="sim2-avg-dot" />
          <span>Industry average</span>
        </div>

        <p className="sim2-disclaimer">
          Results are indicative. Based on published industry benchmarks — individual outcomes may differ.
        </p>
      </div>

      {/* ── RIGHT ── */}
      <div className="sim2-right" ref={rightPanelRef}>

        {/* Top bar */}
        <div className="sim2-topbar">
          <div className="sim2-tb-company">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <input
              type="text" placeholder="Company name..."
              value={company} onChange={e => setCompany(e.target.value)}
            />
          </div>
          <div className="sim2-tb-date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="sim2-save-wrap" onClick={e => e.stopPropagation()}>
            <button className="sim2-save-btn" onClick={() => setSaveOpen(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Save
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {saveOpen && (
              <div className="sim2-save-dropdown">
                <button onClick={() => handleSave('jpeg')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Save as JPEG
                </button>
                <button onClick={() => handleSave('pdf')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Save as PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reveal banner */}
        <div className="sim2-reveal">
          <div className="sim2-reveal__left">
            <div className="sim2-reveal__eyebrow">Annual revenue opportunity</div>
            <span className="sim2-reveal__big" ref={annualRef}>+$0/yr</span>
            <div className="sim2-reveal__sub">
              <span ref={subMonthRef}>= +$0/mo additional</span>
              <span ref={subRoiRef} />
            </div>
          </div>
          <div className="sim2-reveal__stats">
            <div className="sim2-reveal__stat">
              <span className="sim2-reveal__stat-label">Conv. rate</span>
              <span className="sim2-reveal__stat-val" ref={convValRef}>0.0%</span>
              <span className="sim2-reveal__stat-delta" ref={convDeltRef}>+0.0pp</span>
            </div>
            <div className="sim2-reveal__stat">
              <span className="sim2-reveal__stat-label">Clients/mo</span>
              <span className="sim2-reveal__stat-val" ref={cliValRef}>0</span>
              <span className="sim2-reveal__stat-delta" ref={cliDeltRef}>+0.0</span>
            </div>
            <div className="sim2-reveal__stat">
              <span className="sim2-reveal__stat-label">Time saved</span>
              <span className="sim2-reveal__stat-val" ref={timeValRef}>$0</span>
              <span className="sim2-reveal__stat-delta">/mo</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="sim2-charts-grid">
          <div className="sim2-chart-panel">
            <div className="sim2-chart-hdr">
              <span className="sim2-chart-hdr__label">Clients / Month</span>
              <span className="sim2-badge sim2-badge--cyan" ref={cBadgeRef}>+0.0 clients</span>
            </div>
            <canvas ref={clientsCanvasRef} className="sim2-canvas" />
          </div>
          <div className="sim2-chart-panel">
            <div className="sim2-chart-hdr">
              <span className="sim2-chart-hdr__label">Monthly Revenue</span>
              <span className="sim2-badge sim2-badge--cyan" ref={rBadgeRef}>+$0/mo</span>
            </div>
            <canvas ref={revenueCanvasRef} className="sim2-canvas" />
          </div>
          <div className="sim2-chart-panel">
            <div className="sim2-chart-hdr">
              <span className="sim2-chart-hdr__label">Cost Breakdown</span>
              <span className="sim2-badge sim2-badge--pink" ref={dBadgeRef}>$0 saved</span>
            </div>
            <canvas ref={donutCanvasRef} className="sim2-canvas" />
          </div>
        </div>

      </div>
    </div>
  )
}
