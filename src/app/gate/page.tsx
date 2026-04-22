'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
  const potentialCostSnapshot   = Math.max(0, totalCostSnapshot - Math.round(autoSavings))
  const potCostPct              = snapRef > 0 ? Math.min(Math.round(potentialCostSnapshot / snapRef * 100), 100) : 0

  if (!mounted) return null

  return (
    <main>
      <div className="gate-wrapper">

        <div className="rr-topnav">
          <Link href="/" className="wizard-home-btn" aria-label="Home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
        </div>

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div className="hero__eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="gate-live-dot" />
            Audit complete
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(1.625rem, 4vw, 2.25rem)', marginBottom: '0.5rem' }}>
          You're leaving <span style={{ color: '#3dcab1' }}>${Math.round(annualGain).toLocaleString()}/year</span> on the table.
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

        {/* Snapshot card — bidirectional bar chart, axis at 35% */}
        <div className="audit-viz-panel audit-viz-panel--active">
          <div className="audit-viz-eyebrow">Monthly snapshot</div>

          <div style={{ position: 'relative' }}>
            {/* Axis line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: '1px', background: 'rgba(243,246,250,0.1)', pointerEvents: 'none' }} />

            {/* REVENUE */}
            <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Revenue</div>

            {/* Current → right (grey) */}
            <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', alignItems: 'center', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(243,246,250,0.4)' }}>Current</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                <div style={{ height: '8px', width: `${currentRevPct * 0.55}%`, background: 'rgba(243,246,250,0.22)', borderRadius: '0 4px 4px 0', flexShrink: 0 }} />
                <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: 'rgba(243,246,250,0.45)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {revenueSnapshot > 0 ? `$${revenueSnapshot.toLocaleString()}/mo` : '—'}
                </span>
              </div>
            </div>

            {/* Potential → right (grey) */}
            <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', alignItems: 'center', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(243,246,250,0.4)' }}>Potential</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                <div style={{ height: '8px', width: '55%', background: 'rgba(243,246,250,0.22)', borderRadius: '0 4px 4px 0', flexShrink: 0 }} />
                <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: 'rgba(243,246,250,0.45)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {improvedRevenueSnapshot > 0 ? `$${improvedRevenueSnapshot.toLocaleString()}/mo` : '—'}
                </span>
              </div>
            </div>

            {/* Benefit → right (teal) */}
            {monthlyGain > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(243,246,250,0.4)' }}>Benefit</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                  <div style={{ height: '8px', width: `${Math.min(Math.round(monthlyGain / snapRef * 100) * 1.025, 88)}%`, background: '#3dcab1', borderRadius: '0 4px 4px 0', flexShrink: 0 }} />
                  <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: '#3dcab1', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    +${Math.round(monthlyGain).toLocaleString()}/mo
                  </span>
                </div>
              </div>
            )}

            <div className="audit-viz-divider" />

            {/* COSTS */}
            <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', margin: '0.75rem 0' }}>Costs</div>

            {/* Current cost ← left (grey) */}
            {totalCostSnapshot > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', alignItems: 'center', marginBottom: '0.55rem' }}>
                <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'flex-start', alignItems: 'center', paddingRight: '10px', gap: '8px' }}>
                  <div style={{ height: '8px', width: `${costBarPct * 0.55}%`, background: 'rgba(243,246,250,0.22)', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: 'rgba(243,246,250,0.45)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    −${totalCostSnapshot.toLocaleString()}/mo
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(243,246,250,0.4)' }}>Current</span>
                </div>
              </div>
            )}

            {/* Potential cost ← left (grey, shorter) */}
            {autoSavings > 0 && potentialCostSnapshot > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', alignItems: 'center', marginBottom: '0.55rem' }}>
                <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'flex-start', alignItems: 'center', paddingRight: '10px', gap: '8px' }}>
                  <div style={{ height: '8px', width: `${potCostPct * 0.55}%`, background: 'rgba(243,246,250,0.22)', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: 'rgba(243,246,250,0.45)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    −${potentialCostSnapshot.toLocaleString()}/mo
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(243,246,250,0.4)' }}>Potential</span>
                </div>
              </div>
            )}

            {/* Recoverable → right (teal) */}
            {autoSavings > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(243,246,250,0.4)' }}>Recoverable</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                  <div style={{ height: '8px', width: `${Math.min(savingsBarPct * 1.025, 88)}%`, background: '#3dcab1', borderRadius: '0 4px 4px 0', flexShrink: 0 }} />
                  <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: '#3dcab1', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    +${Math.round(autoSavings).toLocaleString()}/mo
                  </span>
                </div>
              </div>
            )}

            <div className="audit-viz-divider" />

            {/* Opportunity → right (teal, at scale) */}
            <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', alignItems: 'center', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'rgba(243,246,250,0.6)' }}>Opportunity</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                <div style={{ height: '8px', width: `${Math.min(Math.round(totalMonthly / snapRef * 100) * 1.025, 88)}%`, background: '#3dcab1', borderRadius: '0 4px 4px 0', flexShrink: 0 }} />
                <div style={{ marginLeft: '8px', flexShrink: 0 }}>
                  {totalMonthly > 0 ? (
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#3dcab1', whiteSpace: 'nowrap' }}>
                      {`+$${Math.round(totalMonthly).toLocaleString()}/mo `}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'rgba(243,246,250,0.5)' }}>
                        {`($${Math.round(annualGain).toLocaleString()}/year)`}
                      </span>
                    </span>
                  ) : '—'}
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
          <button className="btn btn--ghost btn--glow" onClick={() => router.push('/results')}>
            See My Full Report →
          </button>
        </div>

      </div>
    </main>
  )
}
