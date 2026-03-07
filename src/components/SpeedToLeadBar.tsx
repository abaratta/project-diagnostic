'use client'

import { motion } from 'framer-motion'
import { useFivePStore } from '@/store/useFivePStore'

const SEGMENTS = [
  { label: 'Days',    mult: '1×',  color: '#FF4D6A' },
  { label: 'Hours',   mult: '2×',  color: '#FF8C42' },
  { label: '30 min',  mult: '4×',  color: '#e6356b' },
  { label: '5 min',   mult: '7×',  color: '#7BFF6B' },
  { label: '< 5 min', mult: '9×',  color: '#00FF88' },
]

// Map pace slider (0–100) to segment index 0–4
function getSegmentIndex(pace: number) {
  if (pace <= 20) return 0
  if (pace <= 40) return 1
  if (pace <= 60) return 2
  if (pace <= 80) return 3
  return 4
}

// Indicator position as % of bar width
function getIndicatorPct(pace: number) {
  return pace
}

export function SpeedToLeadBar() {
  const paceSlider     = useFivePStore(s => s.simulator.pace_slider)
  const convRate       = useFivePStore(s => s.audit.current_conversion_rate)

  const segIdx         = getSegmentIndex(paceSlider)
  const activeSegment  = SEGMENTS[segIdx]
  const indicatorPct   = getIndicatorPct(paceSlider)

  // What the multiplier implies for conversion rate (conceptual, educational)
  const multValue      = [1, 2, 4, 7, 9][segIdx]
  const impliedRate    = Math.min(convRate * multValue, 100)

  return (
    <div className="stl-root">
      {/* Header row */}
      <div className="stl-header">
        <span className="stl-eyebrow">Speed to Lead</span>
        <span className="stl-active-label" style={{ color: activeSegment.color }}>
          {paceSlider === 0 ? 'Not improved' : `Responding in ${activeSegment.label.toLowerCase()}`}
        </span>
      </div>

      {/* Track */}
      <div className="stl-track-wrap">
        {/* Gradient fill background */}
        <div className="stl-track-bg" />

        {/* Animated progress fill */}
        <motion.div
          className="stl-track-fill"
          animate={{ width: `${indicatorPct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />

        {/* Glowing indicator dot */}
        <motion.div
          className="stl-indicator"
          animate={{ left: `${indicatorPct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          style={{ '--dot-color': activeSegment.color } as React.CSSProperties}
        />

        {/* Segment dividers */}
        {[20, 40, 60, 80].map(p => (
          <div key={p} className="stl-divider" style={{ left: `${p}%` }} />
        ))}
      </div>

      {/* Labels row */}
      <div className="stl-labels">
        {SEGMENTS.map((seg, i) => (
          <div
            key={seg.label}
            className="stl-label-col"
            style={{ opacity: i === segIdx ? 1 : 0.4 }}
          >
            <span
              className="stl-mult"
              style={{ color: i <= segIdx ? seg.color : 'var(--color-text-dim)' }}
            >
              {seg.mult}
            </span>
            <span className="stl-seg-label">{seg.label}</span>
          </div>
        ))}
      </div>

      {/* Insight row */}
      {paceSlider > 0 && (
        <motion.div
          className="stl-insight"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="stl-insight-text">
            Industry benchmark: leads at this speed convert at{' '}
            <strong style={{ color: activeSegment.color }}>
              up to {impliedRate.toFixed(1)}%
            </strong>{' '}
            ({multValue}× your baseline)
          </span>
        </motion.div>
      )}
    </div>
  )
}
