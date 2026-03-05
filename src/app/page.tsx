'use client'

import { useFivePStore } from '@/store/useFivePStore'
import { AuditForm } from '@/components/AuditForm'
import { RevenuePreview } from '@/components/RevenuePreview'

export default function HomePage() {
  const audit = useFivePStore(s => s.audit)

  return (
    <div className="viewport-split">
      {/* Left: audit form */}
      <div className="viewport-split__col viewport-split__col--border-right">
        <AuditForm />
      </div>

      {/* Right: live preview + CTA */}
      <div className="viewport-split__col" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="stack stack--xl" style={{ flex: 1 }}>
          <div>
            <div className="section-header__eyebrow" style={{ marginBottom: '0.25rem' }}>
              Live preview
            </div>
            <h2 style={{ fontSize: '1.375rem', marginBottom: '0.25rem' }}>Your numbers at a glance</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Updates as you fill in the form on the left.
            </p>
          </div>

          <RevenuePreview
            monthlyLeads={audit.monthly_leads}
            costPerLead={audit.cost_per_lead}
            conversionRate={audit.current_conversion_rate}
            revenuePerClient={audit.revenue_per_client}
            timePerLead={audit.time_per_lead}
            hourlyCost={audit.hourly_cost}
          />

          {/* Why speed-to-lead matters */}
          <div className="card stack stack--md">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent-cyan)' }}>
              Why this matters
            </div>
            <div className="stack stack--sm">
              {[
                { stat: '9×', text: 'more likely to convert when you respond within 5 minutes' },
                { stat: '+40%', text: 'average conversion lift our clients see in 90 days' },
                { stat: '78%', text: 'of buyers go with the first company to respond' },
              ].map(item => (
                <div key={item.stat} className="why-stat">
                  <span className="why-stat__num">{item.stat}</span>
                  <span className="why-stat__text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA button — bottom-right of right column */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem' }}>
          <button type="submit" form="audit-form" className="btn--cta-glass">
            <span className="glass-sheen" />
            <span className="glass-bottom" />
            <span className="wave-2" />
            <span className="btn-text">See How to Grow This →</span>
          </button>
        </div>
      </div>
    </div>
  )
}
