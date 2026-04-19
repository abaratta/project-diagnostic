'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const LEAD_GEN_OPTIONS = [
  { value: 'linkedin_dm',       label: 'LinkedIn DM' },
  { value: 'cold_email',        label: 'Cold Email' },
  { value: 'linkedin_ads',      label: 'LinkedIn Ads' },
  { value: 'meta_ads',          label: 'Meta Ads' },
  { value: 'google_ads',        label: 'Google Ads' },
  { value: 'seo_geo',           label: 'SEO / GEO' },
  { value: 'content_marketing', label: 'Content Marketing' },
  { value: 'email_marketing',   label: 'Email Marketing' },
  { value: 'online_webinar',    label: 'Online Webinar' },
]

const ADS_OPTIONS      = ['linkedin_ads', 'meta_ads', 'google_ads']
const LOW_COST_OPTIONS = ['linkedin_dm', 'cold_email', 'seo_geo']

function getUnlocked(value: string, budget: number, hours: number): boolean {
  if (ADS_OPTIONS.includes(value))      return budget >= 1500
  if (LOW_COST_OPTIONS.includes(value)) return budget >= 200 || hours >= 4
  if (value === 'online_webinar')       return hours >= 4 || budget >= 200
  if (value === 'email_marketing')      return hours >= 4 || budget >= 500
  if (value === 'content_marketing')    return hours >= 4 || budget >= 1500
  return true
}

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
  const [budget,        setBudget]        = useState(500)
  const [hoursPerWeek,  setHoursPerWeek]  = useState(5)
  const [leadGenOption, setLeadGenOption] = useState('linkedin_dm')
  const [errors,        setErrors]        = useState<Record<string, string>>({})

  useEffect(() => {
    if (leadGenOption && !getUnlocked(leadGenOption, budget, hoursPerWeek)) {
      setLeadGenOption('')
    }
  }, [budget, hoursPerWeek])

  // Step 2 — LinkedIn DM simulation
  const [invites,        setInvites]        = useState('1000')
  const [connectionRate, setConnectionRate] = useState('40')
  const [interestedRate, setInterestedRate] = useState('8')
  const [conversionRate, setConversionRate] = useState('3')
  const [clv,            setClv]            = useState('')
  const [mrr,            setMrr]            = useState('')

  // Step 3
  const [email, setEmail] = useState('')

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
  // ARR: recurring model — each month adds one more MRR cohort
  // Year total = MRR × (1+2+...+12) = MRR × 78
  const arr = mrr ? Math.round(Number(mrr) * 78) : 0

  function validate() {
    const errs: Record<string, string> = {}
    if (step === 1 && !leadGenOption) errs.leadGenOption = 'Select a preferred lead generation option'
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
    if (!email.trim()) {
      setErrors(p => ({ ...p, email: 'Enter your email to receive the pack' }))
      return
    }
    fetch('https://hook.eu2.make.com/4vw7wjkasej6wwbbm838r53k51q7oy1k', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:          email.trim(),
        budget:         budget,
        time:           hoursPerWeek,
        lead_gen_option: leadGenOption,
        clv:            clv,
        mrr:            mrr,
      }),
    }).catch(() => {})
    setErrors(p => ({ ...p, email: '', sent: 'Pack on its way — check your inbox!' }))
  }

  const isLinkedInDM      = leadGenOption === 'linkedin_dm'
  const selectedLabel     = LEAD_GEN_OPTIONS.find(o => o.value === leadGenOption)?.label ?? ''

  return (
    <div className="audit-wizard">

      {/* Progress dots */}
      <div className="wizard-progress">
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
                <h2 style={{ marginBottom: '0.25rem' }}>Your lead generation setup</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                  Tell us about your resources so we can model the best strategy for you.
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
                  <label className="form-label">3. Select the preferred lead generation option</label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Options unlock based on your available budget and time
                  </span>
                  <div className="lead-option-grid">
                    {LEAD_GEN_OPTIONS.map(opt => {
                      const unlocked = getUnlocked(opt.value, budget, hoursPerWeek)
                      const active   = leadGenOption === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={!unlocked}
                          className={[
                            'lead-option-pill',
                            active    ? 'lead-option-pill--active' : '',
                            !unlocked ? 'lead-option-pill--locked' : '',
                          ].join(' ')}
                          onClick={() => { setLeadGenOption(opt.value); setErrors(p => ({ ...p, leadGenOption: '' })) }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.leadGenOption && <span className="form-error">{errors.leadGenOption}</span>}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2 — Under construction ── */}
      {step === 2 && !isLinkedInDM && (
        <div className="audit-step-layout">
          <div className="audit-step-fields">
            <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.25rem' }}>
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h2 style={{ marginBottom: '0.5rem' }}>{selectedLabel}</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', maxWidth: '28rem', margin: '0 auto' }}>
                This simulation is under construction. Check back soon — we're building it out now.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2 — LinkedIn DM simulation ── */}
      {step === 2 && isLinkedInDM && (
        <div className="audit-step-layout">
          <div className="audit-step-fields">
            <div className="stack stack--lg">
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>LinkedIn DM Simulation</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                  Adjust the funnel variables to model your expected performance.
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
                    <label className="form-label">Connection accepted</label>
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
                    <label className="form-label">Leads interested</label>
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
                    <label className="form-label">Conversion rate</label>
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

                {/* CLV + MRR side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                  <div className="form-group--sm">
                    <label className="form-label" htmlFor="clv">CLV ($)</label>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                      The average client's lifetime value
                    </span>
                    <input
                      id="clv" type="number" min="0"
                      className="form-input"
                      placeholder="e.g. 3,000"
                      value={clv}
                      onChange={e => { setClv(e.target.value); setErrors(p => ({ ...p, clv: '' })) }}
                    />
                    {errors.clv && <span className="form-error">{errors.clv}</span>}
                  </div>

                  <div className="form-group--sm">
                    <label className="form-label" htmlFor="mrr">MRR ($)</label>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                      The monthly recurring revenue per client
                    </span>
                    <input
                      id="mrr" type="number" min="0"
                      className="form-input"
                      placeholder="e.g. 500"
                      value={mrr}
                      onChange={e => { setMrr(e.target.value); setErrors(p => ({ ...p, clv: '' })) }}
                    />
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
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-dim)', marginTop: '0.375rem' }}>
                      CLV × {fmt(convertedCount)} clients/mo × 12
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
                      MRR × 78 (12-month compounding)
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
              <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid var(--color-accent-cyan)',
                borderRadius: 'var(--radius-card)',
                padding: '1.375rem 1.25rem',
              }}>
                <p style={{ margin: 0, fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                  You could generate an additional{' '}
                  <strong style={{ color: 'var(--color-accent-cyan)', fontSize: '1.2em' }}>
                    {annualRevenue + arr > 0 ? fmtMoney(annualRevenue + arr) : '—'}
                  </strong>{' '}
                  per year. Also account for secondary opportunities such as testimonials, referrals, case studies, and repeat or follow-on work these clients may bring.
                </p>
              </div>

              {/* Starter pack + email */}
              <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '1.375rem 1.25rem',
              }}>
                <p style={{ margin: '0 0 1.25rem', fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                  I've created a starter pack that shows you how to set up a system that runs DM campaigns 24/7 on LinkedIn, so that you can get clients on autopilot. Where should I send it?
                </p>
                <div className="form-group--sm">
                  <label className="form-label" htmlFor="email">Your email</label>
                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <input
                      id="email" type="email"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="e.g. name@company.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                    />
                    <button
                      type="button"
                      className="btn btn--pink btn--sm"
                      style={{ flexShrink: 0, width: '35%' }}
                      onClick={handleSend}
                    >
                      Send
                    </button>
                  </div>
                  {errors.email && <span className="form-error">{errors.email}</span>}
                  {errors.sent  && <span style={{ fontSize: '0.8125rem', color: 'var(--color-accent-cyan)', display: 'block', marginTop: '0.375rem' }}>{errors.sent}</span>}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="wizard-nav wizard-nav--dual">
        <button type="button" className="btn btn--ghost" onClick={handleBack}>
          ← Back
        </button>
        {(step === 1 || (step === 2 && isLinkedInDM)) && (
          <button type="button" className="btn btn--ghost" onClick={handleNext}>
            Next →
          </button>
        )}
      </div>

    </div>
  )
}
