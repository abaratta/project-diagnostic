'use client'

import { useFivePStore } from '@/store/useFivePStore'
import { sliders } from '@/data/simulator'

// Corrects for thumb width so markers align with the track
function markerLeft(pct: number) {
  return `calc(${pct / 100} * (100% - 22px) + 11px)`
}

// Thin reference tick (0 / 50% / 100%)
function RefTick({ pct, label }: { pct: number; label: string }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: markerLeft(pct),
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '1px',
        height: '5px',
        background: 'rgba(255,255,255,0.18)',
        borderRadius: '1px',
      }} />
      <span style={{
        fontSize: '0.6rem',
        fontWeight: 600,
        color: 'var(--color-text-dim)',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  )
}

// Amber industry-average tick
function AvgTick({ pct }: { pct: number }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: markerLeft(pct),
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '2px',
        height: '5px',
        background: 'var(--color-accent-amber)',
        borderRadius: '1px',
      }} />
      <span style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        color: 'var(--color-accent-amber)',
        whiteSpace: 'nowrap',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        avg
      </span>
    </div>
  )
}

export function SliderPanel() {
  const simulator                    = useFivePStore(s => s.simulator)
  const setSlider                    = useFivePStore(s => s.setSlider)
  const getMonthlyLeadManagementCost = useFivePStore(s => s.getMonthlyLeadManagementCost)

  const values: Record<string, number> = {
    pace:            simulator.pace_slider,
    personalization: simulator.personalization_slider,
    presence:        simulator.presence_slider,
  }

  const monthlyLMCost  = getMonthlyLeadManagementCost()
  const automationPct  = simulator.automation_slider
  const monthlySavings = (automationPct / 100) * monthlyLMCost

  return (
    <div className="stack stack--lg">

      {/* 3 P-sliders */}
      {sliders.map(slider => {
        const value      = values[slider.key]
        const convImpact = ((value / 10) * slider.gain_per_10).toFixed(1)

        return (
          <div key={slider.key}>
            {/* Title + live value */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem' }}>
                {slider.label}
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-heading)' }}>
                  +{value}%
                </span>
                {value > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                    (+{convImpact}pp conv.)
                  </span>
                )}
              </span>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
              {slider.subtext}
            </p>

            {/* Track + all markers on the same line */}
            <div style={{ position: 'relative', paddingBottom: '22px' }}>
              <input
                type="range"
                className="slider-input"
                min={0} max={100} step={1}
                value={value}
                onChange={e => setSlider(slider.key, Number(e.target.value))}
                aria-label={slider.label}
              />
              <RefTick pct={0}   label={slider.ref_label_min ?? '0'} />
              <RefTick pct={50}  label={slider.ref_label_mid ?? '50%'} />
              <RefTick pct={100} label={slider.ref_label_max ?? '100%'} />
              <AvgTick pct={slider.industry_standard} />
            </div>

          </div>
        )
      })}

      {/* Divider */}
      <div className="divider" style={{ margin: 0 }} />

      {/* Automation slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem' }}>
            Process — Level of automation
          </span>
          <span className="automation-label">{automationPct}%</span>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
          What % of your lead qualification and follow-up will be automated? Cuts your time cost proportionally.
        </p>

        {/* Track + all markers on the same line */}
        <div style={{ position: 'relative', paddingBottom: '22px' }}>
          <input
            type="range"
            className="slider-input"
            min={0} max={100} step={5}
            value={automationPct}
            onChange={e => setSlider('automation', Number(e.target.value))}
            aria-label="Automation level"
          />
          <RefTick pct={0}   label="Manual" />
          <RefTick pct={50}  label="Partially automated" />
          <RefTick pct={100} label="Fully automated" />
          <AvgTick pct={20} />
        </div>

        {/* Cost savings hint */}
        {monthlyLMCost > 0 && automationPct > 0 && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(61,202,177,0.06)',
            border: '1px solid rgba(61,202,177,0.2)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
          }}>
            Saves{' '}
            <strong style={{ color: 'var(--color-accent-cyan)' }}>
              ${Math.round(monthlySavings).toLocaleString()}/month
            </strong>{' '}
            in lead management time ({automationPct}% of ${Math.round(monthlyLMCost).toLocaleString()}/mo)
          </div>
        )}
        {monthlyLMCost === 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'block', marginTop: '0.375rem' }}>
            Fill in time per lead + hourly cost on Screen 1 to unlock cost savings.
          </span>
        )}
      </div>

    </div>
  )
}
