'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { useFivePStore } from '@/store/useFivePStore'
import { ConversionBar } from './ConversionBar'
import { GainLabel } from './GainLabel'
import { SpeedToLeadBar } from './SpeedToLeadBar'

function AnimatedNumber({ value, prefix = '', suffix = '', className, style }: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
  style?: React.CSSProperties
}) {
  const ref  = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)

  useEffect(() => {
    if (!ref.current) return
    const from = prev.current
    const to   = value
    prev.current = value
    const controls = animate(from, to, {
      duration: 0.4,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString() + suffix
      },
    })
    return () => controls.stop()
  }, [value, prefix, suffix])

  return (
    <span className={className} style={style} ref={ref}>
      {prefix}{Math.round(value).toLocaleString()}{suffix}
    </span>
  )
}

export function ResultsPanel() {
  const audit                     = useFivePStore(s => s.audit)
  const getImprovedConversionRate = useFivePStore(s => s.getImprovedConversionRate)
  const getCurrentMonthlyRevenue  = useFivePStore(s => s.getCurrentMonthlyRevenue)
  const getImprovedMonthlyRevenue = useFivePStore(s => s.getImprovedMonthlyRevenue)
  const getMonthlyGain            = useFivePStore(s => s.getMonthlyGain)
  const getAnnualGain             = useFivePStore(s => s.getAnnualGain)
  const getMonthlyCostSavings     = useFivePStore(s => s.getMonthlyCostSavings)
  const getTotalAnnualBenefit     = useFivePStore(s => s.getTotalAnnualBenefit)

  const improvedRate      = getImprovedConversionRate()
  const currentRevenue    = getCurrentMonthlyRevenue()
  const improvedRevenue   = getImprovedMonthlyRevenue()
  const monthlyGain       = getMonthlyGain()
  const annualGain        = getAnnualGain()
  const monthlySavings    = getMonthlyCostSavings()
  const totalAnnualBenefit = getTotalAnnualBenefit()
  const annualSavings     = monthlySavings * 12

  return (
    <div className="stack stack--md">

      {/* Total annual benefit — the headline number */}
      <div className="card card--active card--glow-cyan">
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
          Total Annual Benefit
        </div>
        <AnimatedNumber
          value={totalAnnualBenefit}
          prefix="$"
          className="gain-number-large"
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.25rem', marginBottom: '0.875rem' }}>
          Revenue gains + time cost savings
        </div>

        {/* Breakdown */}
        <div className="benefit-split">
          <div className="benefit-item">
            <span className="benefit-item__label">Revenue gain</span>
            <AnimatedNumber
              value={annualGain}
              prefix="$"
              className="benefit-item__value benefit-item__value--revenue"
            />
            <span className="benefit-item__sub">+${Math.round(monthlyGain).toLocaleString()}/mo</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-item__label">Cost savings</span>
            <AnimatedNumber
              value={annualSavings}
              prefix="$"
              className="benefit-item__value benefit-item__value--savings"
            />
            <span className="benefit-item__sub">
              {monthlySavings > 0
                ? `+$${Math.round(monthlySavings).toLocaleString()}/mo`
                : 'Set automation slider'}
            </span>
          </div>
        </div>
      </div>

      {/* Conversion rate card */}
      <div className="card">
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.625rem' }}>
          Conversion Rate
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginBottom: '0.15rem' }}>Current</div>
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: '1.875rem', fontWeight: 800,
              color: 'var(--color-text-dim)', lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {audit.current_conversion_rate.toFixed(1)}%
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>Improved</div>
            <AnimatedNumber
              value={improvedRate}
              suffix="%"
              style={{
                fontFamily: 'var(--font-heading)', fontSize: '1.875rem', fontWeight: 800,
                color: 'var(--color-accent-cyan)', lineHeight: 1, letterSpacing: '-0.02em',
              }}
            />
          </div>
        </div>
        <ConversionBar currentRate={audit.current_conversion_rate} improvedRate={improvedRate} />
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
          New monthly revenue: ${Math.round(improvedRevenue).toLocaleString()}
          {' '}(was ${Math.round(currentRevenue).toLocaleString()})
        </div>
      </div>

      {/* Speed to Lead bar */}
      <div className="card">
        <SpeedToLeadBar />
      </div>

      {/* Contextual gain label */}
      <GainLabel />
    </div>
  )
}
