'use client'

import { useCallback, useEffect, useRef, useState, Suspense, type FormEvent } from 'react'
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
    values: { leads: '30', conversion: '3', revenue: '2500', time: '0.5', hourly: '40', adSpend: '700' },
  },
  {
    id: 'agency',
    label: 'Agency',
    helper: 'Lead-gen dependent team',
    values: { leads: '120', conversion: '4', revenue: '7500', time: '0.75', hourly: '95', adSpend: '5200' },
  },
  {
    id: 'professional-service',
    label: 'Professional Service',
    helper: 'Consulting or advisory',
    values: { leads: '90', conversion: '4', revenue: '7000', time: '0.65', hourly: '85', adSpend: '3200' },
  },
  {
    id: 'small-business',
    label: 'Small Business',
    helper: 'Growing service team',
    values: { leads: '50', conversion: '5', revenue: '4000', time: '0.45', hourly: '45', adSpend: '1600' },
  },
] as const

type PresetId = typeof PRESETS[number]['id'] | 'custom'
type SetupMode = 'setup' | 'simulator'
type TourTarget = 'guide' | 'upside' | 'levers' | 'baseline' | 'charts' | 'actions'

const SETUP_STEPS = [
  { eyebrow: 'Step 1 of 5', title: 'Choose your profile', copy: 'Pick the profile that feels closest to how your business works. We will create starter numbers you can adjust next.' },
  { eyebrow: 'Step 2 of 5', title: 'Confirm your numbers', copy: 'These three numbers estimate what your leads are worth today.' },
  { eyebrow: 'Step 3 of 5', title: 'Add your current costs', copy: 'This helps the simulator show where time and ad spend are being used.' },
  { eyebrow: 'Step 4 of 5', title: 'How does your lead handling work today?', copy: 'Set your current response speed, personalisation, and automation level so the simulator shows you the revenue leak relative to where you actually are — not a generic baseline.' },
  { eyebrow: 'Step 5 of 5', title: 'Now see what the gaps are costing you.', copy: 'Move the three levers to see the revenue impact of slower response, generic follow-up, and manual admin.' },
] as const

const MATURITY_OPTIONS = [
  { value: 0, label: 'Days', helper: 'Slow or inconsistent' },
  { value: 33, label: 'Same day', helper: 'Usually same day' },
  { value: 66, label: 'Within 1 hour', helper: 'Fast team response' },
  { value: 100, label: 'Under 5 minutes', helper: 'Near-instant response' },
] as const

const PERSONALISATION_OPTIONS = [
  { value: 0, label: 'Generic', helper: 'Same message for most leads' },
  { value: 33, label: 'Lightly tailored', helper: 'Some context included' },
  { value: 66, label: 'Tailored', helper: 'Relevant to the enquiry' },
  { value: 100, label: 'One-to-one', helper: 'Specific and personal' },
] as const

const AUTOMATION_OPTIONS = [
  { value: 0, label: 'Manual', helper: 'Mostly handled by people' },
  { value: 33, label: 'Partly automated', helper: 'Some steps automated' },
  { value: 66, label: 'Mostly automated', helper: 'Most admin is automated' },
  { value: 100, label: 'Fully automated', helper: 'Highly systemised' },
] as const

const INFRA_TARGETS = {
  pace: 95,
  personalisation: 85,
  automation: 90,
} as const

