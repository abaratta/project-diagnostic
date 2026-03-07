'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LeadSource = 'email' | 'ads_meta' | 'ads_google' | 'referrals' | 'website' | 'dm' | 'other'

export type PerformanceAudit = {
  business_name:           string | null
  email:                   string | null
  email_captured:          boolean
  monthly_leads:           number
  ad_spend:                number        // total monthly ad spend (e.g. Google/Meta budget)
  current_conversion_rate: number        // 0–100
  revenue_per_client:      number
  lead_source:             LeadSource | null
  time_per_lead:           number        // hours per lead (qualify + follow-up), e.g. 0.5 = 30 min
  hourly_cost:             number        // $/hour for person managing leads
  lead_source_count:       number        // number of active lead sources (1–5+)
}

export type SimulatorState = {
  pace_slider:             number        // 0–100, default 0
  personalization_slider:  number        // 0–100, default 0
  presence_slider:         number        // 0–100, default 0
  automation_slider:       number        // 0–100, default 0
  templates_unlocked:      boolean
  downloaded_templates:    string[]
}

type FivePStore = {
  audit:     PerformanceAudit
  simulator: SimulatorState

  // Actions
  setAudit:                (data: Partial<PerformanceAudit>) => void
  captureEmail:            (email: string) => void
  setSlider:               (slider: 'pace' | 'personalization' | 'presence' | 'automation', value: number) => void
  unlockTemplates:         () => void
  markTemplateDownloaded:  (filename: string) => void

  // Selectors
  getImprovedConversionRate:     () => number
  getCurrentMonthlyRevenue:      () => number
  getImprovedMonthlyRevenue:     () => number
  getMonthlyGain:                () => number
  getAnnualGain:                 () => number
  getMonthlyLeadManagementCost:  () => number
  getMonthlyCostSavings:         () => number
  getTotalMonthlyBenefit:        () => number
  getTotalAnnualBenefit:         () => number
  isAuditComplete:               () => boolean
  isGateComplete:                () => boolean
}

const defaultAudit = (): PerformanceAudit => ({
  business_name:           null,
  email:                   null,
  email_captured:          false,
  monthly_leads:           0,
  ad_spend:                0,
  current_conversion_rate: 10,
  revenue_per_client:      0,
  lead_source:             null,
  time_per_lead:           0.5,
  hourly_cost:             0,
  lead_source_count:       1,
})

const defaultSimulator = (): SimulatorState => ({
  pace_slider:            0,
  personalization_slider: 0,
  presence_slider:        0,
  automation_slider:      0,
  templates_unlocked:     false,
  downloaded_templates:   [],
})

export const useFivePStore = create<FivePStore>()(
  persist(
    (set, get) => ({
      audit:     defaultAudit(),
      simulator: defaultSimulator(),

      setAudit: (data) =>
        set((state) => ({ audit: { ...state.audit, ...data } })),

      captureEmail: (email) =>
        set((state) => ({
          audit: { ...state.audit, email, email_captured: true },
          simulator: { ...state.simulator, templates_unlocked: true },
        })),

      setSlider: (slider, value) =>
        set((state) => ({
          simulator: { ...state.simulator, [`${slider}_slider`]: value },
        })),

      unlockTemplates: () =>
        set((state) => ({
          simulator: { ...state.simulator, templates_unlocked: true },
        })),

      markTemplateDownloaded: (filename) =>
        set((state) => ({
          simulator: {
            ...state.simulator,
            downloaded_templates: state.simulator.downloaded_templates.includes(filename)
              ? state.simulator.downloaded_templates
              : [...state.simulator.downloaded_templates, filename],
          },
        })),

      getImprovedConversionRate: () => {
        const { audit, simulator } = get()
        const improved =
          audit.current_conversion_rate +
          (simulator.pace_slider / 10) * 0.4 +
          (simulator.personalization_slider / 10) * 0.3 +
          (simulator.presence_slider / 10) * 0.2
        return Math.min(improved, 100)
      },

      getCurrentMonthlyRevenue: () => {
        const { audit } = get()
        return audit.monthly_leads * (audit.current_conversion_rate / 100) * audit.revenue_per_client
      },

      getImprovedMonthlyRevenue: () => {
        const { audit } = get()
        return audit.monthly_leads * (get().getImprovedConversionRate() / 100) * audit.revenue_per_client
      },

      getMonthlyGain: () =>
        get().getImprovedMonthlyRevenue() - get().getCurrentMonthlyRevenue(),

      getAnnualGain: () =>
        get().getMonthlyGain() * 12,

      // Time × hourly rate × lead volume = what managing leads costs per month
      getMonthlyLeadManagementCost: () => {
        const { audit } = get()
        return audit.monthly_leads * audit.time_per_lead * audit.hourly_cost
      },

      // Automation slider % of lead management cost recovered
      getMonthlyCostSavings: () => {
        const { simulator } = get()
        return (simulator.automation_slider / 100) * get().getMonthlyLeadManagementCost()
      },

      getTotalMonthlyBenefit: () =>
        get().getMonthlyGain() + get().getMonthlyCostSavings(),

      getTotalAnnualBenefit: () =>
        get().getTotalMonthlyBenefit() * 12,

      isAuditComplete: () => {
        const { audit } = get()
        return !!(
          audit.monthly_leads > 0 &&
          audit.revenue_per_client > 0 &&
          audit.lead_source
        )
      },

      isGateComplete: () => {
        return get().audit.email_captured
      },
    }),
    {
      name: '5p-system-storage',
      version: 2,
    }
  )
)
