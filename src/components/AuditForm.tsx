'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFivePStore } from '@/store/useFivePStore'
import type { LeadSource } from '@/store/useFivePStore'

const LEAD_SOURCE_ICONS: Record<string, React.ReactElement> = {
  email: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m2 7 10 7 10-7"/>
    </svg>
  ),
  ads_meta: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  ads_google: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10"/>
      <path d="M12 12h6a6 6 0 1 1-1.76-4.24"/>
    </svg>
  ),
  referrals: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  website: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  dm: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  other: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
}

const LEAD_SOURCE_SHORT: Record<string, string> = {
  email:      'Email',
  ads_meta:   'Meta Ads',
  ads_google: 'Google Ads',
  referrals:  'Referrals',
  website:    'Organic',
  dm:         'LinkedIn DM',
  other:      'Other',
}

const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'email',      label: 'Email campaigns' },
  { value: 'ads_meta',   label: 'Facebook / Instagram Ads' },
  { value: 'ads_google', label: 'Google Ads' },
  { value: 'referrals',  label: 'Referrals' },
  { value: 'website',    label: 'Website / organic' },
  { value: 'dm',         label: 'DM campaigns (e.g. LinkedIn)' },
  { value: 'other',      label: 'Other' },
]

function formatMins(mins: number) {
  if (mins === 0) return '0 min'
  if (mins < 60)  return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

const TOTAL_STEPS = 3

// Vertical tick marker on a slider at a given percentage position
function Tick({ pct, label }: { pct: number; label: string }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: `calc(${pct / 100} * (100% - 22px) + 11px)`,
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      pointerEvents: 'none',
    }}>
      <div style={{ width: '1px', height: '5px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

export function AuditForm() {
  const router          = useRouter()
  const searchParams    = useSearchParams()
  const setAudit        = useFivePStore(s => s.setAudit)
  const savedAudit      = useFivePStore(s => s.audit)
  const isAuditComplete = useFivePStore(s => s.isAuditComplete)

  const initialStep = Number(searchParams.get('step')) || 1
  const [step, setStep] = useState(initialStep)

  // Step 1: Revenue — seed from store after mount to avoid SSR mismatch
  const [monthlyLeads,     setMonthlyLeads]     = useState('')
  const [revenuePerClient, setRevenuePerClient] = useState('')
  const [conversionRate,   setConversionRate]   = useState(5)

  // Step 2: Costs
  const [adSpend,         setAdSpend]         = useState('')
  const [timePerLeadMins, setTimePerLeadMins] = useState(30)
  const [hourlyCost,      setHourlyCost]      = useState('')

  // Step 3: About
  const [leadSource,      setLeadSource]      = useState<LeadSource | ''>('')
  const [businessName,    setBusinessName]    = useState('')
  const [leadSourceCount, setLeadSourceCount] = useState(1)

  // Hydrate fields from persisted store after mount
  useEffect(() => {
    if (savedAudit.monthly_leads     > 0) setMonthlyLeads(String(savedAudit.monthly_leads))
    if (savedAudit.revenue_per_client > 0) setRevenuePerClient(String(savedAudit.revenue_per_client))
    if (savedAudit.current_conversion_rate) setConversionRate(savedAudit.current_conversion_rate)
    if (savedAudit.ad_spend      > 0) setAdSpend(String(savedAudit.ad_spend))
    if (savedAudit.time_per_lead > 0) setTimePerLeadMins(Math.round(savedAudit.time_per_lead * 60))
    if (savedAudit.hourly_cost   > 0) setHourlyCost(String(savedAudit.hourly_cost))
    if (savedAudit.lead_source)       setLeadSource(savedAudit.lead_source)
    if (savedAudit.business_name)     setBusinessName(savedAudit.business_name)
    if (savedAudit.lead_source_count > 0) setLeadSourceCount(savedAudit.lead_source_count)
  }, [])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Live preview calculations (reactive to slider + input changes)
  const revenuePreview  = Number(monthlyLeads) > 0 && Number(revenuePerClient) > 0
    ? Math.round(Number(monthlyLeads) * (conversionRate / 100) * Number(revenuePerClient))
    : 0
  const adSpendPreview  = adSpend !== '' ? Number(adSpend) : 0
  const derivedCpl      = adSpendPreview > 0 && Number(monthlyLeads) > 0
    ? adSpendPreview / Number(monthlyLeads)
    : null
  const timeCostPreview = Number(hourlyCost) > 0 && Number(monthlyLeads) > 0
    ? Math.round((timePerLeadMins / 60) * Number(monthlyLeads) * Number(hourlyCost))
    : 0
  const totalCostPreview = adSpendPreview + timeCostPreview

  // Horizontal bar chart — revenue is the 100% reference.
  // Costs and net animate proportionally as values are entered.
  const netProfit = revenuePreview - totalCostPreview
  const revPct    = revenuePreview > 0 ? 100 : 0
  const costPct   = revenuePreview > 0 && totalCostPreview > 0
    ? Math.min(Math.round(totalCostPreview / revenuePreview * 100), 100) : 0
  const netPct    = revenuePreview > 0 && netProfit > 0
    ? Math.min(Math.round(netProfit / revenuePreview * 100), 100) : 0

  function validate() {
    const errs: Record<string, string> = {}
    if (step === 1) {
      if (!monthlyLeads || Number(monthlyLeads) < 1)        errs.monthlyLeads     = 'Enter at least 1 lead per month'
      if (!revenuePerClient || Number(revenuePerClient) < 1) errs.revenuePerClient = 'Enter your revenue per client'
    }
    if (step === 2) {
      if (adSpend === '')          errs.adSpend = 'Enter your monthly ad spend (0 if organic)'
      if (Number(adSpend) < 0)     errs.adSpend = 'Cannot be negative'
    }
    if (step === 3) {
      if (!leadSource) errs.leadSource = 'Select your primary lead source'
    }
    return errs
  }

  function handleNext() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    } else {
      setAudit({
        business_name:           businessName || null,
        monthly_leads:           Number(monthlyLeads),
        ad_spend:                Number(adSpend) || 0,
        current_conversion_rate: conversionRate,
        revenue_per_client:      Number(revenuePerClient),
        lead_source:             leadSource as LeadSource,
        time_per_lead:           timePerLeadMins / 60,
        hourly_cost:             Number(hourlyCost) || 0,
        lead_source_count:       leadSourceCount,
      })
      router.push('/gate')
    }
  }

  function handleBack() {
    setErrors({})
    if (step === 1) { router.push('/'); return }
    setStep(s => s - 1)
  }

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

      {/* Step 1 — Revenue */}
      {step === 1 && (
        <div className="audit-step-layout">

          {/* LEFT: form fields */}
          <div className="audit-step-fields">
            <div className="stack stack--lg">
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>Your revenue numbers</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                  Tell us about your current lead flow — we'll calculate your opportunity.
                </p>
              </div>

              <div className="stack stack--lg">
                <div className="form-group--sm">
                  <label className="form-label" htmlFor="monthlyLeads">1. How many leads do you generate per month (on average)?</label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    If you have multiple lead sources, add them all up
                  </span>
                  <input
                    id="monthlyLeads" type="number" min="1"
                    className="form-input"
                    placeholder="e.g. 30"
                    value={monthlyLeads}
                    onChange={e => { setMonthlyLeads(e.target.value); setErrors(p => ({ ...p, monthlyLeads: '' })) }}
                  />
                  {errors.monthlyLeads && <span className="form-error">{errors.monthlyLeads}</span>}
                </div>

                <div className="form-group--sm">
                  <label className="form-label">
                    2. Current conversion rate (% of leads that become clients) —{' '}
                    <strong style={{ color: 'var(--color-accent-cyan)' }}>{conversionRate}%</strong>
                  </label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Slide the bar to select the value (if unknown use average - 5%)
                  </span>
                  <div style={{ position: 'relative', paddingBottom: '1.5rem' }}>
                    <input
                      type="range" min="0" max="100"
                      className="slider-input slider-input--layered"
                      value={conversionRate}
                      onChange={e => setConversionRate(Number(e.target.value))}
                    />
                    <div className="conv-track-layers" aria-hidden="true">
                      <div className="conv-track-base" />
                      <div className="conv-track-avg-range" />
                    </div>
                    <Tick pct={0}   label="0%" />
                    <Tick pct={50}  label="50%" />
                    <Tick pct={100} label="100%" />
                    <div style={{
                      position: 'absolute', bottom: 0,
                      left: `calc(5 / 100 * (100% - 34px) + 17px)`,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px',
                      pointerEvents: 'none',
                    }} aria-hidden="true">
                      <div style={{ width: '2px', height: '5px', background: 'var(--color-accent-amber)', borderRadius: '1px' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent-amber)', whiteSpace: 'nowrap' }}>Avg.</span>
                    </div>
                  </div>
                </div>

                <div className="form-group--sm">
                  <label className="form-label" htmlFor="revenuePerClient">3. Average revenue per client ($)</label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    What a typical client pays you for your product or service (lifetime value)
                  </span>
                  <input
                    id="revenuePerClient" type="number" min="1"
                    className="form-input"
                    placeholder="e.g. 2,500"
                    value={revenuePerClient}
                    onChange={e => { setRevenuePerClient(e.target.value); setErrors(p => ({ ...p, revenuePerClient: '' })) }}
                  />
                  {errors.revenuePerClient && <span className="form-error">{errors.revenuePerClient}</span>}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Step 2 — Costs */}
      {step === 2 && (
        <div className="audit-step-layout">

          {/* LEFT: form fields */}
          <div className="audit-step-fields">
            <div className="stack stack--lg">
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>Your costs</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                  Helps us calculate the true cost of your current lead management.
                </p>
              </div>

              <div className="stack stack--lg">
                <div className="form-group--sm">
                  <label className="form-label" htmlFor="adSpend">1. Monthly ad spend ($)</label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Enter the ad cost and the agency costs (if outsourced)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <input
                      id="adSpend" type="number" min="0"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="e.g. 1,000"
                      value={adSpend}
                      onChange={e => { setAdSpend(e.target.value); setErrors(p => ({ ...p, adSpend: '' })) }}
                    />
                    {derivedCpl !== null && (
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-accent-cyan)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        = ${derivedCpl < 10 ? derivedCpl.toFixed(2) : Math.round(derivedCpl).toLocaleString()} / lead
                      </span>
                    )}
                  </div>
                  {errors.adSpend && <span className="form-error">{errors.adSpend}</span>}
                </div>

                <div className="form-group--sm">
                  <label className="form-label">
                    2. Time to qualify + follow up each lead —{' '}
                    <strong style={{ color: 'var(--color-accent-cyan)' }}>{formatMins(timePerLeadMins)}</strong>
                  </label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Slide the bar to select the average time you spend (if unknown leave 30 min)
                  </span>
                  <div style={{ position: 'relative', paddingBottom: '1.5rem' }}>
                    <input
                      type="range" min="0" max="240" step="15"
                      className="slider-input slider-input--layered"
                      value={timePerLeadMins}
                      onChange={e => setTimePerLeadMins(Number(e.target.value))}
                    />
                    <div className="conv-track-layers" aria-hidden="true">
                      <div className="conv-track-base" />
                      <div className="time-track-avg-mark" />
                    </div>
                    <Tick pct={0}   label="0 min" />
                    <Tick pct={50}  label="2 h" />
                    <Tick pct={100} label="4 h" />
                    <div style={{
                      position: 'absolute', bottom: 0,
                      left: `calc(9.375 / 100 * (100% - 34px) + 17px)`,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px',
                      pointerEvents: 'none',
                    }} aria-hidden="true">
                      <div style={{ width: '2px', height: '5px', background: 'var(--color-accent-amber)', borderRadius: '1px' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent-amber)', whiteSpace: 'nowrap' }}>Avg.</span>
                    </div>
                  </div>
                </div>

                <div className="form-group--sm">
                  <label className="form-label" htmlFor="hourlyCost">
                    3. Average hourly cost for the business ($){' '}
                    <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                    Enter the hourly rate of the person managing leads (or average value if multiple)
                  </span>
                  <input
                    id="hourlyCost" type="number" min="0"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={hourlyCost}
                    onChange={e => setHourlyCost(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Step 3 — About you */}
      {step === 3 && (() => {
        return (
          <div className="audit-step-layout">

            {/* LEFT: form fields */}
            <div className="audit-step-fields">
              <div className="stack stack--lg">
                <div>
                  <h2 style={{ marginBottom: '0.25rem' }}>Almost there</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: 0 }}>
                    One last detail to personalise your report.
                  </p>
                </div>

                <div className="stack stack--lg">
                  <div className="form-group--sm">
                    <label className="form-label" htmlFor="leadSource">1. Where do most of your leads come from?</label>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                      Select your main lead generation source
                    </span>
                    <select
                      id="leadSource"
                      className="form-select"
                      value={leadSource}
                      onChange={e => { setLeadSource(e.target.value as LeadSource); setErrors(p => ({ ...p, leadSource: '' })) }}
                    >
                      <option value="">Select a source…</option>
                      {LEAD_SOURCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.leadSource && <span className="form-error">{errors.leadSource}</span>}
                  </div>

                  <div className="form-group--sm">
                    <label className="form-label">2. How many lead sources do you actively use?</label>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                      Select the number of lead sources
                    </span>
                    <div className="lead-count-pills">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={`lead-count-pill${leadSourceCount === n ? ' lead-count-pill--active' : ''}`}
                          onClick={() => setLeadSourceCount(n)}
                        >
                          {n === 5 ? '5+' : n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group--sm">
                    <label className="form-label" htmlFor="businessName">
                      3. Your email{' '}
                      <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: 'block' }}>
                      Add your details to get the report by email + access to advanced tools
                    </span>
                    <input
                      id="businessName" type="email"
                      className="form-input"
                      placeholder="e.g. name@company.com"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )
      })()}

      {/* Navigation */}
      <div className="wizard-nav wizard-nav--dual">
        <button type="button" className="btn btn--ghost" onClick={handleBack}>
          ← Back
        </button>

        <button type="button" className="btn btn--ghost" onClick={handleNext}>
          Next →
        </button>
      </div>

    </div>
  )
}
