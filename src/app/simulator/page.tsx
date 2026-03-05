'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useFivePStore } from '@/store/useFivePStore'
import { SliderPanel } from '@/components/SliderPanel'
import { ResultsPanel } from '@/components/ResultsPanel'
import { TemplateGate } from '@/components/TemplateGate'
import { UpgradePrompt } from '@/components/UpgradePrompt'

export default function SimulatorPage() {
  const router          = useRouter()
  const isAuditComplete = useFivePStore(s => s.isAuditComplete)
  const simulator       = useFivePStore(s => s.simulator)
  const templatesRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuditComplete()) router.replace('/')
  }, [isAuditComplete, router])

  const anySliderActive =
    simulator.pace_slider > 0 ||
    simulator.personalization_slider > 0 ||
    simulator.presence_slider > 0 ||
    simulator.automation_slider > 0

  function scrollToTemplates() {
    templatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main style={{ paddingBottom: anySliderActive ? '72px' : 0 }}>
      {/* Above-fold two-column */}
      <div className="viewport-split">
        {/* Left: sliders */}
        <div className="viewport-split__col viewport-split__col--border-right">
          <div className="stack stack--lg">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <div className="section-header__eyebrow" style={{ margin: 0 }}>Step 2 of 2</div>
                <button
                  onClick={() => router.push('/')}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '999px',
                    padding: '0.15em 0.65em',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-text-dim)',
                    letterSpacing: '0.04em',
                    lineHeight: 1.4,
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.45)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-dim)'
                  }}
                >
                  ← Edit inputs
                </button>
              </div>
              <h2 style={{ fontSize: '1.375rem', marginBottom: '0.25rem' }}>Growth Simulator</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Move the sliders to model your improvements. Revenue gains + time cost savings combined.
              </p>
            </div>
            <SliderPanel />
          </div>
        </div>

        {/* Right: results */}
        <div className="viewport-split__col">
          <ResultsPanel />
        </div>
      </div>

      {/* Below-fold: templates + upgrade */}
      <div ref={templatesRef} style={{ padding: '3rem 2.5rem', scrollMarginTop: 'var(--header-height)' }}>
        <AnimatePresence>
          {anySliderActive && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4 }}
            >
              <div className="divider" />
              <TemplateGate />
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ marginTop: '3rem' }}>
          <div className="divider" />
          <UpgradePrompt />
        </div>
      </div>

      {/* Sticky bottom CTA — appears once any slider is active */}
      <AnimatePresence>
        {anySliderActive && (
          <motion.div
            className="sticky-cta-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="sticky-cta-bar__left">
              <div className="sticky-cta-bar__dot" />
              <span className="sticky-cta-bar__text">
                <strong>Your growth plan is ready.</strong>
                {' '}Scroll down for your free templates and strategy guide.
              </span>
            </div>
            <div className="sticky-cta-bar__actions">
              <button
                className="btn btn--primary btn--sm"
                onClick={scrollToTemplates}
              >
                Get free templates ↓
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
