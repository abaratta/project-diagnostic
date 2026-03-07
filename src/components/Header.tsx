'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { setVaultUnlocked } from '@/lib/vaultSession'
import { BookCallButton } from '@/components/BookCallButton'

const BACK_HREFS: Record<string, string> = {
  '/gate':      '/',
  '/results':   '/gate',
  '/booked':    '/results',
  '/simulator': '/results',
}

export function Header() {
  const pathname = usePathname()
  const router   = useRouter()
  const backHref = BACK_HREFS[pathname] ?? null

  const [vaultOpen, setVaultOpen] = useState(false)
  const [name,      setName]      = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const [shake,     setShake]     = useState(false)

  function openVault() { setVaultOpen(true); setError('') }
  function closeVault() { setVaultOpen(false); setName(''); setPassword(''); setError('') }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().toLowerCase() === 'andrea' && password === '230879') {
      setVaultUnlocked()
      closeVault()
      router.push('/simulator')
    } else {
      setError('Access denied. Check your credentials.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <>
      <header className="header">
        <div className="header__inner">
          <div className="header__left">
            {backHref && (
              <Link href={backHref} className="header__back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </Link>
            )}
            <Link href="/" className="header__logo">
              Profit AI Lab<span>.</span>
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {pathname === '/' && (
              <span className="skip-audit-hint">
                Skip Audit →
              </span>
            )}
            <BookCallButton className="btn btn--primary header__cta">Book a Call</BookCallButton>
            <button className="vault-trigger" onClick={openVault} aria-label="Admin access">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {vaultOpen && (
        <div className="vault-overlay" onClick={closeVault}>
          <div className={`vault-modal${shake ? ' vault-modal--shake' : ''}`} onClick={e => e.stopPropagation()}>

            <button className="vault-close" onClick={closeVault} aria-label="Close">✕</button>

            {/* Vault icon ring */}
            <div className="vault-ring">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="rgba(61,202,177,0.25)" strokeWidth="1.5" strokeDasharray="5 3"/>
                <circle cx="24" cy="24" r="16" stroke="rgba(61,202,177,0.15)" strokeWidth="1"/>
                <rect x="16" y="22" width="16" height="12" rx="2" stroke="#3dcab1" strokeWidth="1.75" fill="none"/>
                <path d="M18 22v-4a6 6 0 0 1 12 0v4" stroke="#3dcab1" strokeWidth="1.75" strokeLinecap="round" fill="none"/>
                <circle cx="24" cy="28" r="1.5" fill="#3dcab1"/>
              </svg>
            </div>

            <div className="vault-eyebrow">Restricted Access</div>
            <h2 className="vault-title">Growth Simulator</h2>
            <p className="vault-sub">Authorised personnel only. Enter your credentials to unlock.</p>

            <form className="vault-form" onSubmit={handleSubmit}>
              <input
                className="vault-input"
                type="text"
                placeholder="Name"
                value={name}
                autoComplete="off"
                autoFocus
                onChange={e => { setName(e.target.value); setError('') }}
              />
              <input
                className="vault-input"
                type="password"
                placeholder="6-digit passcode"
                maxLength={6}
                value={password}
                autoComplete="off"
                onChange={e => { setPassword(e.target.value); setError('') }}
              />
              {error && <div className="vault-error">{error}</div>}
              <button type="submit" className="vault-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Unlock Access
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
