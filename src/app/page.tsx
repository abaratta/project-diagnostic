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
        <h1 className="landing-title">Choose your tool</h1>
        <p className="landing-sub">Select a simulator to get started</p>

        <div className="landing-choices">

          {/* Revenue Simulator */}
          <button className="landing-choice" onClick={() => router.push('/?step=1')}>
            <div className="landing-choice__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div className="landing-choice__body">
              <div className="landing-choice__title">Revenue Simulator</div>
              <div className="landing-choice__sub">Audit your lead pipeline and uncover your monthly revenue opportunity in 2 minutes</div>
            </div>
            <div className="landing-choice__arrow">→</div>
          </button>

          {/* Growth Simulator */}
          <button className="landing-choice landing-choice--locked" onClick={openVault}>
            <div className="landing-choice__icon landing-choice__icon--lock">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="landing-choice__body">
              <div className="landing-choice__title">Growth Simulator</div>
              <div className="landing-choice__sub">Restricted access — authorised personnel only</div>
            </div>
            <div className="landing-choice__arrow">→</div>
          </button>

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