const TOUR_STEPS: { target: TourTarget; title: string; copy: string }[] = [
  {
    target: 'guide',
    title: 'How to use the tool',
    copy: 'We show you the annual revenue your current system is likely leaving on the table — across three conversion levers: response speed, personalisation, and automation.',
  },
  {
    target: 'upside',
    title: 'This is your estimated revenue leak.',
    copy: 'The big number shows the annual revenue your current system is leaving on the table. The monthly line breaks that down into what slow response is costing you every month.',
  },
  {
    target: 'levers',
    title: 'Move the levers to see what slow response is costing you.',
    copy: 'The levers start at your current setup. Move them to see how much revenue each gap is costing you — across response speed, follow-up relevance, and automation. The pink marker shows where a strong conversion infrastructure operates.',
  },
  {
    target: 'baseline',
    title: 'Change the baseline values.',
    copy: 'Use Edit baseline whenever the starting numbers need to change. Updating your leads, conversion rate, or client value recalculates your revenue leak immediately.',
  },
  {
    target: 'charts',
    title: 'Use the graphs as proof, not homework.',
    copy: 'The charts show what changes when the gaps close: clients recovered, monthly revenue recovered, and how your current spend is being used.',
  },
  {
    target: 'actions',
    title: 'Decide what to do next.',
    copy: 'If the revenue leak feels worth fixing, save the report or book a call to work through what\'s causing it and whether the Lead-to-Revenue System™ is the right fit.',
  },
]

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmt(n: number)                  { return Math.round(n).toLocaleString() }
function fmtD(n: number, d = 1)          { return n.toFixed(d) }
function sign(n: number, pfx = '')       { return (n >= 0 ? '+' : '') + pfx + fmt(Math.abs(Math.round(n))) }
function dataUrlToBase64(dataUrl: string) { return dataUrl.split(',')[1] ?? dataUrl }
function optionLabel(options: readonly { value: number; label: string }[], value: number) {
  return options.find(option => option.value === value)?.label ?? ''
}

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
  nowConv?: number,
  rapidConv?: number,
) {
  const setup = setupCanvas(canvas)
  if (!setup) return
  const [ctx, W, H] = setup
  ctx.clearRect(0, 0, W, H)

  function fv(v: number) { return isMoney ? '$' + fmt(v) + '/mo' : fmtD(v, 1) }

  const maxVal  = Math.max(nowVal, rapidVal, 0.001)
  const barW    = W * 0.21
  const gap     = W * 0.12
  const totalBW = barW * 2 + gap
  const startX  = (W - totalBW) / 2
  const maxBarH = H * 0.74
  const baseY   = H * 0.90

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

  // Conversion rates inside bars
  if (nowConv != null || rapidConv != null) {
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.font         = '700 10px Inter, sans-serif'
    if (nowConv != null && nowH > 20) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillText(fmtD(nowConv, 1) + '%', startX + barW / 2, baseY - nowH / 2)
    }
    if (rapidConv != null && rapH > 20) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(fmtD(rapidConv, 1) + '%', startX + barW + gap + barW / 2, baseY - rapH / 2)
    }
  }

  // Values above bars
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'bottom'
  ctx.font      = isMoney ? '800 15px Inter, sans-serif' : '800 14px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  if (nowH > 0) ctx.fillText(fv(nowVal),   startX + barW / 2,                   baseY - nowH - 4)
  ctx.fillStyle = '#3dcab1'
  if (rapH > 0) ctx.fillText(fv(rapidVal), startX + barW + gap + barW / 2, baseY - rapH - 4)

  // Labels below bars
  ctx.textBaseline = 'top'
  ctx.font         = '700 9px Inter, sans-serif'
  ctx.fillStyle    = 'rgba(255,255,255,0.45)'
  if (nowH > 0) ctx.fillText(nowLegend, startX + barW / 2, baseY + 6)
  ctx.fillStyle = '#7ee1d0'
  if (rapH > 0) ctx.fillText(rapidLegend, startX + barW + gap + barW / 2, baseY + 6)
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

