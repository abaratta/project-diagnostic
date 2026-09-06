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
        <h1 className="landing-title">Calculate what<br />slow response is{' '}
          <span className="landing-title__highlight">costing you</span>
        </h1>
        <p className="landing-sub">Respond to nine questions. See the number. Decide if it&apos;s worth fixing.</p>

        <div className="landing-choices">
          <button className="landing-glass-btn" onClick={openSimulator}>
            Calculate Now →
          </button>
          <p className="landing-cta-sub">Takes 3 minutes</p>
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
