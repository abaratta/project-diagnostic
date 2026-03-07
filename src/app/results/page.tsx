'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFivePStore } from '@/store/useFivePStore'
import { BookCallButton } from '@/components/BookCallButton'

function FixTooltip({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <span className="rr-fix-tooltip-wrap">
      <button className="rr-fix-info-btn" type="button"
        onClick={() => setOpen(true)} aria-label="More info">i</button>
      {open && (
        <div className="calc-overlay" onClick={() => setOpen(false)}>
          <div className="calc-overlay__panel" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="calc-overlay__header">
              <h3 className="calc-overlay__title">{title}</h3>
              <button type="button" className="calc-overlay__close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>
              {text}
            </p>
          </div>
        </div>
      )}
    </span>
  )
}

const CONV_LIFT_PP = 1.5
const AUTO_PCT     = 0.50

export default function ResultsPage() {
  const router          = useRouter()
  const audit           = useFivePStore(s => s.audit)
  const isAuditComplete = useFivePStore(s => s.isAuditComplete)
  const isGateComplete  = useFivePStore(s => s.isGateComplete)
  const [showCalc, setShowCalc] = useState(false)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuditComplete()) { router.replace('/');     return }
    if (!isGateComplete())  { router.replace('/gate'); return }
  }, [mounted, isAuditComplete, isGateComplete, router])

  if (!mounted) return null

  // Calculations
  const improvedRate    = Math.min(audit.current_conversion_rate + CONV_LIFT_PP, 100)
  const currentRevenue  = audit.monthly_leads * (audit.current_conversion_rate / 100) * audit.revenue_per_client
  const improvedRevenue = audit.monthly_leads * (improvedRate / 100) * audit.revenue_per_client
  const monthlyConvGain = improvedRevenue - currentRevenue
  const lmCost          = audit.monthly_leads * audit.time_per_lead * audit.hourly_cost
  const autoSavings     = lmCost * AUTO_PCT
  const totalMonthly    = monthlyConvGain + autoSavings
  const annualGain      = totalMonthly * 12
  const currentClients  = audit.monthly_leads * (audit.current_conversion_rate / 100)
  const improvedClients = audit.monthly_leads * (improvedRate / 100)

  const name       = audit.business_name ? audit.business_name.split(' ')[0] : null
  const fix1Annual = Math.round(monthlyConvGain * 12)
  const fix2Annual = Math.round(autoSavings * 12)

  return (
    <>
      <div className="rr-shell">

        {/* Header */}
        <div className="rr-header">
          <div className="rr-eyebrow">
            <span className="rr-dot" />
            Your Revenue Report
          </div>
          <h1 className="rr-headline">
            {name ? <>{name}, you're leaving </> : "You're leaving "}
            <span className="rr-loss">${Math.round(annualGain).toLocaleString()}/yr</span>
            {' '}on the table.
          </h1>
          <p className="rr-sub">
            That's <strong>${Math.round(totalMonthly).toLocaleString()} every month</strong> in lost revenue. Here's what's causing it — and how to fix it in 30 days.
          </p>
        </div>

        {/* Body grid */}
        <div className="rr-body-grid">

          {/* LEFT */}
          <div className="rr-left">

            {/* Top 3 fixes */}
            <div className="rr-panel">
              <div className="rr-panel-label">Your top 3 highest-impact fixes</div>
              <div className="rr-fixes">

                <div className="rr-fix-card">
                  <div className="rr-fix-rank rr-fix-rank--1">#1</div>
                  <div className="rr-fix-body">
                    <div className="rr-fix-title">
                      Fix lead follow-up speed
                      <FixTooltip title="Fix lead follow-up speed" text="Responding within 5 min vs 30 min increases conversion up to 21×. Your leads are going cold." />
                    </div>
                  </div>
                  <div className="rr-fix-val">
                    +${fix1Annual.toLocaleString()}
                    <small>/yr</small>
                  </div>
                </div>

                <div className="rr-fix-card">
                  <div className="rr-fix-rank rr-fix-rank--2">#2</div>
                  <div className="rr-fix-body">
                    <div className="rr-fix-title">
                      Automate lead qualification
                      <FixTooltip title="Automate lead qualification" text={lmCost > 0
                        ? `You spend ~$${Math.round(lmCost).toLocaleString()}/mo manually triaging enquiries. Automation cuts this by 50%.`
                        : 'Automated qualification removes bottlenecks and responds instantly — 24/7 without added headcount.'} />
                    </div>
                  </div>
                  {fix2Annual > 0 ? (
                    <div className="rr-fix-val">+${fix2Annual.toLocaleString()}<small>/yr</small></div>
                  ) : (
                    <div className="rr-fix-val rr-fix-val--soft">High<small>impact</small></div>
                  )}
                </div>

                <div className="rr-fix-card">
                  <div className="rr-fix-rank rr-fix-rank--3">#3</div>
                  <div className="rr-fix-body">
                    <div className="rr-fix-title">
                      Add a structured nurture sequence
                      <FixTooltip title="Add a structured nurture sequence" text="Leads need 5–8 touches before converting. Without one, they quietly go to your competitors." />
                    </div>
                  </div>
                  <div className="rr-fix-val rr-fix-val--soft">High<small>impact</small></div>
                </div>

              </div>
            </div>

            {/* Compare table */}
            <div className="rr-panel">
              <div className="rr-table-hdr">
                <div className="rr-panel-label">Full breakdown</div>
                <button type="button" className="rr-info-btn" onClick={() => setShowCalc(true)}>
                  <span className="rr-info-icon">i</span>
                  How we calculated this
                </button>
              </div>
              <table className="rr-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Today</th>
                    <th>With RAPID</th>
                    <th className="rr-th-gain">Gain</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Conversion rate</td>
                    <td>{audit.current_conversion_rate.toFixed(1)}%</td>
                    <td className="rr-td-rapid">{improvedRate.toFixed(1)}%</td>
                    <td className="rr-td-gain">+{CONV_LIFT_PP}pp</td>
                  </tr>
                  <tr>
                    <td>Clients / month</td>
                    <td>{currentClients.toFixed(1)}</td>
                    <td className="rr-td-rapid">{improvedClients.toFixed(1)}</td>
                    <td className="rr-td-gain">+{(improvedClients - currentClients).toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td>Monthly revenue</td>
                    <td>${Math.round(currentRevenue).toLocaleString()}</td>
                    <td className="rr-td-rapid">${Math.round(improvedRevenue).toLocaleString()}</td>
                    <td className="rr-td-gain">+${Math.round(monthlyConvGain).toLocaleString()}</td>
                  </tr>
                  {lmCost > 0 && (
                    <tr>
                      <td>Time cost / month</td>
                      <td>${Math.round(lmCost).toLocaleString()}</td>
                      <td className="rr-td-rapid">${Math.round(lmCost - autoSavings).toLocaleString()}</td>
                      <td className="rr-td-save">−${Math.round(autoSavings).toLocaleString()}</td>
                    </tr>
                  )}
                  <tr>
                    <td><strong>Total monthly benefit</strong></td>
                    <td>—</td>
                    <td>—</td>
                    <td className="rr-td-total">${Math.round(totalMonthly).toLocaleString()}/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT: CTA panel */}
          <div className="rr-cta-panel">

            <div className="rr-cta-eyebrow">Ready to recover this?</div>
            <div className="rr-cta-amount-wrap">
              <span className="rr-cta-big">${Math.round(annualGain).toLocaleString()}</span>
              <span className="rr-cta-period">/yr</span>
            </div>
            <div className="rr-cta-monthly">= <strong>${Math.round(totalMonthly).toLocaleString()} per month</strong> recoverable</div>

            <hr className="rr-hr" />

            <div className="rr-cta-heading">Book your free strategy call</div>
            <p className="rr-cta-sub">We map your gaps and show you how you can recover this revenue in 30 days. No pitch, no pressure.</p>

            <BookCallButton className="rr-cta-btn">
              Book My Free Call
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </BookCallButton>

            <div className="rr-microcopy">
              <span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Free
              </span>
              <span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                No obligation
              </span>
              <span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                30 min
              </span>
            </div>

            <div className="rr-urgency">
              Every month you wait costs you <strong>${Math.round(totalMonthly).toLocaleString()}</strong> in recoverable revenue.
            </div>

            <hr className="rr-hr" />

            <div className="rr-social-proof">
              <div className="rr-avatars">
                <div className="rr-avatar rr-avatar--a">JR</div>
                <div className="rr-avatar rr-avatar--b">SK</div>
                <div className="rr-avatar rr-avatar--c">ML</div>
                <div className="rr-avatar rr-avatar--d">+</div>
              </div>
              <div className="rr-proof-text">
                <strong>100+ service businesses</strong> already using our system to recover this revenue
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* How we calculated this — modal */}
      {showCalc && (
        <div className="calc-overlay" onClick={() => setShowCalc(false)}>
          <div className="calc-overlay__panel" onClick={e => e.stopPropagation()}>
            <div className="calc-overlay__header">
              <h3 className="calc-overlay__title">How we calculated this</h3>
              <button type="button" className="calc-overlay__close" onClick={() => setShowCalc(false)} aria-label="Close">✕</button>
            </div>
            <div className="calc-overlay__rows">
              {([
                { label: 'Monthly leads',               value: audit.monthly_leads.toLocaleString() },
                { label: 'Revenue per client',          value: `$${audit.revenue_per_client.toLocaleString()}` },
                { label: 'Current conversion rate',     value: `${audit.current_conversion_rate}%` },
                { label: 'Current monthly revenue',     value: `$${Math.round(currentRevenue).toLocaleString()}` },
                { label: 'Conversion lift applied',     value: `+${CONV_LIFT_PP}pp (conservative benchmark)` },
                { label: 'Projected conversion rate',   value: `${improvedRate.toFixed(1)}%` },
                { label: 'Revenue gain from conversion',value: `$${Math.round(monthlyConvGain).toLocaleString()}/mo`, highlight: true },
                ...(lmCost > 0 ? [
                  { label: 'Monthly lead time cost',    value: `$${Math.round(lmCost).toLocaleString()}` },
                  { label: 'Automation applied',        value: `${AUTO_PCT * 100}% of time cost recovered` },
                  { label: 'Time cost savings',         value: `$${Math.round(autoSavings).toLocaleString()}/mo`, highlight: true },
                ] : []),
                { label: 'Total monthly benefit',       value: `$${Math.round(totalMonthly).toLocaleString()}/mo`, highlight: true },
                { label: 'Total annual benefit',        value: `$${Math.round(annualGain).toLocaleString()}/yr`, highlight: true },
              ] as { label: string; value: string; highlight?: boolean }[]).map(row => (
                <div key={row.label} className={`calc-overlay__row${row.highlight ? ' calc-overlay__row--highlight' : ''}`}>
                  <span className="calc-overlay__row-label">{row.label}</span>
                  <span className="calc-overlay__row-value">{row.value}</span>
                </div>
              ))}
            </div>
            <p className="calc-overlay__disclaimer">
              Results are indicative. The +{CONV_LIFT_PP}pp conversion lift and {AUTO_PCT * 100}% automation savings are conservative benchmarks based on published industry research. Actual results vary by business type, market, and execution quality.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