/* ─── SetupSlider ────────────────────────────────────────────────── */
function SetupSlider({ label, value, min, max, step, onChange, format }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <div className="setup-slider">
      <div className="setup-slider__hdr">
        <span className="setup-slider__label">{label}</span>
        <span className="setup-slider__val">{format(value)}</span>
      </div>
      <input
        type="range"
        className="slider-input"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <div className="setup-slider__ends">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
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

function MaturityChoiceGroup({ label, value, options, onChange }: {
  label: string
  value: number
  options: readonly { value: number; label: string; helper: string }[]
  onChange: (value: number) => void
}) {
  return (
    <div className="sim2-maturity-group">
      <div className="sim2-maturity-group__label">{label}</div>
      <div className="sim2-maturity-options">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            className={`sim2-maturity-option${value === option.value ? ' sim2-maturity-option--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            <small>{option.helper}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── SimLever ───────────────────────────────────────────────────── */
function SimLever({ label, desc, value, onChange, avgPct, baselinePct, infrastructurePct, ticks, statusLabel, impactLabel }: {
  label: string; desc: string; value: number; onChange: (v: number) => void
  avgPct: number; baselinePct: number; infrastructurePct: number; ticks: string[]; statusLabel: string; impactLabel?: string
}) {
  return (
    <div className="sl2">
      <div className="sl2__hdr">
        <span className="sl2__name">{label}</span>
        <span className="sl2__status">{statusLabel}</span>
      </div>
      <p className="sl2__desc">{desc}</p>
      <div className="sl2__endpoints" aria-hidden="true">
        <span>Baseline</span>
        <span>Target</span>
      </div>
      <div className="sl2__track-wrap">
        <input
          type="range" className="slider-input"
          min={0} max={100} step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
        <div className="sl2__marker sl2__marker--baseline" style={{ left: `calc(${baselinePct / 100} * (100% - 22px) + 11px)` }} />
        <div className="sl2__marker sl2__marker--avg" style={{ left: `calc(${avgPct / 100} * (100% - 22px) + 11px)` }} />
        <div className="sl2__marker sl2__marker--infra" style={{ left: `calc(${infrastructurePct / 100} * (100% - 22px) + 11px)` }} />
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
  const [reportOpen, setReportOpen] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportEmail, setReportEmail] = useState('')
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'sent'>('idle')
  const [reportError, setReportError] = useState('')

  // Inputs
  const [leadsStr, setLeadsStr] = useState('30')
  const [convStr,  setConvStr]  = useState('8')
  const [revStr,   setRevStr]   = useState('2500')
  const [timeStr,  setTimeStr]  = useState('0.5')
  const [hourStr,  setHourStr]  = useState('40')
  const [adSpendStr, setAdSpendStr] = useState('700')
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('founder')
  const [baselinePaceVal, setBaselinePaceVal] = useState(0)
  const [baselinePersonVal, setBaselinePersonVal] = useState(0)
  const [baselineAutoVal, setBaselineAutoVal] = useState(0)

  // Sliders
  const [paceVal,   setPaceVal]   = useState<number>(INFRA_TARGETS.pace)
  const [personVal, setPersonVal] = useState<number>(INFRA_TARGETS.personalisation)
  const [autoVal,   setAutoVal]   = useState<number>(INFRA_TARGETS.automation)

  // Canvas refs
  const revenueCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightPanelRef    = useRef<HTMLElement>(null)

  // Animated DOM refs
  const annualRef    = useRef<HTMLSpanElement>(null)
  const convRef      = useRef(0)

  // Parsed
  const leads    = Math.max(0, parseFloat(leadsStr) || 0)
  const conv     = Math.max(0, Math.min(100, parseFloat(convStr) || 0))
  convRef.current = conv
  const revenue  = Math.max(0, parseFloat(revStr)   || 0)
  const timeLead = Math.max(0, parseFloat(timeStr)  || 0)
  const hourly   = Math.max(0, parseFloat(hourStr)  || 0)
  const adSpendInput = Math.max(0, parseFloat(adSpendStr) || 0)

  // Calc
  const paceDelta = Math.max(0, paceVal - baselinePaceVal)
  const personDelta = Math.max(0, personVal - baselinePersonVal)
  const autoDelta = Math.max(0, autoVal - baselineAutoVal)
  const pLift  = (paceDelta / 100) * PACE_MAX_PP
  const perLift = (personDelta / 100) * PERSON_MAX_PP
  const impConv = Math.min(conv + pLift + perLift, 100)
  const convDelta = impConv - conv

  const nowClients  = leads * (conv    / 100)
  const rapClients  = leads * (impConv / 100)
  const nowRevenue  = nowClients * revenue
  const rapRevenue  = rapClients * revenue

  const timeCost    = leads * timeLead * hourly
  const adSpend     = adSpendInput
  const derivedCpl  = leads > 0 ? adSpend / leads : 0
  const autoSave    = (autoDelta / 100) * timeCost
  const remTimeCost = timeCost - autoSave
  const remCost     = remTimeCost + adSpend

  const monthlyGain = (rapRevenue - nowRevenue) + autoSave
  const annualGain  = monthlyGain * 12
  const roi         = adSpend > 0 ? annualGain / (adSpend * 12) : 0

  const totalClientsLost = rapClients - nowClients
  const conversionRevenueLeak = rapRevenue - nowRevenue
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
  const systemBaselineSummary = `${optionLabel(MATURITY_OPTIONS, baselinePaceVal)} · ${optionLabel(PERSONALISATION_OPTIONS, baselinePersonVal)} · ${optionLabel(AUTOMATION_OPTIONS, baselineAutoVal)}`
  const businessType = selectedPreset === 'custom'
    ? 'Custom'
    : PRESETS.find(preset => preset.id === selectedPreset)?.label ?? 'Custom'
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
    setPaceVal(Math.max(baselinePaceVal, INFRA_TARGETS.pace))
    setPersonVal(Math.max(baselinePersonVal, INFRA_TARGETS.personalisation))
    setAutoVal(Math.max(baselineAutoVal, INFRA_TARGETS.automation))
    setTourStep(0)
    setTourDismissed(false)
    setTourOpen(true)
  }

  const setPaceTarget = (value: number) => setPaceVal(Math.max(baselinePaceVal, value))
  const setPersonTarget = (value: number) => setPersonVal(Math.max(baselinePersonVal, value))
  const setAutoTarget = (value: number) => setAutoVal(Math.max(baselineAutoVal, value))
  const updateBaselinePace = (value: number) => {
    setBaselinePaceVal(value)
    setPaceVal(current => Math.max(value, current))
  }
  const updateBaselinePerson = (value: number) => {
    setBaselinePersonVal(value)
    setPersonVal(current => Math.max(value, current))
  }
  const updateBaselineAuto = (value: number) => {
    setBaselineAutoVal(value)
    setAutoVal(current => Math.max(value, current))
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
      if (annualRef.current)   annualRef.current.textContent   = '$' + fmt(a.annualGain) + '/yr'

      // Canvas
      if (revenueCanvasRef.current) drawBarChart(revenueCanvasRef.current, a.nowRevenue, a.rapRevenue, true,  'Current system', 'With L2R system', convRef.current, a.impConv)

      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const captureReportImage = useCallback(async () => {
    const el = rightPanelRef.current
    if (!el) throw new Error('Report area is not available')
    return toJpeg(el, {
      quality: 0.93,
      backgroundColor: '#0e1117',
      cacheBust: true,
      filter: node => !(node instanceof HTMLElement && node.classList.contains('sim2-report-overlay')),
    })
  }, [])

  const openReportModal = () => {
    setReportOpen(true)
    setReportStatus('idle')
    setReportError('')
  }

  const closeReportModal = () => {
    if (reportStatus === 'submitting') return
    setReportOpen(false)
  }

  const handleReportSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = reportName.trim()
    const email = reportEmail.trim()
    if (!name) {
      setReportError('Enter your name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setReportError('Enter a valid email address.')
      return
    }

    setReportStatus('submitting')
    setReportError('')

    try {
      const image = dataUrlToBase64(await captureReportImage())
      const payload = {
        name,
        email,
        date,
        image,
        businessType,
        baseline: {
          summary: baselineSummary,
          leads,
          conversionRate: conv,
          revenuePerClient: revenue,
          timePerLeadHours: timeLead,
          hourlyCost: hourly,
          monthlyLeadGenerationSpend: adSpend,
          costPerLead: derivedCpl,
          followUpSpeed: optionLabel(MATURITY_OPTIONS, baselinePaceVal),
          followUpSpeedValue: baselinePaceVal,
          personalisation: optionLabel(PERSONALISATION_OPTIONS, baselinePersonVal),
          personalisationValue: baselinePersonVal,
          automation: optionLabel(AUTOMATION_OPTIONS, baselineAutoVal),
          automationValue: baselineAutoVal,
        },
      }

      const res = await fetch('/api/simulator-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Report delivery failed')

      setReportStatus('sent')
      setToast('Report sent')
    } catch (err) {
      setReportStatus('idle')
      setReportError(err instanceof Error ? err.message : 'Report delivery failed. Try again.')
    }
  }, [
    adSpend,
    baselineAutoVal,
    baselinePaceVal,
    baselinePersonVal,
    baselineSummary,
    businessType,
    captureReportImage,
    conv,
    date,
    derivedCpl,
    hourly,
    leads,
    reportEmail,
    reportName,
    revenue,
    timeLead,
  ])

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
                <SetupSlider
                  label="Monthly leads"
                  value={parseFloat(leadsStr) || 0}
                  min={1} max={500} step={1}
                  onChange={v => { setLeadsStr(String(v)); setSelectedPreset('custom') }}
                  format={v => `${v} leads`}
                />
                <SetupSlider
                  label="Conversion rate"
                  value={parseFloat(convStr) || 0}
                  min={0.5} max={30} step={0.5}
                  onChange={v => { setConvStr(String(v)); setSelectedPreset('custom') }}
                  format={v => `${v}%`}
                />
                <SetupSlider
                  label="Average client value"
                  value={parseFloat(revStr) || 0}
                  min={500} max={50000} step={500}
                  onChange={v => { setRevStr(String(v)); setSelectedPreset('custom') }}
                  format={v => `$${v.toLocaleString()}`}
                />
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
                    label="Average hourly cost for the business"
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
              <div className="sim2-maturity-panel">
                <MaturityChoiceGroup
                  label="How quickly do you normally respond?"
                  value={baselinePaceVal}
                  options={MATURITY_OPTIONS}
                  onChange={updateBaselinePace}
                />
                <MaturityChoiceGroup
                  label="How personalised is your first response?"
                  value={baselinePersonVal}
                  options={PERSONALISATION_OPTIONS}
                  onChange={updateBaselinePerson}
                />
                <MaturityChoiceGroup
                  label="Is the process currently automated?"
                  value={baselineAutoVal}
                  options={AUTOMATION_OPTIONS}
                  onChange={updateBaselineAuto}
                />
              </div>
            )}

            {setupStep === 4 && (
              <div className="sim2-ready-panel">
                <div>
                  <span className="sim2-ready-panel__label">Your baseline</span>
                  <strong>{baselineSummary}</strong>
                  <small>{systemBaselineSummary}</small>
                </div>
                <p>The levers start from your current setup, so the number reflects only what your existing gaps are costing you — not a theoretical maximum.</p>
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
                  Start
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
              className={`sim2-tour-launch${tourTargetClass('guide')}`}
              onClick={() => { setTourStep(0); setTourOpen(true); setTourDismissed(false) }}
            >
              Show me how it works
            </button>
          </div>

          <section className="sim2-main-grid">
            <div className={`sim2-reveal${tourTargetClass('upside')}`}>
              <div className="sim2-reveal__top">
                <div className="sim2-reveal__left">
                  <div className="sim2-reveal__eyebrow sim2-reveal__eyebrow--hero">Estimated Annual Revenue Leak</div>
                  <span className="sim2-reveal__big" ref={annualRef}>$0/yr</span>
                  <p className="sim2-reveal__plain">This estimates the revenue your current system is leaving on the table based on your inputs.</p>
                </div>
                <div className={`sim2-actions sim2-actions--reveal${tourTargetClass('actions')}`}>
                  <BookCallButton className="sim2-primary-cta sim2-primary-cta--pink">Book a Call</BookCallButton>
                  <button type="button" className="sim2-secondary-cta" onClick={openReportModal}>Get report by email</button>
                </div>
              </div>
              <div className={`sim2-reveal__charts${tourTargetClass('charts')}`}>
                <div className="sim2-story-intro">
                  <span className="sim2-story-intro__eyebrow">Where the revenue leak comes from (conservative figures)</span>
                  <p className="sim2-story-intro__copy">Three places your current process is likely leaking value before the monthly proof view below.</p>
                </div>
                <div className="sim2-story-grid">
                  <article className="sim2-story-card">
                    <span className="sim2-story-card__eyebrow">1. Missed clients</span>
                    <strong className="sim2-story-card__value">{fmtD(totalClientsLost, 1)} clients/mo</strong>
                    <p className="sim2-story-card__copy">Likely slipping away because slow response and weak follow-up reduce how many leads become paying clients.</p>
                  </article>
                  <article className="sim2-story-card">
                    <span className="sim2-story-card__eyebrow">2. Weak follow-up conversion</span>
                    <strong className="sim2-story-card__value">${fmt(personMonthlyImpact)}/mo</strong>
                    <p className="sim2-story-card__copy">Lost because leads is not getting value quickly enough and turns to competitors for the service.</p>
                  </article>
                  <article className="sim2-story-card">
                    <span className="sim2-story-card__eyebrow">3. Manual lead handling</span>
                    <strong className="sim2-story-card__value">${fmt(autoSave)}/mo</strong>
                    <p className="sim2-story-card__copy">Time and cost lost doing admin work that could be automated once a lead comes in.</p>
                  </article>
                </div>
                <div className="sim2-proof-card">
                  <div className="sim2-proof-card__intro">
                    <div className="sim2-chart-hdr">
                      <span className="sim2-chart-hdr__label">Monthly revenue: current system vs with L2R system</span>
                    </div>
                    <p className="sim2-proof-card__copy">Conversion rate is <strong className="sim2-proof-card__highlight">{fmtD(convDelta, 1)}pp</strong> behind: {fmtD(conv, 1)}% vs {fmtD(impConv, 1)}%. This directly translates in missing monthly revenue.</p>
                  </div>
                  <div className="sim2-proof-main">
                    <canvas ref={revenueCanvasRef} className="sim2-canvas sim2-canvas--proof" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`sim2-levers-panel${tourTargetClass('levers')}`}>
              <div className="sim2-section-hd sim2-section-hd--panel-title">Conversion levers</div>
              <p className="sim2-levers-help">Move the three levers to see what changes. Faster response and more relevant follow-up can increase conversion; automation reduces handling cost.</p>
              <SimLever
                label="Follow-up speed"
                desc="How quickly leads are contacted after enquiring"
                value={paceVal} onChange={setPaceTarget} avgPct={30} baselinePct={baselinePaceVal} infrastructurePct={INFRA_TARGETS.pace}
                ticks={['Days', 'Same day', '1 hr', '<5 min']}
                statusLabel={paceLabel(paceVal)}
                impactLabel={`Recovers about $${fmt(paceMonthlyImpact)}/mo.`}
              />
              <SimLever
                label="Personalisation"
                desc="How relevant and specific each outreach message feels"
                value={personVal} onChange={setPersonTarget} avgPct={25} baselinePct={baselinePersonVal} infrastructurePct={INFRA_TARGETS.personalisation}
                ticks={['Generic', 'Some', 'Tailored', '1:1']}
                statusLabel={personLabel(personVal)}
                impactLabel={`Recovers about $${fmt(personMonthlyImpact)}/mo.`}
              />
              <SimLever
                label="Process automation"
                desc="How much lead handling and admin is automated"
                value={autoVal} onChange={setAutoTarget} avgPct={20} baselinePct={baselineAutoVal} infrastructurePct={INFRA_TARGETS.automation}
                ticks={['Manual', 'Partial', 'Mostly', 'Full']}
                statusLabel={autoLabel(autoVal)}
                impactLabel={`Saves about $${fmt(autoSave)}/mo.`}
              />
              <div className="sim2-baseline-summary">
                <div>
                  <span>Current baseline</span>
                  <strong>{baselineSummary}</strong>
                  <small>{systemBaselineSummary}</small>
                </div>
                <button
                  type="button"
                  className={`sim2-edit-baseline${tourTargetClass('baseline')}`}
                  onClick={() => setBaselineDrawerOpen(true)}
                >
                  Edit
                </button>
              </div>
              <div className="sim2-avg-legend">
                <span><i className="sim2-avg-dot sim2-avg-dot--baseline" />Your baseline</span>
                <span><i className="sim2-avg-dot" />Industry average</span>
                <span><i className="sim2-avg-dot sim2-avg-dot--infra" />Conversion infrastructure</span>
              </div>
            </div>
            <p className="sim2-disclaimer sim2-disclaimer--grid">
              Results are indicative. Based on published industry benchmarks; individual outcomes may differ.
            </p>
          </section>

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
                      Start
                    </button>
                  )}
                </div>
              </section>
            </>
          )}

          {reportOpen && (
            <div className="sim2-report-overlay" onClick={closeReportModal}>
              <form className="sim2-report-modal" onSubmit={handleReportSubmit} onClick={e => e.stopPropagation()}>
                <div className="sim2-report-modal__head">
                  <div>
                    <span className="sim2-section-hd">Email report</span>
                    <h2>Get your diagnostic and next steps</h2>
                  </div>
                  <button
                    type="button"
                    className="sim2-drawer-close"
                    onClick={closeReportModal}
                    aria-label="Close report form"
                    disabled={reportStatus === 'submitting'}
                  >
                    Close
                  </button>
                </div>
                {reportStatus === 'sent' ? (
                  <div className="sim2-report-success">
                    <strong>Report sent.</strong>
                    <p>Check your inbox for the diagnostic and recommended next steps.</p>
                    <button type="button" className="sim2-primary-cta sim2-primary-cta--pink" onClick={closeReportModal}>
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="sim2-report-copy">
                      We will send your diagnostic image and baseline values to your inbox.
                    </p>
                    <label className="sim2-report-field">
                      <span>Name</span>
                      <input
                        type="text"
                        value={reportName}
                        onChange={e => setReportName(e.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                        required
                      />
                    </label>
                    <label className="sim2-report-field">
                      <span>Email address</span>
                      <input
                        type="email"
                        value={reportEmail}
                        onChange={e => setReportEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="email"
                        required
                      />
                    </label>
                    {reportError && <p className="sim2-report-error">{reportError}</p>}
                    <button
                      type="submit"
                      className="sim2-primary-cta sim2-primary-cta--pink sim2-report-submit"
                      disabled={reportStatus === 'submitting'}
                    >
                      {reportStatus === 'submitting' ? 'Sending report...' : 'Send my report'}
                    </button>
                  </>
                )}
              </form>
            </div>
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
                      label="Average hourly cost for the business"
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

                <div className="sim2-input-group">
                  <div className="sim2-section-hd">Your current system</div>
                  <div className="sim2-maturity-panel sim2-maturity-panel--drawer">
                    <MaturityChoiceGroup
                      label="How quickly do you normally respond?"
                      value={baselinePaceVal}
                      options={MATURITY_OPTIONS}
                      onChange={updateBaselinePace}
                    />
                    <MaturityChoiceGroup
                      label="How personalised is your first response?"
                      value={baselinePersonVal}
                      options={PERSONALISATION_OPTIONS}
                      onChange={updateBaselinePerson}
                    />
                    <MaturityChoiceGroup
                      label="Is the process currently automated?"
                      value={baselineAutoVal}
                      options={AUTOMATION_OPTIONS}
                      onChange={updateBaselineAuto}
                    />
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
