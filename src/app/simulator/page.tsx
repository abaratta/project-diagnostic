'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { isVaultUnlocked } from '@/lib/vaultSession'
import { toJpeg } from 'html-to-image'
import { BookCallButton } from '@/components/BookCallButton'

/* ─── Constants ──────────────────────────────────────────────────── */
const PACE_MAX_PP   = 2.0
const PERSON_MAX_PP = 1.5

const PRESETS = [
  {
    id: 'founder',
    label: 'Founder',
    helper: 'Owner-led business',
    values: { leads: '30', conversion: '8', revenue: '2500', time: '0.5', hourly: '40', adSpend: '700' },
  },
  {
    id: 'agency',
    label: 'Agency',
    helper: 'Lead-gen dependent team',
    values: { leads: '120', conversion: '10', revenue: '7500', time: '0.75', hourly: '95', adSpend: '5200' },
  },
  {
    id: 'professional-service',
    label: 'Professional Service',
    helper: 'Consulting or advisory',
    values: { leads: '90', conversion: '8', revenue: '7000', time: '0.65', hourly: '85', adSpend: '3200' },
  },
  {
    id: 'small-business',
    label: 'Small Business',
    helper: 'Growing service team',
    values: { leads: '50', conversion: '10', revenue: '4000', time: '0.45', hourly: '45', adSpend: '1600' },
  },
] as const

type PresetId = typeof PRESETS[number]['id'] | 'custom'
type SetupMode = 'setup' | 'simulator'
type TourTarget = 'upside' | 'levers' | 'charts' | 'actions'

const SETUP_STEPS = [
  { eyebrow: 'Step 1 of 4', title: 'Choose your profile', copy: 'Pick the profile that feels closest to how your business works. We will create starter numbers you can adjust next.' },
  { eyebrow: 'Step 2 of 4', title: 'Confirm your numbers', copy: 'These three numbers estimate what your leads are worth today.' },
  { eyebrow: 'Step 3 of 4', title: 'Add your current costs', copy: 'This helps the simulator show where time and ad spend are being used.' },
  { eyebrow: 'Step 4 of 4', title: 'Now experiment with growth', copy: 'Move the three levers to model faster follow-up, better outreach, and less admin.' },
] as const

