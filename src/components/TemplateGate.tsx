'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFivePStore } from '@/store/useFivePStore'
import { getTemplatesForSource } from '@/data/templates'
import type { LeadSource } from '@/store/useFivePStore'
import { TemplateCard } from './TemplateCard'

export function TemplateGate() {
  const audit         = useFivePStore(s => s.audit)
  const captureEmail  = useFivePStore(s => s.captureEmail)
  const simulator     = useFivePStore(s => s.simulator)

  const [gateEmail,   setGateEmail]   = useState('')
  const [gateError,   setGateError]   = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  const emailCaptured      = audit.email_captured
  const templatesUnlocked  = simulator.templates_unlocked
  const leadSource         = audit.lead_source as LeadSource | null
  const relevantTemplates  = leadSource ? getTemplatesForSource(leadSource) : []

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gateEmail || !gateEmail.includes('@')) {
      setGateError('Enter a valid email address')
      return
    }
    setSubmitting(true)
    captureEmail(gateEmail)
    setSubmitting(false)
  }

  return (
    <div className="stack stack--lg">
      <div>
        <h2 style={{ marginBottom: '0.5rem' }}>Ready to make this real?</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 0 }}>
          We&apos;ve built the Make automation templates to implement what you&apos;ve modelled. Download them free.
        </p>
      </div>

      {/* Email gate — skip if already captured */}
      {!emailCaptured && (
        <div className="card" style={{ maxWidth: '480px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Enter your email to unlock your templates
          </div>
          <form onSubmit={handleEmailSubmit} noValidate className="stack stack--sm">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={gateEmail}
                onChange={e => { setGateEmail(e.target.value); setGateError('') }}
              />
              {gateError && <span className="form-error">{gateError}</span>}
            </div>
            <button type="submit" disabled={submitting} className="btn btn--primary btn--full">
              Unlock My Templates
            </button>
          </form>
        </div>
      )}

      {/* Template cards — shown once unlocked */}
      <AnimatePresence>
        {templatesUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="stack stack--md"
          >
            {relevantTemplates.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {relevantTemplates.map(t => (
                  <TemplateCard key={t.id} template={t} />
                ))}
              </div>
            ) : (
              <div className="notice notice--info">
                No templates match your current lead source. <a href={process.env.NEXT_PUBLIC_BOOKING_URL ?? '#'}>Book a call</a> and we&apos;ll build one for you.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
