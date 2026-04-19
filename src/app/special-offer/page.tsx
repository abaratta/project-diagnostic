'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BOOKING_URL = 'https://tidycal.com/andrea-baratta/linkedin-dm-campaign'

const DELIVERABLES = [
  'Create your DM campaign account',
  'Create your first target list (200 leads)',
  'Create your message sequence',
  'Set up lead capture',
  'Create Slack or email notifications',
]

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${Math.round(n).toLocaleString()}`
  return `$${n.toFixed(2)}`
}

function calcTotal(): number {
  try {
    const raw = sessionStorage.getItem('lgf_v1')
    if (!raw) return 0
    const s = JSON.parse(raw)

    const invitesNum    = Math.max(0, Number(s.invites)   || 0)
    const connectionNum = Math.min(100, Math.max(0, Number(s.connRate) || 0))
    const interestedNum = Math.min(100, Math.max(0, Number(s.intRate)  || 0))
    const conversionNum = Math.min(100, Math.max(0, Number(s.convRate) || 0))
    const connected      = invitesNum * connectionNum / 100
    const interested     = connected  * interestedNum  / 100
    const convertedCount = interested * conversionNum  / 100

    const annualRevenue = s.clv && convertedCount > 0
      ? Math.round(Number(s.clv) * convertedCount * 12) : 0
    const arr = s.mrr ? Math.round(Number(s.mrr) * 78) : 0

    return annualRevenue + arr
  } catch {
    return 0
  }
}

function SpecialOfferContent() {
  const router        = useRouter()
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setTotal(calcTotal())
  }, [])

  return (
    <main>
      <div className="landing-wrapper">

        <div className="landing-eyebrow">Special Offer</div>

        <h1 className="landing-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.5rem' }}>
          Your starter pack is on its way.
        </h1>
        <p className="landing-sub" style={{ marginBottom: '2rem' }}>
          If you don't want to wait and start making an additional{' '}
          <strong style={{ color: 'var(--color-accent-cyan)' }}>
            {total > 0 ? fmtMoney(total) : '—'}
          </strong>{' '}
          today, we have a special offer for you.
        </p>

        {/* Offer card */}
        <div style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderTop: '2px solid var(--color-accent-cyan)',
          borderRadius: 'var(--radius-card)',
          padding: '2rem 1.75rem',
          maxWidth: '480px',
          margin: '0 auto',
          textAlign: 'left',
        }}>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--color-accent-cyan)', lineHeight: 1 }}>$499</span>
            <span style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>one-time set up</span>
          </div>

          {/* Deliverables */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DELIVERABLES.map(item => (
              <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: '0.9375rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{item}</span>
              </li>
            ))}
          </ul>

          {/* Timeline */}
          <p style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            margin: '0 0 1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--color-border)',
          }}>
            You will have your campaign running in{' '}
            <strong style={{ color: 'var(--color-accent-cyan)' }}>48 hrs</strong>.
          </p>

          {/* CTA */}
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
            If interested book a call now
          </p>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--pink btn--full btn--lg"
          >
            Book a Call
          </a>

        </div>

        {/* Back */}
        <div style={{ marginTop: '1.75rem' }}>
          <button className="btn btn--ghost" onClick={() => router.back()}>
            ← Back
          </button>
        </div>

      </div>
    </main>
  )
}

export default function SpecialOfferPage() {
  return (
    <Suspense>
      <SpecialOfferContent />
    </Suspense>
  )
}
