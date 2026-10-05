'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { setVaultUnlocked } from '@/lib/vaultSession'

const BACK_HREFS: Record<string, string> = {
  '/results':   '/gate',
  '/booked':    '/results',
  '/simulator': '/',
}

const HIDDEN_ON = ['/gate', '/results', '/special-offer', '/simulator']

export function Header() {
  const pathname = usePathname()
  const backHref = BACK_HREFS[pathname] ?? null
  const overHero = pathname === '/'
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  const solid = !overHero || scrolledPastHero

  // Transparent over the landing photo, frosted light bar once the story starts.
  useEffect(() => {
    if (!overHero) return
    const onScroll = () => setScrolledPastHero(window.scrollY > window.innerHeight * 0.75)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overHero])

  if (HIDDEN_ON.includes(pathname)) return null

  return (
    <header className={clsx('header', overHero && 'header--over-hero', solid && 'header--solid')}>
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
          <Link href="/" className="header__logo" aria-label="Profit AI Lab — home">
            <Image src="/brand/logo-full.png" alt="Profit AI Lab" fill sizes="106px" priority className="header__logo-img header__logo-img--dark" />
            <Image src="/brand/logo-white.png" alt="" fill sizes="106px" priority className="header__logo-img header__logo-img--light" />
          </Link>
        </div>
        {overHero && (
          <Link href="/simulator" onClick={() => setVaultUnlocked()} className="header__pill">
            Calculate now
          </Link>
        )}
      </div>
    </header>
  )
}
