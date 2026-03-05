'use client'

import { useFivePStore } from '@/store/useFivePStore'

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString()
}

export function GainLabel() {
  const simulator   = useFivePStore(s => s.simulator)
  const getMonthlyGain = useFivePStore(s => s.getMonthlyGain)
  const getAnnualGain  = useFivePStore(s => s.getAnnualGain)

  const paceActive            = simulator.pace_slider > 0
  const personalizationActive = simulator.personalization_slider > 0
  const presenceActive        = simulator.presence_slider > 0
  const activeCount           = [paceActive, personalizationActive, presenceActive].filter(Boolean).length

  const monthly = getMonthlyGain()
  const annual  = getAnnualGain()

  let text: string

  if (activeCount === 0) {
    text = 'Move the sliders to see your growth potential.'
  } else if (activeCount === 1 && paceActive) {
    text = `Responding faster alone could add ${fmt(monthly)}/month to your revenue.`
  } else if (activeCount === 1 && personalizationActive) {
    text = `More relevant responses alone could add ${fmt(monthly)}/month to your revenue.`
  } else if (activeCount === 1 && presenceActive) {
    text = `Being more available alone could add ${fmt(monthly)}/month to your revenue.`
  } else {
    text = `Combining these improvements could add ${fmt(monthly)}/month — ${fmt(annual)}/year.`
  }

  return (
    <p style={{
      fontSize: '0.9375rem',
      color: activeCount === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
      marginBottom: 0,
      fontStyle: activeCount === 0 ? 'italic' : 'normal',
    }}>
      {text}
    </p>
  )
}
