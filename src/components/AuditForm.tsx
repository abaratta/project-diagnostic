'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFivePStore } from '@/store/useFivePStore'
import type { LeadSource } from '@/store/useFivePStore'

const LEAD_SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'email',      label: 'Email campaigns' },
  { value: 'ads_meta',   label: 'Facebook / Instagram Ads' },
  { value: 'ads_google', label: 'Google Ads' },
  { value: 'referrals',  label: 'Referrals' },
  { value: 'website',    label: 'Website / organic' },
  { value: 'other',      label: 'Other' },
]

const HINTS = {
  monthlyLeads:    'New enquiries, sign-ups, or contacts per month across all channels.',
  revenuePerClient:'Total revenue (or lifetime value) from a single client engagement.',
  conversionRate:  'Out of 100 leads, how many become paying clients? Industry avg: 5–15%.',
  costPerLead:     'Ad or marketing spend per lead. Enter 0 for organic (SEO, referrals).',
  leadSource:      'Helps us recommend the right follow-up templates for your channel.',
  timePerLead:     'Total time per lead to qualify and follow up — all calls, emails, texts.',
  hourlyCost:      'Your hourly rate or your employee\'s. Calculates the true time cost of managing leads.',
  email:           'Optional — we\'ll send your personalised templates and growth report here.',
}

