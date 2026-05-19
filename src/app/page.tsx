'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { DottedSurface } from '@/components/ui/dotted-surface'
import { setVaultUnlocked } from '@/lib/vaultSession'

function HomeContent() {
  const router       = useRouter()

  function openSimulator() {
    setVaultUnlocked()
    router.push('/simulator')
  }

  return (
    <main className="landing-page">
      <DottedSurface className="landing-dotted-surface" />

      <div className="landing-wrapper">

        <div className="landing-eyebrow"><a href="https://profitailab.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Profit AI Lab</a></div>
        <h1 className="landing-title">Business Growth Simulator</h1>
        <p className="landing-sub">Map your full growth strategy across channels, offers, and conversion points.</p>

        <div className="landing-choices">

          <button className="landing-choice" onClick={openSimulator}>
            <div className="landing-choice__icon landing-choice__icon--lock">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div className="landing-choice__body">
              <div className="landing-choice__title">Open Business Growth Simulator</div>
              <div className="landing-choice__sub">Map your full growth strategy across channels, offers, and conversion points</div>
              <span className="landing-choice__pill">Open tool</span>
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
