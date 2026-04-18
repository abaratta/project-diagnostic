'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

const CHECKLIST = [
  'Full revenue breakdown by channel',
  'Your top 3 highest-impact fixes',
  '30-day implementation roadmap',
]

export default function GatePage() {
  const router          = useRouter()
  const audit           = useFivePStore(s => s.audit)
  const captureEmail    = useFivePStore(s => s.captureEmail)
  const setAudit        = useFivePStore(s => s.setAudit)
  const isAuditComplete = useFivePStore(s => s.isAuditComplete)

  const [firstName,     setFirstName]     = useState(audit.business_name ?? '')
  const [email,         setEmail]         = useState(audit.email ?? '')
  const [errors,        setErrors]        = useState<{ firstName?: string; email?: string }>({})
  const [mounted,       setMounted]       = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)
  const [submitted,     setSubmitted]     = useState(false)
  const [countdown,     setCountdown]     = useState(5)
  const [captureError,  setCaptureError]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isAuditComplete()) router.replace('/')
  }, [mounted, isAuditComplete, router])

  useEffect(() => {
    if (!mounted) return
    const t = setTimeout(() => setProgressWidth(94), 400)
    return () => clearTimeout(t)
  }, [mounted])

  // Opportunity calculations
  const improvedRate      = Math.min(audit.current_conversion_rate + 1.5, 100)
  const additionalClients = audit.monthly_leads * (improvedRate - audit.current_conversion_rate) / 100
  const monthlyGain       = additionalClients * audit.revenue_per_client
  const autoSavings       = audit.monthly_leads * audit.time_per_lead * audit.hourly_cost * 0.5
  const totalMonthly      = monthlyGain + autoSavings
  const annualGain        = totalMonthly * 12

  // Monthly snapshot (mirrors the audit form viz)
  const revenueSnapshot   = Math.round(audit.monthly_leads * (audit.current_conversion_rate / 100) * audit.revenue_per_client)
  const timeCostSnapshot  = audit.hourly_cost > 0 ? Math.round(audit.time_per_lead * audit.monthly_leads * audit.hourly_cost) : 0
  const totalCostSnapshot = audit.ad_spend + timeCostSnapshot
  const netSnapshot       = revenueSnapshot - totalCostSnapshot
  const revPct            = revenueSnapshot > 0 ? 100 : 0
  const costPct           = revenueSnapshot > 0 && totalCostSnapshot > 0 ? Math.min(Math.round(totalCostSnapshot / revenueSnapshot * 100), 100) : 0
  const netPct            = revenueSnapshot > 0 && netSnapshot > 0 ? Math.min(Math.round(netSnapshot / revenueSnapshot * 100), 100) : 0

  const displayName = firstName.trim().split(' ')[0] || null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: { firstName?: string; email?: string } = {}
    if (!firstName.trim())              errs.firstName = 'Enter your first name'
    if (!email || !email.includes('@')) errs.email     = 'Enter a valid email address'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setAudit({ business_name: firstName.trim() })
    captureEmail(email)
    setSubmitted(true)
    setProgressWidth(100)

    // Compute revenue values for capture payload
    const CONV_LIFT_PP       = 1.5
    const improvedRateVal    = Math.min(audit.current_conversion_rate + CONV_LIFT_PP, 100)
    const currentRevenue     = audit.monthly_leads * (audit.current_conversion_rate / 100) * audit.revenue_per_client
    const improvedRevenue    = audit.monthly_leads * (improvedRateVal / 100) * audit.revenue_per_client
    const monthlyConvGain    = improvedRevenue - currentRevenue
    const lmCost             = audit.monthly_leads * audit.time_per_lead * audit.hourly_cost
    const autoSavingsCapture = lmCost * 0.5
    const totalMonthlyCapt   = monthlyConvGain + autoSavingsCapture
    const annualGainCapt     = totalMonthlyCapt * 12

    // Fire capture in parallel with countdown — do not block redirect
    fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: firstName.trim(),
        email,
        monthly_leads:           audit.monthly_leads,
        ad_spend:                audit.ad_spend,
        conversion_rate:         audit.current_conversion_rate,
        revenue_per_client:      audit.revenue_per_client,
        lead_source:             audit.lead_source,
        time_per_lead:           audit.time_per_lead,
        hourly_cost:             audit.hourly_cost,
        lead_source_count:       audit.lead_source_count,
        current_monthly_revenue:  currentRevenue,
        improved_monthly_revenue: improvedRevenue,
        monthly_conv_gain:        monthlyConvGain,
        lm_cost:                  lmCost,
        auto_savings:             autoSavingsCapture,
        total_monthly_benefit:    totalMonthlyCapt,
        annual_gain:              annualGainCapt,
      }),
    }).then(res => { if (!res.ok) setCaptureError(true) })
      .catch(() => setCaptureError(true))

    let remaining = 5
    const interval = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        router.push('/results')
      }
    }, 1000)
  }

  if (!mounted) return null

  return (
    <main>
      <div className="gate-wrapper">

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div className="hero__eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="gate-live-dot" />
            Audit complete
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(1.625rem, 4vw, 2.25rem)', marginBottom: '0.5rem' }}>
          {displayName
            ? <><span style={{ color: '#e6356b' }}>{displayName}</span>, your</>
            : 'Your'
          }{' '}revenue report is ready.
        </h1>
        <p className="gate-sub-headline">
          We've analysed your business and found a significant untapped opportunity. Unlock it below.
        </p>

        {/* Progress bar */}
        <div className="gate-progress">
          <div className="gate-progress-header">
            <span className="gate-progress-label">
              <span className="gate-live-dot" />
              Report generation
            </span>
            <span className="gate-progress-pct">{submitted ? '100% complete' : '94% complete'}</span>
          </div>
          <div className="gate-progress-track">
            <div className="gate-progress-fill" style={{ width: `${progressWidth}%` }} />
          </div>
        </div>

        {/* Main grid */}
        <div className="gate-card">

          {/* LEFT: monthly snapshot */}
          <div className="gate-left-panel">
            <div className="audit-viz-panel audit-viz-panel--active">
              <div className="audit-viz-eyebrow">Monthly snapshot</div>
              <div className="audit-hbar">
                <div className="audit-hbar__row">
                  <div className="audit-hbar__meta">
                    <span className="audit-hbar__label">Revenue</span>
                    <span className="audit-hbar__value audit-hbar__value--rev">
                      {revenueSnapshot > 0 ? `$${revenueSnapshot.toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div className="audit-hbar__track">
                    <div className="audit-hbar__fill audit-hbar__fill--rev" style={{ width: `${revPct}%` }} />
                  </div>
                </div>
                <div className="audit-viz-divider" />
                <div className="audit-hbar__row">
                  <div className="audit-hbar__meta">
                    <span className="audit-hbar__label">Costs</span>
                    <span className="audit-hbar__value audit-hbar__value--cost">
                      {totalCostSnapshot > 0 ? `−$${Math.round(totalCostSnapshot).toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div className="audit-hbar__track">
                    <div className="audit-hbar__fill audit-hbar__fill--cost" style={{ width: `${costPct}%` }} />
                  </div>
                </div>
                <div className="audit-viz-divider" />
                <div className="audit-hbar__row">
                  <div className="audit-hbar__meta">
                    <span className="audit-hbar__label">Net</span>
                    <span className="audit-hbar__value audit-hbar__value--net">
                      {netSnapshot > 0 ? `$${Math.round(netSnapshot).toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div className="audit-hbar__track">
                    <div className="audit-hbar__fill audit-hbar__fill--net" style={{ width: `${netPct}%` }} />
                  </div>
                </div>
                <div className="audit-viz-divider" />
                <div className="audit-hbar__row">
                  <div className="audit-hbar__meta">
                    <span className="audit-hbar__label">Lead sources</span>
                    <span className="audit-hbar__value" style={{ color: 'var(--color-text-muted)' }}>
                      {audit.lead_source_count === 5 ? '5+' : audit.lead_source_count}
                    </span>
                  </div>
                  <div className="audit-battery">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`audit-battery__seg audit-battery__seg--${i}${i <= audit.lead_source_count ? ' audit-battery__seg--filled' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
              {audit.lead_source && LEAD_SOURCE_ICONS[audit.lead_source as LeadSource] && (
                <div className="audit-source-badge">
                  <div className="audit-source-badge__icon">{LEAD_SOURCE_ICONS[audit.lead_source]}</div>
                  <span className="audit-source-badge__name">{LEAD_SOURCE_SHORT[audit.lead_source]}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: form or success */}
          {!submitted ? (
            <div className="gate-unlock">
              <div className="gate-loss-hook">
                You're leaving <span>${Math.round(annualGain).toLocaleString()}/year</span> on the table.
              </div>
              <p className="gate-loss-sub">
                Enter your details to unlock your full breakdown, gap analysis, and personalised action plan.
              </p>

              <div className="gate-checklist">
                {CHECKLIST.map(item => (
                  <div key={item} className="gate-check-item">
                    <div className="gate-check-icon">
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 5,9 10,3" stroke="#3dcab1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="gate-form-row">
                  <input
                    type="text"
                    className="gate-input"
                    placeholder="First name *"
                    value={firstName}
                    autoFocus
                    onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: undefined })) }}
                  />
                  <input
                    type="email"
                    className="gate-input"
                    placeholder="Work email *"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                  />
                </div>
                {(errors.firstName || errors.email) && (
                  <span className="form-error" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    {errors.firstName || errors.email}
                  </span>
                )}
                <button type="submit" className="gate-unlock-btn">
                  Send My Full Report
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>

              <div className="gate-microcopy">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                No spam. No credit card. Unsubscribe anytime.
              </div>

              <div className="gate-social-proof">
                <div className="gate-avatars">
                  <div className="gate-avatar gate-avatar--a">JR</div>
                  <div className="gate-avatar gate-avatar--b">SK</div>
                  <div className="gate-avatar gate-avatar--c">ML</div>
                  <div className="gate-avatar gate-avatar--d">+</div>
                </div>
                <div className="gate-proof-text">
                  <strong>100+ service businesses</strong> are already using RAPID to recover this revenue
                </div>
              </div>
            </div>
          ) : (
            <div className="gate-success">
              {captureError && (
                <div className="gate-capture-error">
                  Lead capture failed — check logs
                </div>
              )}
              <div className="gate-success__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3dcab1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="gate-success__title">Your report is on its way</div>
              <p className="gate-success__sub">
                Check your inbox — we've sent your full revenue breakdown and personalised 30-day action plan.
              </p>
              <p className="gate-success__countdown">
                Redirecting to your report in {countdown}…
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
