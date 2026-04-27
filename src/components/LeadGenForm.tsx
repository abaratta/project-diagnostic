'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'


function formatBudget(val: number) {
  if (val === 0) return '$0'
  if (val >= 1000) {
    const k = val / 1000
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return `$${val}`
}

function formatHours(h: number) {
  if (h === 0) return '0 hrs / week'
  if (h === 1) return '1 hr / week'
  return `${h} hrs / week`
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

function fmt2(n: number): string {
  if (n === 0) return '0'
  const r = parseFloat(n.toFixed(2))
  return Number.isInteger(r) ? r.toLocaleString() : r.toFixed(2)
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}

function Tick({ pct, label }: { pct: number; label: string }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0,
      left: `calc(${pct / 100} * (100% - 22px) + 11px)`,
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      pointerEvents: 'none',
    }}>
      <div style={{ width: '1px', height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

const TOTAL_STEPS = 3

export function LeadGenForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialStep  = Number(searchParams.get('step')) || 1
  const [step, setStep] = useState(initialStep)

  useEffect(() => {
    router.replace(`/lead-gen?step=${step}`)
  }, [step])

  // Step 1
  const [budget,       setBudget]       = useState(500)
  const [hoursPerWeek, setHoursPerWeek] = useState(2)
  const [clvStep1,     setClvStep1]     = useState('')
  const [mrrStep1,     setMrrStep1]     = useState('')
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  // Step 2 — LinkedIn DM simulation
  const [invites,        setInvites]        = useState('1000')
  const [connectionRate, setConnectionRate] = useState('40')
  const [interestedRate, setInterestedRate] = useState('10')
  const [conversionRate, setConversionRate] = useState('3')
  const [clv,            setClv]            = useState('')
  const [mrr,            setMrr]            = useState('')

  // Sync step 1 CLV/MRR into step 2 (including deletions)
  useEffect(() => { setClv(clvStep1) }, [clvStep1])
  useEffect(() => { setMrr(mrrStep1) }, [mrrStep1])

  // Step 3
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [hasSent, setHasSent] = useState(false)

  // Persist state to sessionStorage so it survives page navigation
  const FORM_KEY = 'lgf_v2'

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FORM_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s.budget      !== undefined) setBudget(s.budget)
      if (s.hours       !== undefined) setHoursPerWeek(s.hours)
      if (s.clvStep1    !== undefined) setClvStep1(s.clvStep1)
      if (s.mrrStep1    !== undefined) setMrrStep1(s.mrrStep1)
      if (s.invites     !== undefined) setInvites(s.invites)
      if (s.connRate    !== undefined) setConnectionRate(s.connRate)
      if (s.intRate     !== undefined) setInterestedRate(s.intRate)
      if (s.convRate    !== undefined) setConversionRate(s.convRate)
      if (s.clv         !== undefined) setClv(s.clv)
      if (s.mrr         !== undefined) setMrr(s.mrr)
      if (s.step        !== undefined) setStep(s.step)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_KEY, JSON.stringify({
        budget, hours: hoursPerWeek, clvStep1, mrrStep1,
        invites, connRate: connectionRate, intRate: interestedRate,
        convRate: conversionRate, clv, mrr, step,
      }))
    } catch {}
  }, [budget, hoursPerWeek, clvStep1, mrrStep1, invites, connectionRate, interestedRate, conversionRate, clv, mrr, step])

  // Funnel calculations
  const invitesNum      = Math.max(0, Number(invites) || 0)
  const connectionNum   = Math.min(100, Math.max(0, Number(connectionRate) || 0))
  const interestedNum   = Math.min(100, Math.max(0, Number(interestedRate) || 0))
  const conversionNum   = Math.min(100, Math.max(0, Number(conversionRate) || 0))
  const connected      = invitesNum * connectionNum / 100
  const interested     = connected * interestedNum / 100
  const convertedCount = interested * conversionNum / 100

  // Final results
  // Annual Revenue: one-time model — CLV × clients/mo × 12 months
  const annualRevenue = clv && convertedCount > 0
    ? Math.round(Number(clv) * convertedCount * 12) : 0
  // ARR: recurring model — each monthly cohort of clients pays MRR for remaining months
  // Year total = MRR × clients/mo × (12+11+...+1) = MRR × clients/mo × 78
  const arr = mrr && convertedCount > 0 ? Math.round(Number(mrr) * convertedCount * 78) : 0

  function validate() {
    const errs: Record<string, string> = {}
    if (step === 1) {
      const hasClv = clvStep1 && Number(clvStep1) > 0
      const hasMrr = mrrStep1 && Number(mrrStep1) > 0
      if (!hasClv && !hasMrr) {
        errs.product = 'Enter at least one value to continue'
      }
    }
    if (step === 2) {
      const hasClv = clv && Number(clv) > 0
      const hasMrr = mrr && Number(mrr) > 0
      if (!hasClv && !hasMrr) {
        errs.clv = 'Enter at least one value to see your projection'
      }
    }
    return errs
  }

  function handleNext() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    if (step < TOTAL_STEPS) setStep(s => s + 1)
  }

  function handleBack() {
    setErrors({})
    if (step === 1) { router.push('/'); return }
    setStep(s => s - 1)
  }

  function handleSend() {
    if (!name.trim()) {
      setErrors(p => ({ ...p, name: 'Enter your name' }))
      return
    }
    if (!email.trim()) {
      setErrors(p => ({ ...p, email: 'Enter your email to receive the pack' }))
      return
    }
    fetch('https://hook.eu2.make.com/4vw7wjkasej6wwbbm838r53k51q7oy1k', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:           name.trim(),
        email:          email.trim(),
        budget:         budget,
        time:           hoursPerWeek,
        clv:            clv,
        mrr:            mrr,
        annual_revenue: annualRevenue,
        arr:            arr,
      }),
    }).catch(() => {})
    setErrors(p => ({ ...p, email: '', sent: 'Pack on its way — check your inbox!' }))
    setHasSent(true)
  }

  return (
    <div className="audit-wizard">

      {/* Progress dots */}
      <div className="wizard-progress">
        <Link href="/" className="wizard-home-btn" aria-label="Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={[
              'wizard-dot',
              i + 1 <= step ? 'wizard-dot--active' : '',
              i + 1 < step  ? 'wizard-dot--done'   : '',
            ].join(' ')}
          />
        ))}
        <span className="wizard-step-label">Step {step} of {TOTAL_STEPS}</span>
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="audit-step-layout">
          <div className="audit-step-fields">
            <div className="stack stack--lg">
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>Your LinkedIn Lead Gen Opportunity</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                  Tell us about your resources and offer so we can model your revenue opportunity.
                </p>
              </div>

              <div className="stack stack--lg">

                <div className="form-group--sm">
                  <label className="form-label">
                    1. What is your lead generation budget —{' '}
                    <strong style={{ color: 'var(--color-accent-cyan)' }}>{formatBudget(budget)}/mo</strong>
                  </label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Slide the bar to the amount you're comfortable spending per month
                  </span>
                  <div style={{ position: 'relative', paddingBottom: '1.5rem' }}>
                    <input
                      type="range" min="0" max="5000" step="100"
                      className="slider-input slider-input--layered"
                      value={budget}
                      onChange={e => setBudget(Number(e.target.value))}
                    />
                    <div className="conv-track-layers" aria-hidden="true"><div className="conv-track-base" /></div>
                    <Tick pct={0}   label="$0" />
                    <Tick pct={50}  label="$2.5k" />
                    <Tick pct={100} label="$5k" />
                  </div>
                </div>

                <div className="form-group--sm">
                  <label className="form-label">
                    2. Time available for lead generation —{' '}
                    <strong style={{ color: 'var(--color-accent-cyan)' }}>{formatHours(hoursPerWeek)}</strong>
                  </label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Use the slider to choose how much time you can dedicate to lead generation
                  </span>
                  <div style={{ position: 'relative', paddingBottom: '1.5rem' }}>
                    <input
                      type="range" min="0" max="40" step="1"
                      className="slider-input slider-input--layered"
                      value={hoursPerWeek}
                      onChange={e => setHoursPerWeek(Number(e.target.value))}
                    />
                    <div className="conv-track-layers" aria-hidden="true"><div className="conv-track-base" /></div>
                    <Tick pct={0}   label="0 h" />
                    <Tick pct={50}  label="20 h" />
                    <Tick pct={100} label="40 h" />
                  </div>
                </div>

                <div className="form-group--sm">
                  <label className="form-label">3. Your Product or Service</label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Enter the price your clients pay — one-off, recurring, or both
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                    <div>
                      <label className="form-label" htmlFor="clv-step1" style={{ fontSize: '0.8125rem' }}>
                        CLV — Client Lifetime Value ($)
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4, display: 'block', marginBottom: '0.375rem' }}>
                        The one-off price paid by your client for the service
                      </span>
                      <input
                        id="clv-step1" type="number" min="0"
                        className="form-input"
                        placeholder="e.g. 3,000"
                        value={clvStep1}
                        onChange={e => setClvStep1(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="mrr-step1" style={{ fontSize: '0.8125rem' }}>
                        MRR — Monthly Recurring Revenue ($)
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4, display: 'block', marginBottom: '0.375rem' }}>
                        The monthly amount paid by your client for your product or service
                      </span>
                      <input
                        id="mrr-step1" type="number" min="0"
                        className="form-input"
                        placeholder="e.g. 500"
                        value={mrrStep1}
                        onChange={e => setMrrStep1(e.target.value)}
                      />
                    </div>
                  </div>
                  {errors.product && <span className="form-error" style={{ marginTop: '0.5rem', display: 'block' }}>{errors.product}</span>}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2 — LinkedIn DM simulation ── */}
      {step === 2 && (
        <div className="audit-step-layout">
          <div className="audit-step-fields">
            <div className="stack stack--lg">
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>DM Simulation</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                  Adjust the funnel variables to model your expected performance. Fields pre-filled with typical values.
                </p>
              </div>

              <div className="stack stack--lg">

                {/* Funnel — 2×2 grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  {/* Invites */}
                  <div className="form-group--sm">
                    <label className="form-label" htmlFor="invites">Invites per month</label>
                    <input
                      id="invites" type="number" min="0"
                      className="form-input"
                      style={{ width: '7.8rem' }}
                      value={invites}
                      onChange={e => setInvites(e.target.value)}
                    />
                    {invitesNum > 1000 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-amber)', display: 'block', marginTop: '0.375rem', lineHeight: 1.4 }}>
                        LinkedIn max connections per month reached (1,000)
                      </span>
                    )}
                  </div>

                  {/* Connection rate */}
                  <div className="form-group--sm">
                    <label className="form-label">Connection accepted (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <input
                        type="number" min="0" max="100"
                        className="form-input"
                        style={{ width: '7.8rem' }}
                        value={connectionRate}
                        onChange={e => setConnectionRate(e.target.value)}
                      />
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>%</span>
                      <span style={{ color: 'var(--color-accent-cyan)', fontWeight: 700, fontSize: '0.875rem' }}>
                        = {fmt2(connected)}/mo
                      </span>
                    </div>
                  </div>

                  {/* Lead interested */}
                  <div className="form-group--sm">
                    <label className="form-label">Leads interested (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <input
                        type="number" min="0" max="100"
                        className="form-input"
                        style={{ width: '7.8rem' }}
                        value={interestedRate}
                        onChange={e => setInterestedRate(e.target.value)}
                      />
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>%</span>
                      <span style={{ color: 'var(--color-accent-cyan)', fontWeight: 700, fontSize: '0.875rem' }}>
                        = {fmt2(interested)}/mo
                      </span>
                    </div>
                  </div>

                  {/* Converted */}
                  <div className="form-group--sm">
                    <label className="form-label">Conversion rate (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <input
                        type="number" min="0" max="100"
                        className="form-input"
                        style={{ width: '7.8rem' }}
                        value={conversionRate}
                        onChange={e => setConversionRate(e.target.value)}
                      />
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>%</span>
                      <span style={{ color: 'var(--color-accent-cyan)', fontWeight: 700, fontSize: '0.875rem' }}>
                        = {fmt2(convertedCount)}/mo
                      </span>
                    </div>
                  </div>

                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.25rem' }} />

                {/* CLV + MRR display */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '0.5rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: 0.6,
                  }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CLV</span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {clv && Number(clv) > 0 ? fmtMoney(Number(clv)) : '—'}
                    </span>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '0.5rem 0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: 0.6,
                  }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>MRR</span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {mrr && Number(mrr) > 0 ? `$${Math.round(Number(mrr)).toLocaleString()}` : '—'}
                    </span>
                  </div>

                </div>

                {/* Results */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>

                  <div style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderTop: '2px solid rgba(61,202,177,0.5)',
                    borderRadius: 'var(--radius-card)',
                    padding: '1.125rem',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                      Annual Revenue
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-accent-cyan)', lineHeight: 1.1 }}>
                      {annualRevenue > 0 ? fmtMoney(annualRevenue) : '—'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
                      CLV × {fmt(convertedCount)} clients/mo × 12 months
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderTop: '2px solid rgba(61,202,177,0.5)',
                    borderRadius: 'var(--radius-card)',
                    padding: '1.125rem',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                      ARR
                    </div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-accent-cyan)', lineHeight: 1.1 }}>
                      {arr > 0 ? fmtMoney(arr) : '—'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
                      MRR × {fmt(convertedCount)} clients/mo × 78 months
                    </div>
                  </div>

                </div>

                {/* Total */}
                <div style={{
                  background: 'rgba(61,202,177,0.10)',
                  border: '1.5px solid var(--color-accent-cyan)',
                  borderRadius: 'var(--radius-card)',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Total
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-accent-cyan)', lineHeight: 1 }}>
                    {annualRevenue + arr > 0 ? fmtMoney(annualRevenue + arr) : '—'}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3 — Results + starter pack ── */}
      {step === 3 && (
        <div className="audit-step-layout">
          <div className="audit-step-fields">
            <div className="stack stack--lg">

              {/* Revenue headline */}
              <div>
                <h2 style={{ marginBottom: '0.375rem' }}>
                  Make{' '}
                  <span style={{ color: 'var(--color-accent-cyan)' }}>
                    {annualRevenue + arr > 0 ? fmtMoney(annualRevenue + arr) : '—'}
                  </span>
                  {' '}per year.
                </h2>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  Plus secondary opportunities such as testimonials, referrals, case studies, and repeat or follow-on work these clients may bring.
                </p>
              </div>

              {/* Starter pack + email */}
              <p style={{ margin: 0, fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                I've created a{' '}
                <strong style={{ color: 'var(--color-accent-cyan)' }}>free</strong>
                {' '}training pack with a video and step-by-step tutorial that shows you how to set up this exact system. I use this every day with my clients to run 24/7 DM campaigns on LinkedIn, so that you can grow your business on autopilot.
              </p>
              <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                    <div>
                      <label className="form-label" htmlFor="name" style={{ fontSize: '0.8125rem' }}>Name <span style={{ color: 'var(--color-accent-cyan)' }}>*</span></label>
                      <input
                        id="name" type="text"
                        className="form-input"
                        placeholder="Jane Smith"
                        required
                        value={name}
                        onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                      />
                      {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>
                    <div>
                      <label className="form-label" htmlFor="email" style={{ fontSize: '0.8125rem' }}>Email <span style={{ color: 'var(--color-accent-cyan)' }}>*</span></label>
                      <input
                        id="email" type="email"
                        className="form-input"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                      />
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                  </div>
                  {errors.sent && <span style={{ fontSize: '0.8125rem', color: 'var(--color-accent-cyan)' }}>{errors.sent}</span>}
                  <button
                    type="button"
                    className="btn btn--pink"
                    style={{ width: '100%' }}
                    onClick={handleSend}
                  >
                    Send
                  </button>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                If you believe the training provides value, please leave a testimonial.
              </p>

            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="wizard-nav wizard-nav--dual">
        <button type="button" className="btn btn--ghost" onClick={handleBack}>
          ← Back
        </button>
        {(step === 1 || step === 2) && (
          <button type="button" className="btn btn--ghost btn--glow-white" onClick={handleNext}>
            {step === 2 ? 'Show Me How →' : 'Next →'}
          </button>
        )}
        {step === 3 && hasSent && hoursPerWeek <= 4 && (
          <button
            type="button"
            className="btn btn--ghost btn--glow"
            onClick={() => router.push(`/special-offer?total=${annualRevenue + arr}`)}
          >
            No Time for Training? →
          </button>
        )}
      </div>

    </div>
  )
}