function formatMins(mins: number) {
  if (mins === 0) return '0 min'
  if (mins < 60)  return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export function AuditForm() {
  const router       = useRouter()
  const setAudit     = useFivePStore(s => s.setAudit)
  const captureEmail = useFivePStore(s => s.captureEmail)
  const storedAudit  = useFivePStore(s => s.audit)

  const [businessName,     setBusinessName]     = useState(storedAudit.business_name ?? '')
  const [email,            setEmail]            = useState(storedAudit.email ?? '')
  const [monthlyLeads,     setMonthlyLeads]     = useState(storedAudit.monthly_leads > 0 ? String(storedAudit.monthly_leads) : '')
  const [costPerLead,      setCostPerLead]      = useState(storedAudit.cost_per_lead > 0 ? String(storedAudit.cost_per_lead) : '')
  const [conversionRate,   setConversionRate]   = useState(storedAudit.current_conversion_rate)
  const [revenuePerClient, setRevenuePerClient] = useState(storedAudit.revenue_per_client > 0 ? String(storedAudit.revenue_per_client) : '')
  const [leadSource,       setLeadSource]       = useState<LeadSource | ''>(storedAudit.lead_source ?? '')
  const [timePerLeadMins,  setTimePerLeadMins]  = useState(Math.round(storedAudit.time_per_lead * 60) || 30)
  const [hourlyCost,       setHourlyCost]       = useState(storedAudit.hourly_cost > 0 ? String(storedAudit.hourly_cost) : '')
  const [errors,           setErrors]           = useState<Record<string, string>>({})

  useEffect(() => {
    setAudit({
      business_name:           businessName || null,
      monthly_leads:           Math.max(0, Number(monthlyLeads) || 0),
      cost_per_lead:           Math.max(0, Number(costPerLead) || 0),
      current_conversion_rate: conversionRate,
      revenue_per_client:      Math.max(0, Number(revenuePerClient) || 0),
      lead_source:             (leadSource as LeadSource) || null,
      time_per_lead:           timePerLeadMins / 60,
      hourly_cost:             Math.max(0, Number(hourlyCost) || 0),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, monthlyLeads, costPerLead, conversionRate, revenuePerClient, leadSource, timePerLeadMins, hourlyCost])

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!monthlyLeads || Number(monthlyLeads) < 1)         errs.monthlyLeads     = 'Enter at least 1 lead per month'
    if (costPerLead === '')                                  errs.costPerLead      = 'Enter cost per lead (0 if organic)'
    if (Number(costPerLead) < 0)                            errs.costPerLead      = 'Cannot be negative'
    if (!revenuePerClient || Number(revenuePerClient) < 1)  errs.revenuePerClient = 'Enter your revenue per client'
    if (!leadSource)                                         errs.leadSource       = 'Select your primary lead source'
    return errs
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (email && email.includes('@')) captureEmail(email)
    router.push('/simulator')
  }

  return (
    <form id="audit-form" onSubmit={handleSubmit} noValidate className="stack stack--md">

      {/* Page header */}
      <div style={{ paddingBottom: '0.625rem', borderBottom: '1px solid var(--color-border)' }}>
        <div className="section-header__eyebrow" style={{ marginBottom: '0.25rem' }}>Step 1 of 2</div>
        <h2 style={{ fontSize: '1.375rem', marginBottom: '0.2rem' }}>Performance Audit</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Tell us about your current lead flow — we'll show you exactly what's possible.
        </p>
      </div>

      {/* ── SECTION 1: Revenue ── */}
      <div className="form-section">
        <div className="form-section__header">
          <span className="form-section__icon">💰</span>
          <span className="form-section__title form-section__title--revenue">Revenue</span>
        </div>

        <div className="form-grid-2">
          <div className="form-group--sm">
            <label className="form-label" htmlFor="monthlyLeads">Monthly leads *</label>
            <input
              id="monthlyLeads" type="number" min="1"
              className="form-input form-input--sm"
              placeholder="e.g. 30"
              value={monthlyLeads}
              onChange={e => { setMonthlyLeads(e.target.value); setErrors(p => ({ ...p, monthlyLeads: '' })) }}
            />
            <span className="form-hint">{HINTS.monthlyLeads}</span>
            {errors.monthlyLeads && <span className="form-error">{errors.monthlyLeads}</span>}
          </div>
          <div className="form-group--sm">
            <label className="form-label" htmlFor="revenuePerClient">Revenue per client ($) *</label>
            <input
              id="revenuePerClient" type="number" min="1"
              className="form-input form-input--sm"
              placeholder="e.g. 2,500"
              value={revenuePerClient}
              onChange={e => { setRevenuePerClient(e.target.value); setErrors(p => ({ ...p, revenuePerClient: '' })) }}
            />
            <span className="form-hint">{HINTS.revenuePerClient}</span>
            {errors.revenuePerClient && <span className="form-error">{errors.revenuePerClient}</span>}
          </div>
        </div>

        <div className="form-group--sm">
          <label className="form-label" htmlFor="conversionRate">
            Conversion rate —{' '}
            <strong style={{ color: 'var(--color-accent-cyan)' }}>{conversionRate}%</strong>
          </label>
          <input
            id="conversionRate" type="range" min="0" max="100"
            className="slider-input"
            value={conversionRate}
            onChange={e => setConversionRate(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="form-hint">0%</span>
            <span className="form-hint" style={{ textAlign: 'center', flex: 1, padding: '0 0.5rem' }}>{HINTS.conversionRate}</span>
            <span className="form-hint">100%</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Costs ── */}
      <div className="form-section">
        <div className="form-section__header">
          <span className="form-section__icon">⏱</span>
          <span className="form-section__title form-section__title--costs">Costs</span>
        </div>

        <div className="form-grid-2">
          <div className="form-group--sm">
            <label className="form-label" htmlFor="costPerLead">Cost per lead ($) *</label>
            <input
              id="costPerLead" type="number" min="0"
              className="form-input form-input--sm"
              placeholder="0 if organic"
              value={costPerLead}
              onChange={e => { setCostPerLead(e.target.value); setErrors(p => ({ ...p, costPerLead: '' })) }}
            />
            <span className="form-hint">{HINTS.costPerLead}</span>
            {errors.costPerLead && <span className="form-error">{errors.costPerLead}</span>}
          </div>
          <div className="form-group--sm">
            <label className="form-label" htmlFor="hourlyCost">Hourly rate ($)</label>
            <input
              id="hourlyCost" type="number" min="0"
              className="form-input form-input--sm"
              placeholder="e.g. 50"
              value={hourlyCost}
              onChange={e => setHourlyCost(e.target.value)}
            />
            <span className="form-hint">{HINTS.hourlyCost}</span>
          </div>
        </div>

        <div className="form-group--sm">
          <label className="form-label" htmlFor="timePerLead">
            Time per lead —{' '}
            <strong style={{ color: 'var(--color-accent-cyan)' }}>{formatMins(timePerLeadMins)}</strong>
          </label>
          <input
            id="timePerLead" type="range" min="0" max="240" step="15"
            className="slider-input"
            value={timePerLeadMins}
            onChange={e => setTimePerLeadMins(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="form-hint">0 min</span>
            <span className="form-hint" style={{ textAlign: 'center', flex: 1, padding: '0 0.5rem' }}>{HINTS.timePerLead}</span>
            <span className="form-hint">4 h</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: About you ── */}
      <div className="form-section">
        <div className="form-section__header">
          <span className="form-section__icon">🏢</span>
          <span className="form-section__title form-section__title--about">About you</span>
        </div>

        <div className="form-grid-2">
          <div className="form-group--sm">
            <label className="form-label" htmlFor="leadSource">Lead source *</label>
            <select
              id="leadSource"
              className="form-select form-select--sm"
              value={leadSource}
              onChange={e => { setLeadSource(e.target.value as LeadSource); setErrors(p => ({ ...p, leadSource: '' })) }}
            >
              <option value="">Select…</option>
              {LEAD_SOURCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="form-hint">{HINTS.leadSource}</span>
            {errors.leadSource && <span className="form-error">{errors.leadSource}</span>}
          </div>
          <div className="form-group--sm">
            <label className="form-label" htmlFor="businessName">
              Business name <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="businessName" type="text"
              className="form-input form-input--sm"
              placeholder="e.g. Apex Plumbing"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group--sm">
          <label className="form-label" htmlFor="email">
            Email <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="email" type="email"
            className="form-input form-input--sm"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <span className="form-hint">{HINTS.email}</span>
        </div>
      </div>

    </form>
  )
}
