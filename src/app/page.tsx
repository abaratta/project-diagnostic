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

        <div className="landing-eyebrow"><a href="https://profitailab.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Profit AI Lab Diagnostic</a></div>
        <h1 className="landing-title">Calculate what<br />slow response is costing you</h1>
        <p className="landing-sub">Move three levers. See the number. Decide if it&apos;s worth fixing.</p>

        <div className="landing-choices">
          <button className="landing-glass-btn" onClick={openSimulator}>
            <span className="landing-glass-btn__label">Calculate Now</span>
            <span className="landing-glass-btn__divider" aria-hidden="true" />
            <span className="landing-glass-btn__sub">Takes 3 minutes</span>
            <svg className="landing-glass-btn__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>
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
