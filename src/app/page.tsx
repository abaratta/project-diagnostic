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
        <h1 className="landing-title">Find out what losing control of your pipeline is costing you</h1>
        <p className="landing-sub">Move three levers. See the number. Decide if it&apos;s worth fixing.</p>

        <div className="landing-measures" aria-label="What this diagnostic measures">
          <span>Response speed</span>
          <span>Personalised follow-up</span>
          <span>Process automation</span>
          <span>Annual revenue upside</span>
        </div>

        <div className="landing-choices">

          <button className="landing-choice" onClick={openSimulator}>
            <div className="landing-choice__icon landing-choice__icon--lock">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div className="landing-choice__body">
              <div className="landing-choice__title">Estimate your conversion revenue upside</div>
              <div className="landing-choice__sub">Enter your leads, conversion rate, client value, and handling costs. Then model how better conversion systems change annual revenue.</div>
              <span className="landing-choice__pill">Takes 2 minutes</span>
            </div>
            <div className="landing-choice__arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </div>
          </button>

        </div>

        <div className="landing-community">
          <a href="https://profitailab.short.gy/2n8YEr" target="_blank" rel="noopener noreferrer" className="landing-community__link">
            Join our free community →
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
