'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BACK_HREFS: Record<string, string> = {
  '/results':   '/gate',
  '/booked':    '/results',
  '/simulator': '/',
}

export function Header() {
  const pathname = usePathname()
  const backHref = BACK_HREFS[pathname] ?? null

  if (pathname === '/' || pathname === '/gate' || pathname === '/results' || pathname === '/special-offer' || pathname === '/simulator') return null

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__left">
          {backHref && (
            backHref === '/' ? (
              <Link href="/" className="header__home" aria-label="Home">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </Link>
            ) : (
              <Link href={backHref} className="header__back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </Link>
            )
          )}
          <Link href="/" className="header__logo">
            Profit AI Lab<span>.</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
