'use client'

import { useFivePStore } from '@/store/useFivePStore'

export default function BookedPage() {
  const audit = useFivePStore(s => s.audit)
  const name  = audit.business_name ? audit.business_name.split(' ')[0] : null

  return (
    <main>
      <section className="page-section">
        <div className="container" style={{ maxWidth: '580px', textAlign: 'center' }}>

          <div className="hero__eyebrow" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            Call booked
          </div>

          <h1 style={{ marginBottom: '1rem' }}>
            {name ? `You're all set, ${name}!` : "You're all set!"}
          </h1>

          <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            We'll speak soon. Check your email for a calendar confirmation — we look forward to talking through your revenue opportunities.
          </p>

        </div>
      </section>
    </main>
  )
}
