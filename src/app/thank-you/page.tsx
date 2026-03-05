'use client'

import Link from 'next/link'
import { useFivePStore } from '@/store/useFivePStore'

export default function ThankYouPage() {
  const audit      = useFivePStore(s => s.audit)
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL ?? '#'

  const name = audit.business_name || 'there'
  const email = audit.email ?? ''

  return (
    <main>
      <section className="page-section">
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className="hero__eyebrow" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            You&apos;re all set
          </div>
          <h1 style={{ marginBottom: '1rem' }}>You&apos;re all set, {name}.</h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Your templates are ready to download above.
            {email && <> We&apos;ve also sent a copy to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>.</>}
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            If you want to go further — Personalization, Presence strategy, and a full Process design — that&apos;s what we do at Profit AI Lab.
          </p>

          <div className="stack stack--md" style={{ alignItems: 'center' }}>
            <a
              href={bookingUrl}
              className="btn btn--primary btn--lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Free Strategy Call
            </a>
            <Link href="/simulator" className="btn btn--ghost">
              ← Back to your simulator
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
