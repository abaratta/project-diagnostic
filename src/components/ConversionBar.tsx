'use client'

import { motion } from 'framer-motion'

type Props = {
  currentRate:  number   // 0–100
  improvedRate: number   // 0–100
}

export function ConversionBar({ currentRate, improvedRate }: Props) {
  const currentPct  = Math.min(currentRate, 100)
  const improvedPct = Math.min(improvedRate, 100)

  return (
    <div className="stack stack--sm">
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        <span>Conversion rate</span>
        <span style={{ color: 'var(--color-text)' }}>
          <span style={{ color: 'var(--color-accent-cyan)', fontWeight: 700 }}>{improvedPct.toFixed(1)}%</span>
          {' '}
          <span style={{ color: 'var(--color-text-dim)' }}>(was {currentPct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="conversion-bar-bg">
        {/* Baseline marker */}
        <div style={{
          position: 'absolute',
          left: `${currentPct}%`,
          top: 0,
          bottom: 0,
          width: '2px',
          background: 'rgba(255,255,255,0.25)',
          zIndex: 2,
        }} />
        {/* Animated fill */}
        <motion.div
          className="conversion-bar-fill"
          animate={{ width: `${improvedPct}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
