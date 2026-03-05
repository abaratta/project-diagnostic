import Link from 'next/link'

export function Header() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL ?? '#'

  return (
    <header className="header">
      <div className="header__inner">
        <Link href="/" className="header__logo">
          Profit AI Lab<span>.</span>
        </Link>
        <a
          href={bookingUrl}
          className="btn btn--primary header__cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          Book a Call
        </a>
      </div>
    </header>
  )
}