const TOUR_STEPS: { target: TourTarget; title: string; copy: string }[] = [
  {
    target: 'upside',
    title: 'This is your estimated upside.',
    copy: 'The big number estimates extra annual revenue from the improvements you test here. The monthly line shows the same gain in a shorter time frame.',
  },
  {
    target: 'levers',
    title: 'Move the levers to test improvements.',
    copy: 'Try one lever at a time, then combine them. The estimate updates immediately as you model faster follow-up, better outreach, and less admin.',
  },
  {
    target: 'charts',
    title: 'Use the graphs as proof, not homework.',
    copy: 'The charts show what changed: more clients, more monthly revenue, and how time or ad spend is being used.',
  },
  {
    target: 'actions',
    title: 'Decide what to do next.',
    copy: 'If the upside feels meaningful, save the report or book a strategy call to work through what would create that gain.',
  },
]

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

  // Without conversion system bar
  ctx.fillStyle = '#1c2e3e'
  barPath(ctx, startX, baseY - nowH, barW, nowH, 4)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  barPath(ctx, startX, baseY - nowH, barW, nowH, 4)
  ctx.fill()

  // With conversion system bar
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
  const legY = H - 22
  const items = [
    { color: 'rgba(255,255,255,0.22)', label: nowLegend,   x: startX + barW / 2 },
    { color: '#3dcab1',                label: rapidLegend, x: startX + barW + gap + barW / 2 },
  ]
  for (const item of items) {
    ctx.fillStyle = item.color
    ctx.fillRect(item.x - 4, legY - 4, 7, 7)
    ctx.fillStyle = item.color === '#3dcab1' ? '#3dcab1' : 'rgba(255,255,255,0.45)'
    ctx.font = '500 9px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.label, item.x, legY + 9)
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

  const COLORS = { leadManagement: '#2a6f97', savings: '#e83e8c', leadGeneration: '#17364f' }
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
    { value: adSpend,        color: COLORS.leadGeneration },
    { value: remainTimeCost, color: COLORS.leadManagement },
    { value: timeSaved,      color: COLORS.savings },
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
  ctx.fillStyle    = '#ffffff'
  const fontSize = Math.round(Math.min(outerR * 0.38, 18))
  ctx.font = `800 ${fontSize}px Inter, sans-serif`
  ctx.fillText('$' + fmt(centerCost), cx, cy - 8)
  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  ctx.font      = '500 9px Inter, sans-serif'
  ctx.fillText('spend/mo now', cx, cy + 9)

  // Right-side legend
  const legX    = cx + outerR + 16
  const legItems = [
    { color: COLORS.leadGeneration, name: 'Lead generation cost', val: '$' + fmt(adSpend)       },
    { color: COLORS.leadManagement, name: 'Lead management cost', val: '$' + fmt(remainTimeCost) },
    { color: COLORS.savings,        name: 'Cost savings',         val: '$' + fmt(timeSaved)     },
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
    { color: COLORS.leadGeneration, label: 'Lead gen cost' },
    { color: COLORS.leadManagement, label: 'Lead mgmt cost' },
    { color: COLORS.savings,        label: 'Savings'       },
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
function SimInput({ label, value, onChange, prefix, suffix, half, helperText }: {
  label: string; value: string; onChange: (v: string) => void
  prefix?: string; suffix?: string; half?: boolean; helperText?: string
}) {
  return (
    <div className={`si2${half ? ' si2--half' : ''}`}>
      <div className="si2__label-row">
        <label className="si2__label">{label}</label>
        {helperText && (
          <span className="si2__info" title={helperText} aria-label={helperText}>i</span>
        )}
      </div>
      <div className="si2__wrap">
        {prefix && <span className="si2__affix">{prefix}</span>}
        <input
          type="number" className="si2__field"
          value={value} min={0} step="any"
          onChange={e => onChange(e.target.value)}
        />
        {suffix && <span className="si2__affix si2__affix--r">{suffix}</span>}
      </div>
      {helperText && <p className="si2__helper">{helperText}</p>}
    </div>
  )
}

/* ─── SimLever ───────────────────────────────────────────────────── */
function SimLever({ label, desc, value, onChange, avgPct, ticks, statusLabel, impactLabel }: {
  label: string; desc: string; value: number; onChange: (v: number) => void
  avgPct: number; ticks: string[]; statusLabel: string; impactLabel?: string
}) {
  return (
    <div className="sl2">
      <div className="sl2__hdr">
        <span className="sl2__name">{label}</span>
        <span className="sl2__status">{statusLabel}</span>
      </div>
      <p className="sl2__desc">{desc}</p>
      <div className="sl2__endpoints" aria-hidden="true">
        <span>Current</span>
        <span>Improved</span>
      </div>
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
      {impactLabel && <p className="sl2__impact">{impactLabel}</p>}
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
  const date = new Date().toISOString().slice(0, 10)
  const [toast,    setToast]    = useState('')
  const [setupMode, setSetupMode] = useState<SetupMode>('setup')
  const [setupStep, setSetupStep] = useState(0)
  const [baselineDrawerOpen, setBaselineDrawerOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [tourDismissed, setTourDismissed] = useState(false)

  // Inputs
  const [leadsStr, setLeadsStr] = useState('30')
  const [convStr,  setConvStr]  = useState('8')
  const [revStr,   setRevStr]   = useState('2500')
  const [timeStr,  setTimeStr]  = useState('0.5')
  const [hourStr,  setHourStr]  = useState('40')
  const [adSpendStr, setAdSpendStr] = useState('700')
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('founder')

  // Sliders
  const [paceVal,   setPaceVal]   = useState(0)
  const [personVal, setPersonVal] = useState(0)
  const [autoVal,   setAutoVal]   = useState(0)

  // Canvas refs
  const clientsCanvasRef = useRef<HTMLCanvasElement>(null)
  const revenueCanvasRef = useRef<HTMLCanvasElement>(null)
  const donutCanvasRef   = useRef<HTMLCanvasElement>(null)
  const rightPanelRef    = useRef<HTMLElement>(null)

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

  const paceMonthlyImpact = leads * (pLift / 100) * revenue
  const personMonthlyImpact = leads * (perLift / 100) * revenue

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setLeadsStr(preset.values.leads)
    setConvStr(preset.values.conversion)
    setRevStr(preset.values.revenue)
    setTimeStr(preset.values.time)
    setHourStr(preset.values.hourly)
    setAdSpendStr(preset.values.adSpend)
    setSelectedPreset(preset.id)
  }

  const setCustom = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setSelectedPreset('custom')
  }

  const setupMeta = SETUP_STEPS[setupStep]
  const setupProgress = ((setupStep + 1) / SETUP_STEPS.length) * 100
  const baselineSummary = `${fmt(leads)} leads/mo · ${fmtD(conv, conv % 1 === 0 ? 0 : 1)}% convert · $${fmt(revenue)} value`
  const activeTour = TOUR_STEPS[tourStep]
  const activeTourTarget = tourOpen ? activeTour.target : null
  const tourTargetClass = (target: TourTarget) => activeTourTarget === target ? ' sim2-tour-target--active' : ''

  const closeTour = () => {
    setTourOpen(false)
    setTourDismissed(true)
  }

  const goToSimulator = () => {
    setSetupMode('simulator')
    setBaselineDrawerOpen(false)
    setTourStep(0)
    setTourDismissed(false)
    setTourOpen(true)
  }

  // Lever labels
  function paceLabel(v: number) {
    if (v === 0) return 'Current follow-up'
    if (v < 34) return 'Same day follow-up'
    if (v < 67) return 'Within 1 hour'
    return 'Under 5 minutes'
  }
  function personLabel(v: number) {
    if (v === 0) return 'Generic outreach'
    if (v < 34) return 'Lightly tailored'
    if (v < 67) return 'Tailored outreach'
    return 'One-to-one message'
  }
  function autoLabel(v: number) {
    return v === 0 ? 'Manual admin' : `${v}% admin saved`
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
      if (clientsCanvasRef.current) drawBarChart(clientsCanvasRef.current, a.nowClients, a.rapClients, false, 'Without conversion system', 'With conversion system')
      if (revenueCanvasRef.current) drawBarChart(revenueCanvasRef.current, a.nowRevenue, a.rapRevenue, true,  'Without conversion system', 'With conversion system')
      if (donutCanvasRef.current)   drawDonut(donutCanvasRef.current, a.remTimeCost, a.autoSave, a.adSpend, a.remCost)

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const handleSave = useCallback(async (format: 'jpeg' | 'pdf') => {
    const el = rightPanelRef.current
    if (!el) return
    try {
      const dataUrl = await toJpeg(el, { quality: 0.93, backgroundColor: '#0e1117', cacheBust: true })
      if (format === 'jpeg') {
        const a = document.createElement('a')
        a.href = dataUrl; a.download = `rapid-simulator-${date}.jpg`; a.click()
        setToast('Saved as JPEG')
      } else {
        const { default: jsPDF } = await import('jspdf')
        const img = new Image(); img.src = dataUrl
        await new Promise<void>(r => { img.onload = () => r() })
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [img.width, img.height] })
        pdf.addImage(dataUrl, 'JPEG', 0, 0, img.width, img.height)
        pdf.save(`rapid-simulator-${date}.pdf`)
        setToast('Saved as PDF')
      }
    } catch { setToast('Export failed — try again') }
  }, [date])

  return (
    <div
      className={`sim2-shell ${setupMode === 'setup' ? 'sim2-shell--setup' : 'sim2-shell--workspace'}`}
    >
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}

      {setupMode === 'setup' ? (
        <main className="sim2-setup">
          <section className="sim2-setup-card">
            <div className="sim2-setup-progress" aria-label={setupMeta.eyebrow}>
              <span style={{ width: `${setupProgress}%` }} />
            </div>
            <div className="sim2-setup__eyebrow">{setupMeta.eyebrow}</div>
            <h1 className="sim2-setup__title">{setupMeta.title}</h1>
            <p className="sim2-setup__copy">{setupMeta.copy}</p>

            {setupStep === 0 && (
              <div className="sim2-preset-grid" aria-label="Starting profiles">
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`sim2-preset-card${selectedPreset === preset.id ? ' sim2-preset-card--active' : ''}`}
                    onClick={() => applyPreset(preset)}
                  >
                    <span>{preset.label}</span>
                    <small>{preset.helper}</small>
                  </button>
                ))}
              </div>
            )}

            {setupStep === 1 && (
              <div className="sim2-setup-fields">
                <div className="si2-row">
                  <SimInput label="How many leads do you get each month?" value={leadsStr} onChange={setCustom(setLeadsStr)} half />
                  <SimInput
                    label="The percentage of leads that turn into paying clients"
                    value={convStr}
                    onChange={setCustom(setConvStr)}
                    half
                    suffix="%"
                  />
                </div>
                <SimInput label="Average client lifetime value" value={revStr} onChange={setCustom(setRevStr)} prefix="$" />
              </div>
            )}

            {setupStep === 2 && (
              <div className="sim2-setup-fields">
                <div className="si2-row">
                  <SimInput
                    label="Manual time spent on each lead"
                    value={timeStr}
                    onChange={setCustom(setTimeStr)}
                    half
                    suffix="hrs"
                    helperText="How long your team spends replying, qualifying, and updating records for each lead."
                  />
                  <SimInput
                    label="Hourly cost for the business"
                    value={hourStr}
                    onChange={setCustom(setHourStr)}
                    half
                    prefix="$"
                    suffix="/hr"
                    helperText="Use the loaded hourly cost of the person handling leads."
                  />
                </div>
                <div className="si2-row">
                  <SimInput label="Monthly spend on lead generation (e.g. ads, SEO, etc.)" value={adSpendStr} onChange={setCustom(setAdSpendStr)} prefix="$" half />
                  <div className="si2 si2--half si2--derived">
                    <div className="si2__label-row">
                      <span className="si2__label">Cost per lead</span>
                      <span className="si2__info" title="Monthly lead generation spend divided by monthly leads." aria-label="Monthly lead generation spend divided by monthly leads.">i</span>
                    </div>
                    <span className="si2__derived-val">
                      {leads > 0 && adSpendInput > 0
                        ? `$${derivedCpl < 10 ? derivedCpl.toFixed(2) : Math.round(derivedCpl).toLocaleString()}`
                        : '-'}
                    </span>
                    <p className="si2__helper">Lead generation spend divided by lead volume.</p>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="sim2-ready-panel">
                <div>
                  <span className="sim2-ready-panel__label">Your baseline</span>
                  <strong>{baselineSummary}</strong>
                </div>
                <p>Use the levers next. The headline updates as soon as you move them.</p>
              </div>
            )}

            <div className="sim2-setup-actions">
              <button
                type="button"
                className="sim2-secondary-cta"
                onClick={() => setSetupStep(step => Math.max(0, step - 1))}
                disabled={setupStep === 0}
              >
                Back
              </button>
              {setupStep < SETUP_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="sim2-primary-cta"
                  onClick={() => setSetupStep(step => Math.min(SETUP_STEPS.length - 1, step + 1))}
                >
                  Continue
                </button>
              ) : (
                <button type="button" className="sim2-primary-cta" onClick={goToSimulator}>
                  Start experimenting
                </button>
              )}
            </div>
          </section>
        </main>
      ) : (
        <main className={`sim2-workspace${tourDismissed ? ' sim2-workspace--tour-dismissed' : ''}`} ref={rightPanelRef}>
          <div className="sim2-topbar sim2-topbar--compact">
            <button
              type="button"
              className="sim2-tour-launch"
              onClick={() => { setTourStep(0); setTourOpen(true); setTourDismissed(false) }}
            >
              Show me how it works
            </button>
          </div>

          <section className="sim2-main-grid">
            <div className={`sim2-reveal${tourTargetClass('upside')}`}>
              <div className="sim2-reveal__top">
                <div className="sim2-reveal__left">
                  <div className="sim2-reveal__eyebrow">Estimated annual upside</div>
                  <span className="sim2-reveal__big" ref={annualRef}>+$0/yr</span>
                  <div className="sim2-reveal__sub">
                    <span ref={subMonthRef}>= +$0/mo additional</span>
                    <span ref={subRoiRef} />
                  </div>
                  <p className="sim2-reveal__plain">This estimates the extra revenue you could unlock if these improvements were in place.</p>
                </div>
                <div className={`sim2-actions${tourTargetClass('actions')}`}>
                  <BookCallButton className="sim2-primary-cta">Book a Growth Strategy Call</BookCallButton>
                  <button type="button" className="sim2-secondary-cta" onClick={() => handleSave('pdf')}>Save report</button>
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
              <div className={`sim2-reveal__charts${tourTargetClass('charts')}`}>
                <div className="sim2-chart-panel">
                  <div className="sim2-chart-hdr">
                    <span className="sim2-chart-hdr__label">Additional clients per month</span>
                    <span className="sim2-badge sim2-badge--cyan" ref={cBadgeRef}>+0.0 clients</span>
                  </div>
                  <canvas ref={clientsCanvasRef} className="sim2-canvas" />
                </div>
                <div className="sim2-chart-panel">
                  <div className="sim2-chart-hdr">
                    <span className="sim2-chart-hdr__label">Additional revenue per month</span>
                    <span className="sim2-badge sim2-badge--cyan" ref={rBadgeRef}>+$0/mo</span>
                  </div>
                  <canvas ref={revenueCanvasRef} className="sim2-canvas" />
                </div>
                <div className="sim2-chart-panel">
                  <div className="sim2-chart-hdr">
                    <span className="sim2-chart-hdr__label">Cost saving per month</span>
                    <span className="sim2-badge sim2-badge--pink" ref={dBadgeRef}>$0 saved</span>
                  </div>
                  <canvas ref={donutCanvasRef} className="sim2-canvas" />
                </div>
              </div>
            </div>

            <div className={`sim2-levers-panel${tourTargetClass('levers')}`}>
              <div className="sim2-section-hd">Growth improvements</div>
              <div className="sim2-workspace-prompt">
                <span>Move the three levers to see what changes.</span>
                <strong>{baselineSummary}</strong>
              </div>
              <p className="sim2-levers-help">Try one lever at a time, then combine them to see the full upside.</p>
              <SimLever
                label="Follow-up speed"
                desc="How quickly leads are contacted after enquiring"
                value={paceVal} onChange={setPaceVal} avgPct={30}
                ticks={['Days', 'Same day', '1 hr', '<5 min']}
                statusLabel={paceLabel(paceVal)}
                impactLabel={`Adds about +$${fmt(paceMonthlyImpact)}/mo.`}
              />
              <SimLever
                label="Personalisation"
                desc="How relevant and specific each outreach message feels"
                value={personVal} onChange={setPersonVal} avgPct={25}
                ticks={['Generic', 'Some', 'Tailored', '1:1']}
                statusLabel={personLabel(personVal)}
                impactLabel={`Adds about +$${fmt(personMonthlyImpact)}/mo.`}
              />
              <SimLever
                label="Process automation"
                desc="How much lead handling and admin is automated"
                value={autoVal} onChange={setAutoVal} avgPct={20}
                ticks={['Manual', 'Partial', 'Mostly', 'Full']}
                statusLabel={autoLabel(autoVal)}
                impactLabel={`Saves about $${fmt(autoSave)}/mo.`}
              />
              <div className="sim2-avg-legend">
                <span className="sim2-avg-dot" />
                <span>Industry average</span>
              </div>
              <button
                type="button"
                className="sim2-edit-baseline sim2-edit-baseline--panel"
                onClick={() => setBaselineDrawerOpen(true)}
              >
                Edit baseline
              </button>
            </div>
          </section>

          <p className="sim2-disclaimer">
            Results are indicative. Based on published industry benchmarks; individual outcomes may differ.
          </p>

          {tourOpen && (
            <>
              <div className="sim2-tour-scrim" />
              <section className="sim2-tour-card" aria-live="polite" aria-label="Simulator tour">
                <div className="sim2-tour-card__step">Step {tourStep + 1} of {TOUR_STEPS.length}</div>
                <h2>{activeTour.title}</h2>
                <p>{activeTour.copy}</p>
                <div className="sim2-tour-card__actions">
                  <button type="button" className="sim2-tour-skip" onClick={closeTour}>Skip</button>
                  <button
                    type="button"
                    className="sim2-secondary-cta"
                    onClick={() => setTourStep(step => Math.max(0, step - 1))}
                    disabled={tourStep === 0}
                  >
                    Back
                  </button>
                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <button
                      type="button"
                      className="sim2-primary-cta"
                      onClick={() => setTourStep(step => Math.min(TOUR_STEPS.length - 1, step + 1))}
                    >
                      Next
                    </button>
                  ) : (
                    <button type="button" className="sim2-primary-cta" onClick={closeTour}>
                      Start estimating
                    </button>
                  )}
                </div>
              </section>
            </>
          )}

          {baselineDrawerOpen && (
            <div className="sim2-drawer-backdrop" onClick={() => setBaselineDrawerOpen(false)}>
              <aside className="sim2-baseline-drawer" onClick={e => e.stopPropagation()} aria-label="Edit baseline">
                <div className="sim2-drawer-head">
                  <div>
                    <span className="sim2-section-hd">Baseline</span>
                    <h2>Edit your current numbers</h2>
                  </div>
                  <button type="button" className="sim2-drawer-close" onClick={() => setBaselineDrawerOpen(false)} aria-label="Close baseline editor">Close</button>
                </div>

                <div className="sim2-presets" aria-label="Starting profiles">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`sim2-preset${selectedPreset === preset.id ? ' sim2-preset--active' : ''}`}
                      onClick={() => applyPreset(preset)}
                    >
                      <span>{preset.label}</span>
                      <small>{preset.helper}</small>
                    </button>
                  ))}
                </div>

                <div className="sim2-input-group">
                  <div className="sim2-section-hd">Your current business</div>
                  <div className="si2-row">
                    <SimInput label="How many leads do you get each month?" value={leadsStr} onChange={setCustom(setLeadsStr)} half />
                    <SimInput
                      label="The percentage of leads that turn into paying clients"
                      value={convStr}
                      onChange={setCustom(setConvStr)}
                      half
                      suffix="%"
                    />
                  </div>
                  <SimInput label="Average client lifetime value" value={revStr} onChange={setCustom(setRevStr)} prefix="$" />
                </div>

                <div className="sim2-input-group">
                  <div className="sim2-section-hd">Your costs</div>
                  <div className="si2-row">
                    <SimInput
                      label="Manual time spent on each lead"
                      value={timeStr}
                      onChange={setCustom(setTimeStr)}
                      half
                      suffix="hrs"
                      helperText="How long your team spends replying, qualifying, and updating records for each lead."
                    />
                    <SimInput
                      label="Hourly cost for the business"
                      value={hourStr}
                      onChange={setCustom(setHourStr)}
                      half
                      prefix="$"
                      suffix="/hr"
                      helperText="Use the loaded hourly cost of the person handling leads."
                    />
                  </div>
                  <div className="si2-row">
                    <SimInput label="Monthly spend on lead generation (e.g. ads, SEO, etc.)" value={adSpendStr} onChange={setCustom(setAdSpendStr)} prefix="$" half />
                    <div className="si2 si2--half si2--derived">
                      <div className="si2__label-row">
                        <span className="si2__label">Cost per lead</span>
                        <span className="si2__info" title="Monthly lead generation spend divided by monthly leads." aria-label="Monthly lead generation spend divided by monthly leads.">i</span>
                      </div>
                      <span className="si2__derived-val">
                        {leads > 0 && adSpendInput > 0
                          ? `$${derivedCpl < 10 ? derivedCpl.toFixed(2) : Math.round(derivedCpl).toLocaleString()}`
                          : '-'}
                      </span>
                      <p className="si2__helper">Lead generation spend divided by lead volume.</p>
                    </div>
                  </div>
                </div>

                <button type="button" className="sim2-primary-cta sim2-drawer-done" onClick={() => setBaselineDrawerOpen(false)}>
                  Done
                </button>
              </aside>
            </div>
          )}
        </main>
      )}
    </div>
  )
}
