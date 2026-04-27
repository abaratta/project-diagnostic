'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuditForm } from '@/components/AuditForm'
import { setVaultUnlocked } from '@/lib/vaultSession'

function HomeContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const step         = searchParams.get('step')

  const [vaultOpen, setVaultOpen] = useState(false)
  const [name,      setName]      = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const [shake,     setShake]     = useState(false)

  if (step) return <AuditForm />

  function openVault()  { setVaultOpen(true); setError('') }
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
    <main>
      <div className="landing-wrapper">

        <div className="landing-eyebrow">Profit AI Lab</div>
        <h1 className="landing-title">Choose Your Simulation</h1>
        <p className="landing-sub">Test multiple scenarios to identify the best strategy</p>

        <div className="landing-choices">

          {/* LinkedIn Lead Gen Simulator */}
          <button className="landing-choice" onClick={() => router.push('/lead-gen')}>
            <div className="landing-choice__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="4" fill="currentColor" opacity="0.15"/>
                <path d="M7.5 9.5H5V18.5H7.5V9.5Z"/>
                <circle cx="6.25" cy="6.75" r="1.5"/>
                <path d="M13 13.25C13 12 13.75 11.25 15 11.25C16.25 11.25 16.75 12 16.75 13.25V18.5H19.25V13C19.25 10.75 17.75 9.25 15.5 9.25C14.25 9.25 13.25 9.75 13 10.5V9.5H10.5V18.5H13V13.25Z"/>
              </svg>
            </div>
            <div className="landing-choice__body">
              <div className="landing-choice__title">LinkedIn Lead Gen Simulator</div>
              <div className="landing-choice__sub">Model your lead generation strategy and forecast pipeline growth in minutes</div>
              <span className="landing-choice__pill">Free</span>
            </div>
            <div className="landing-choice__arrow">→</div>
          </button>

          {/* Lead to Revenue Simulator */}
          <button className="landing-choice" onClick={() => router.push('/?step=1')}>
            <div className="landing-choice__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div className="landing-choice__body">
              <div className="landing-choice__title">Lead to Revenue Simulator</div>
              <div className="landing-choice__sub">Audit your lead pipeline and uncover your monthly revenue opportunity in 2 minutes</div>
              <span className="landing-choice__pill">Free</span>
            </div>
            <div className="landing-choice__arrow">→</div>
          </button>

          {/* Business Growth Simulator */}
          <button className="landing-choice landing-choice--locked" onClick={openVault}>
            <div className="landing-choice__icon landing-choice__icon--lock">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="landing-choice__body">
              <div className="landing-choice__title">Business Growth Simulator</div>
              <div className="landing-choice__sub">Map your full growth strategy across channels, offers, and conversion points</div>
              <span className="landing-choice__pill landing-choice__pill--locked">Locked</span>
            </div>
            <div className="landing-choice__arrow">→</div>
          </button>

        </div>

        <div className="landing-community">
          <a href="https://profitailab.short.gy/2n8YEr" target="_blank" rel="noopener noreferrer" className="landing-community__link">
            Join our free community to unlock more tools →
          </a>
        </div>

      </div>

      {/* Vault modal */}
      {vaultOpen && (
        <div className="vault-overlay" onClick={closeVault}>
          <div className={`vault-modal${shake ? ' vault-modal--shake' : ''}`} onClick={e => e.stopPropagation()}>

            <button className="vault-close" onClick={closeVault} aria-label="Close">✕</button>

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
            <h2 className="vault-title">Restricted Access</h2>
            <p className="vault-sub">This tool is restricted to authorised personnel. Enter your credentials to unlock.</p>

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
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
