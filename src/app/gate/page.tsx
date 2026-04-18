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

export default function GatePage() {
  const router          = useRouter()
  const audit           = useFivePStore(s => s.audit)
  const isAuditComplete = useFivePStore(s => s.isAuditComplete)

  const [mounted,       setMounted]       = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isAuditComplete()) router.replace('/')
  }, [mounted, isAuditComplete, router])

  useEffect(() => {
    if (!mounted) return
    const t = setTimeout(() => setProgressWidth(100), 400)
    return () => clearTimeout(t)
  }, [mounted])

  // Opportunity calculations
  const improvedRate      = Math.min(audit.current_conversion_rate + 1.5, 100)
  const additionalClients = audit.monthly_leads * (improvedRate - audit.current_conversion_rate) / 100
  const monthlyGain       = additionalClients * audit.revenue_per_client
  const autoSavings       = audit.monthly_leads * audit.time_per_lead * audit.hourly_cost * 0.5
  const totalMonthly      = monthlyGain + autoSavings
  const annualGain        = totalMonthly * 12

  // Monthly snapshot
  const revenueSnapshot         = Math.round(audit.monthly_leads * (audit.current_conversion_rate / 100) * audit.revenue_per_client)
  const improvedRevenueSnapshot = Math.round(audit.monthly_leads * (improvedRate / 100) * audit.revenue_per_client)
  const timeCostSnapshot        = audit.hourly_cost > 0 ? Math.round(audit.time_per_lead * audit.monthly_leads * audit.hourly_cost) : 0
  const totalCostSnapshot       = audit.ad_spend + timeCostSnapshot
  const snapRef                 = improvedRevenueSnapshot > 0 ? improvedRevenueSnapshot : 1
  const currentRevPct           = Math.min(Math.round(revenueSnapshot / snapRef * 100), 100)
  const costBarPct              = Math.min(Math.round(totalCostSnapshot / snapRef * 100), 100)
  const savingsBarPct           = autoSavings > 0 ? Math.min(Math.round(autoSavings / snapRef * 100), 100) : 0

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
          You're leaving <span style={{ color: '#e6356b' }}>${Math.round(annualGain).toLocaleString()}/year</span> on the table.
        </h1>
        <p className="gate-sub-headline">
          We've analysed your business and found a significant untapped opportunity. Review full report below.
        </p>

        {/* Progress bar */}
        <div className="gate-progress">
          <div className="gate-progress-header">
            <span className="gate-progress-label">
              <span className="gate-live-dot" />
              Report generation
            </span>
            <span className="gate-progress-pct">100% complete</span>
          </div>
          <div className="gate-progress-track">
            <div className="gate-progress-fill" style={{ width: `${progressWidth}%` }} />
          </div>
        </div>

        {/* Snapshot card */}
        <div className="audit-viz-panel audit-viz-panel--active">
          <div className="audit-viz-eyebrow">Monthly snapshot</div>

          {/* Revenue */}
          <div className="snapshot-section">
            <div className="snapshot-section-label">Revenue</div>
            <div className="audit-hbar">
              <div className="audit-hbar__row">
                <div className="audit-hbar__meta">
                  <span className="audit-hbar__label">Current</span>
                  <span className="audit-hbar__value" style={{ color: 'rgba(243,246,250,0.45)' }}>
                    {revenueSnapshot > 0 ? `$${revenueSnapshot.toLocaleString()}/mo` : '—'}
                  </span>
                </div>
                <div className="audit-hbar__track">
                  <div className="audit-hbar__fill" style={{ width: `${currentRevPct}%`, background: 'rgba(243,246,250,0.2)' }} />
                </div>
              </div>
              <div className="audit-hbar__row">
                <div className="audit-hbar__meta">
                  <span className="audit-hbar__label">Potential</span>
                  <span className="audit-hbar__value" style={{ color: '#f3f6fa' }}>
                    {improvedRevenueSnapshot > 0 ? `$${improvedRevenueSnapshot.toLocaleString()}/mo` : '—'}
                  </span>
                </div>
                <div className="audit-hbar__track">
                  <div className="audit-hbar__fill" style={{ width: '100%', background: 'rgba(243,246,250,0.65)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="audit-viz-divider" />

          {/* Costs */}
          <div className="snapshot-section">
            <div className="snapshot-section-label">Costs</div>
            <div className="audit-hbar">
              <div className="audit-hbar__row">
                <div className="audit-hbar__meta">
                  <span className="audit-hbar__label">Current</span>
                  <span className="audit-hbar__value" style={{ color: 'rgba(243,246,250,0.45)' }}>
                    {totalCostSnapshot > 0 ? `−$${totalCostSnapshot.toLocaleString()}/mo` : '—'}
                  </span>
                </div>
                <div className="audit-hbar__track">
                  <div className="audit-hbar__fill" style={{ width: `${costBarPct}%`, background: 'rgba(243,246,250,0.2)' }} />
                </div>
              </div>
              <div className="audit-hbar__row">
                <div className="audit-hbar__meta">
                  <span className="audit-hbar__label">Recoverable</span>
                  <span className="audit-hbar__value" style={{ color: '#f3f6fa' }}>
                    {autoSavings > 0 ? `+$${Math.round(autoSavings).toLocaleString()}/mo` : '—'}
                  </span>
                </div>
                <div className="audit-hbar__track">
                  <div className="audit-hbar__fill" style={{ width: `${savingsBarPct}%`, background: 'rgba(243,246,250,0.65)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="audit-viz-divider" />

          {/* Monthly benefit */}
          <div className="snapshot-section">
            <div className="snapshot-section-label" style={{ color: 'var(--color-text)', fontSize: '0.8125rem' }}>Monthly benefit with lead to revenue system</div>
            <div className="audit-hbar">
              <div className="audit-hbar__row">
                <div className="audit-hbar__meta">
                  <span className="audit-hbar__label">Opportunity</span>
                  <span className="audit-hbar__value" style={{ color: '#f3f6fa', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                    {totalMonthly > 0 ? (
                      <>
                        <span>{`+$${Math.round(totalMonthly).toLocaleString()}/mo`}</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(243,246,250,0.5)' }}>{`$${Math.round(annualGain).toLocaleString()}/year`}</span>
                      </>
                    ) : '—'}
                  </span>
                </div>
                <div className="audit-hbar__track">
                  <div className="audit-hbar__fill" style={{ width: '100%', background: 'rgba(243,246,250,0.65)' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', gap: '1rem' }}>
          <button className="btn btn--ghost" onClick={() => router.push('/?step=3')}>
            ← Back
          </button>
          <button className="btn btn--ghost" onClick={() => router.push('/results')}>
            See My Full Report →
          </button>
        </div>

      </div>
    </main>
  )
}
