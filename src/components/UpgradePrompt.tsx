export function UpgradePrompt() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL ?? '#'

  return (
    <div className="upgrade-prompt">
      <h2 style={{ marginBottom: '0.75rem' }}>
        Want Personalization, Presence, and a full Process system?
      </h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '560px', margin: '0 auto 1.5rem' }}>
        The templates above address Pace. Personalization, Presence strategy, and Process design require a tailored approach — that&apos;s what we do at Profit AI Lab.
      </p>
      <a
        href={bookingUrl}
        className="btn btn--primary btn--lg"
        target="_blank"
        rel="noopener noreferrer"
      >
        Book a Free Strategy Call
      </a>
    </div>
  )
}
