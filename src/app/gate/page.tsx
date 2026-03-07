'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFivePStore } from '@/store/useFivePStore'

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

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isAuditComplete()) router.replace('/')
  }, [mounted, isAuditComplete, router])

  useEffect(() => {
    if (!mounted) return
    const t = setTimeout(() => setProgressWidth(94), 400)
    return () => clearTimeout(t)
  }, [mounted])

  // Calculations
  const improvedRate      = Math.min(audit.current_conversion_rate + 1.5, 100)
  const additionalClients = audit.monthly_leads * (improvedRate - audit.current_conversion_rate) / 100
  const monthlyGain       = additionalClients * audit.revenue_per_client
  const autoSavings       = audit.monthly_leads * audit.time_per_lead * audit.hourly_cost * 0.5
  const totalMonthly      = monthlyGain + autoSavings
  const annualGain        = totalMonthly * 12

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

          {/* LEFT: stats + line items */}
          <div className="gate-left-panel">
            <div className="gate-stat-box gate-stat-box--cyan">
              <div className="gate-stat-label">Monthly Revenue Opportunity</div>
              <div className="gate-stat-value">${Math.round(totalMonthly).toLocaleString()}</div>
              <div className="gate-stat-delta">↑ vs. current baseline</div>
            </div>
            <div className="gate-stat-box gate-stat-box--pink">
              <div className="gate-stat-label">Annual Opportunity</div>
              <div className="gate-stat-value">${Math.round(annualGain).toLocaleString()}</div>
              <div className="gate-stat-delta gate-stat-delta--pink">Currently left on the table</div>
            </div>
            <div className="gate-line-items">
              <div className="gate-line-item">
                <span className="gate-line-label">Lead conversion uplift</span>
                <span className="gate-line-value">+1.5pp</span>
              </div>
              <div className="gate-line-item">
                <span className="gate-line-label">Additional clients / month</span>
                <span className="gate-line-value gate-line-value--blur">+{additionalClients.toFixed(1)}</span>
              </div>
              <div className="gate-line-item">
                <span className="gate-line-label">Monthly revenue gain</span>
                <span className="gate-line-value gate-line-value--blur">+${Math.round(monthlyGain).toLocaleString()}</span>
              </div>
              {autoSavings > 0 && (
                <div className="gate-line-item">
                  <span className="gate-line-label">Time cost savings</span>
                  <span className="gate-line-value gate-line-value--blur">${Math.round(autoSavings).toLocaleString()}/mo</span>
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
