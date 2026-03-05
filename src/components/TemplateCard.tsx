'use client'

import { useState } from 'react'
import { useFivePStore } from '@/store/useFivePStore'
import type { TemplateConfig } from '@/data/templates'

type Props = {
  template: TemplateConfig
}

const BADGE_CLASS: Record<string, string> = {
  pace:            'template-card-badge template-card-badge--pace',
  presence:        'template-card-badge template-card-badge--presence',
  personalization: 'template-card-badge template-card-badge--personalization',
}

const BADGE_LABEL: Record<string, string> = {
  pace:            'Pace',
  presence:        'Presence',
  personalization: 'Personalization',
}

export function TemplateCard({ template }: Props) {
  const markTemplateDownloaded = useFivePStore(s => s.markTemplateDownloaded)
  const downloadedTemplates    = useFivePStore(s => s.simulator.downloaded_templates)
  const [downloading, setDownloading] = useState(false)

  const isDownloaded = downloadedTemplates.includes(template.filename)

  async function handleDownload() {
    if (downloading) return
    setDownloading(true)
    try {
      const res  = await fetch(`/templates/${template.filename}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = template.filename
      a.click()
      URL.revokeObjectURL(url)
      markTemplateDownloaded(template.filename)
    } catch {
      // silent fail
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="template-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div className="stack stack--sm" style={{ flex: 1 }}>
          <span className={BADGE_CLASS[template.pillar]}>
            {BADGE_LABEL[template.pillar]}
          </span>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem' }}>
            {template.name}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 0 }}>
            {template.description}
          </p>
        </div>
      </div>
      <div>
        {isDownloaded ? (
          <span className="template-card-downloaded">✓ Downloaded</span>
        ) : (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn btn--secondary btn--sm"
          >
            {downloading ? 'Preparing…' : 'Download Template'}
          </button>
        )}
      </div>
    </div>
  )
}
