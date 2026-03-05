export type LeadSource = 'email' | 'ads_meta' | 'ads_google' | 'referrals' | 'website' | 'other'
export type TemplatePillar = 'pace' | 'presence' | 'personalization'

export type TemplateConfig = {
  id:           string
  name:         string
  description:  string
  pillar:       TemplatePillar
  filename:     string
  lead_sources: LeadSource[]
}

export const templates: TemplateConfig[] = [
  {
    id: 'pace-email-qualifier',
    name: 'Email Lead Qualifier',
    description: 'Automatically qualifies inbound emails and responds within 60 seconds.',
    pillar: 'pace',
    filename: '5p-pace-email-qualifier.json',
    lead_sources: ['email', 'other'],
  },
  {
    id: 'pace-ads-meta',
    name: 'Meta Ads → Airtable Capture',
    description: 'Sends every Facebook/Instagram lead into Airtable and notifies you instantly.',
    pillar: 'pace',
    filename: '5p-pace-ads-meta.json',
    lead_sources: ['ads_meta'],
  },
  {
    id: 'pace-ads-google',
    name: 'Google Ads Form → Instant Notification',
    description: 'Captures form submissions from Google Ads and alerts you in under 60 seconds.',
    pillar: 'pace',
    filename: '5p-pace-ads-google.json',
    lead_sources: ['ads_google'],
  },
  {
    id: 'pace-referrals',
    name: 'Referral Acknowledgement + Booking Link',
    description: 'Sends an instant, personalised acknowledgement and booking link to every referral.',
    pillar: 'pace',
    filename: '5p-pace-referrals.json',
    lead_sources: ['referrals'],
  },
  {
    id: 'pace-website',
    name: 'Web Form → Instant Email Qualifier',
    description: 'Picks up website form submissions and qualifies them automatically via email.',
    pillar: 'pace',
    filename: '5p-pace-website.json',
    lead_sources: ['website'],
  },
  {
    id: 'presence-email',
    name: 'Out-of-Hours Auto-Reply',
    description: 'Responds to leads outside business hours so no enquiry goes unanswered.',
    pillar: 'presence',
    filename: '5p-presence-email.json',
    lead_sources: ['email', 'referrals', 'other'],
  },
  {
    id: 'presence-ads-meta',
    name: 'Messenger Auto-Response',
    description: 'Instantly responds to Facebook Messenger enquiries from your ads 24/7.',
    pillar: 'presence',
    filename: '5p-presence-ads-meta.json',
    lead_sources: ['ads_meta'],
  },
  {
    id: 'presence-website',
    name: 'Chat Widget Auto-Response',
    description: 'Keeps your website chat active around the clock with an AI-powered first response.',
    pillar: 'presence',
    filename: '5p-presence-website.json',
    lead_sources: ['website'],
  },
  {
    id: 'pace-followup',
    name: 'Automated Follow-Up Sequence',
    description: "Sends a 3-step follow-up to leads who haven't responded, so no lead goes cold.",
    pillar: 'pace',
    filename: '5p-pace-followup.json',
    lead_sources: ['email', 'website', 'referrals', 'other'],
  },
]

export function getTemplatesForSource(lead_source: LeadSource): TemplateConfig[] {
  return templates.filter(t => t.lead_sources.includes(lead_source))
}
