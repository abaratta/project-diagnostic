# Refactoring Brief: RAPID System → 5P System
## Instructions for Claude Code

Read this document completely before touching any code. This is a refactoring brief, not a new project. The app is already built. Your job is to change it according to these instructions while preserving the working infrastructure (Next.js, Zustand, React Flow, Framer Motion, global.css, API routes).

---

## 1. What this product now is

The product is a **lead conversion calculator and coaching tool** for small business owners. It has two parts:

**Part 1 — Free (DIY online, no account needed)**
The user audits their current lead performance, then uses interactive sliders to see how improving three specific variables changes their revenue. At the end, they can download Make automation templates — but only after leaving their email address.

**Part 2 — Paid (work with us)**
The deeper implementation layers (Personalization, Presence, Process design) are not self-serve. They require working directly with Profit AI Lab. The product sells this naturally by showing the user what's possible but not giving them the tools to do it alone.

---

## 2. The new framework — the 5 Ps

Replace every reference to "RAPID" and the R/A/P/I/D pillars with the **5P System** and the following pillars. Update all variable names, types, file names, copy, and UI labels accordingly.

| # | Pillar Key | Pillar Name | One-line description |
|---|-----------|-------------|----------------------|
| 1 | `performance` | Performance | Understand your current lead numbers and revenue baseline |
| 2 | `pace` | Pace | How fast you respond to a lead determines if you win or lose |
| 3 | `personalization` | Personalization | Tailored responses convert significantly better than generic ones |
| 4 | `presence` | Presence | Being available across channels and hours you currently aren't |
| 5 | `process` | Process | The end-to-end system that makes everything repeatable |

**Type changes:**
```ts
// OLD
type PillarKey = 'R' | 'A' | 'P' | 'I' | 'D'

// NEW
type PillarKey = 'performance' | 'pace' | 'personalization' | 'presence' | 'process'
```

---

## 3. The new user journey — screen by screen

Replace the existing screen flow entirely. The new flow has 4 screens.

---

### Screen 1 — Performance Audit (replaces Entry/Onboarding)

**Route:** `/` (keep same route)

**Purpose:** Capture the user's current lead performance numbers. This is the foundation for everything that follows — every calculation in the app uses these numbers.

**UI:** A clean single-page form with the following fields. Style as a card with the PAL dark theme. Label it "Step 1 of 2 — Your Performance Audit".

| Field | Type | Label | Notes |
|-------|------|-------|-------|
| `monthly_leads` | number input | "How many leads do you get per month?" | Required. Min 1. |
| `cost_per_lead` | number input | "What does each lead cost you? ($)" | Required. Min 0. Can be 0 if organic. |
| `current_conversion_rate` | slider 0–100 | "What % of leads become clients?" | Required. Display as X%. Default 10. |
| `revenue_per_client` | number input | "How much does each client pay you? ($)" | Required. Min 1. |
| `business_name` | text input | "Your business name (optional)" | Optional. Used in personalised copy. |
| `email` | email input | "Your email address" | Required. Explain why: "We'll send your results and templates here." |
| `lead_source` | select | "Where do most of your leads come from?" | Options: Email / Facebook or Instagram Ads / Google Ads / Referrals / Website / Other |

**Calculated and displayed live beneath the inputs (updates as user types):**

```
Current Monthly Revenue = monthly_leads × (current_conversion_rate / 100) × revenue_per_client
Current Monthly Lead Cost = monthly_leads × cost_per_lead
Monthly Profit from Leads = Current Monthly Revenue - Current Monthly Lead Cost
```

Show these three figures in a "Your current numbers" summary card that updates in real time using React state. Make the numbers large, bold, and in the PAL cyan colour.

**CTA:** "See How to Grow This →"

On submit: validate all required fields → save to Zustand store → navigate to `/simulator`.

**Do NOT navigate to `/dashboard` anymore. Remove or repurpose that route.**

---

### Screen 2 — The Simulator (new screen — core of the product)

**Route:** `/simulator` (new route)

**Purpose:** Show the user how improving three specific variables — Pace, Personalization, and Presence — changes their conversion rate and therefore their revenue. This is the emotional core of the product. It needs to feel interactive, visual, and immediate.

**Layout:** Two-column on desktop (sliders left, results right), single column on mobile (sliders top, results bottom).

---

#### Left panel — Three improvement sliders

Each slider represents one of the three improvable pillars. Display them stacked vertically with clear section headers.

**Slider 1 — Pace (Speed to Lead)**

```
Label: "Pace — How fast you respond"
Subtext: "Research shows leads contacted in under 5 minutes are 9× more likely to convert."
Slider: 0–100, label "Improvement: +X%"
Default: 0
Effect on conversion: +0.4% conversion rate per 10 points (max +4% at 100)
```

**Slider 2 — Personalization**

```
Label: "Personalization — How relevant your response is"
Subtext: "Personalised follow-up increases conversion by up to 20% compared to generic responses."
Slider: 0–100, label "Improvement: +X%"
Default: 0
Effect on conversion: +0.3% conversion rate per 10 points (max +3% at 100)
```

**Slider 3 — Presence**

```
Label: "Presence — How available you are"
Subtext: "Responding after hours and on multiple channels captures leads your competitors miss."
Slider: 0–100, label "Improvement: +X%"
Default: 0
Effect on conversion: +0.2% conversion rate per 10 points (max +2% at 100)
```

---

#### Right panel — Live results

All figures update in real time as sliders move. Use Framer Motion to animate number changes.

**Calculations:**

```ts
const improvedConversionRate =
  current_conversion_rate
  + (pace_slider / 10) * 0.4
  + (personalization_slider / 10) * 0.3
  + (presence_slider / 10) * 0.2

// Cap at 100%
const cappedConversionRate = Math.min(improvedConversionRate, 100)

const currentMonthlyRevenue =
  monthly_leads * (current_conversion_rate / 100) * revenue_per_client

const improvedMonthlyRevenue =
  monthly_leads * (cappedConversionRate / 100) * revenue_per_client

const monthlyGain = improvedMonthlyRevenue - currentMonthlyRevenue
const annualGain = monthlyGain * 12
```

**Display these four figures prominently:**

```
New Conversion Rate:    X.X%          (was Y%)
New Monthly Revenue:    $X,XXX        (was $Y,YYY)
Monthly Gain:           +$X,XXX
Annual Gain:            +$XX,XXX      ← Make this the biggest number on the page
```

Show a simple horizontal bar beneath "Conversion Rate" that fills from the current rate to the improved rate as sliders move. Use the PAL cyan-to-green gradient for the fill.

**Below the numbers, a dynamic label that changes based on which sliders are active:**

- All at 0: *"Move the sliders to see your growth potential."*
- Only Pace > 0: *"Responding faster alone could add $X/month."*
- Multiple active: *"Combining Pace + Personalization could add $X/month to your revenue."*

---

#### Below the two columns — The template offer

Once any slider is above 0, reveal this section with a Framer Motion fade-in:

```
Heading: "Ready to make this real?"
Subtext: "We've built the automation templates to implement exactly what you've modelled above.
          Enter your email to download them free."
```

**Email gate — if email was already entered on Screen 1, skip this and show the templates directly.**

If email not yet captured, show a single email input + "Send Me the Templates" button.

On email submit: save email to store → reveal the template cards below.

**Template cards** — show only the templates relevant to the user's `lead_source` selection from Screen 1:

| lead_source | Templates to show |
|-------------|-------------------|
| Email | Pace: Email qualifier scenario · Presence: Out-of-hours auto-reply scenario |
| Facebook or Instagram Ads | Pace: Ads → Airtable → instant notification scenario · Presence: Messenger auto-response scenario |
| Google Ads | Pace: Form → Airtable → instant notification scenario · Presence: SMS follow-up scenario |
| Referrals | Pace: Email acknowledgement + booking link scenario |
| Website | Pace: Web form → instant email qualifier scenario · Presence: Chat widget auto-response scenario |
| Other | Pace: Email qualifier scenario (generic) |

Each template card shows:
- Template name
- One-sentence description of what it does
- The pillar it addresses (Pace / Presence badge)
- A `Download Template` button

**Download behaviour:** triggers a JSON file download from `/public/templates/` (same mechanism as before). After download, show a small success state on the card: "✓ Downloaded".

---

#### Below the template cards — The upgrade prompt

Always visible below the templates (or below the slider section if templates not yet unlocked):

```
Heading: "Want Personalization, Presence, and a full Process system?"
Subtext: "The templates above get you started. But Personalization, Presence strategy,
          and Process design require a tailored approach — that's where we come in."

CTA button: "Book a Free Strategy Call"  → links to NEXT_PUBLIC_BOOKING_URL
```

Style this as a distinct section with a subtle border or background differentiation from the rest of the page. It should feel like a natural next step, not a hard sell.

---

### Screen 3 — Email Confirmation / Thank You (lightweight)

**Route:** `/thank-you` (new route)

**Purpose:** Confirm their email was captured, set expectations, give them something to do next.

**Content:**
```
Heading: "You're all set, [business_name or 'there']."
Body: "Your templates are ready to download above. We've also sent a copy to [email]."
      "If you want to go further — Personalization, Presence strategy, and a full
       Process design — that's what we do at Profit AI Lab."
CTA: "Book a Free Strategy Call" → NEXT_PUBLIC_BOOKING_URL
Secondary link: "← Back to your simulator"
```

**Note:** This screen is shown only if the user navigates away after email capture. The primary flow stays on `/simulator` — don't auto-redirect here.

---

### Screen 4 — Remove entirely

Remove `/pillar/[id]`, `/pillar/[id]/task/[tid]`, `/complete`, and `/dashboard`.

These screens no longer exist in this product. Delete the route files and their associated components.

---

## 4. Data model changes

### Replace `rapidProgress` with `fivePData`

Remove the old pillar progress tracking entirely. Replace with:

```ts
type LeadSource = 'email' | 'ads_meta' | 'ads_google' | 'referrals' | 'website' | 'other'

type PerformanceAudit = {
  business_name:           string | null
  email:                   string | null
  email_captured:          boolean
  monthly_leads:           number
  cost_per_lead:           number
  current_conversion_rate: number        // 0–100
  revenue_per_client:      number
  lead_source:             LeadSource | null
}

type SimulatorState = {
  pace_slider:             number        // 0–100, default 0
  personalization_slider:  number        // 0–100, default 0
  presence_slider:         number        // 0–100, default 0
  templates_unlocked:      boolean
  downloaded_templates:    string[]      // list of template filenames downloaded
}

type FivePStore = {
  audit:     PerformanceAudit
  simulator: SimulatorState
}
```

### Zustand store actions to implement

```ts
setAudit(data: Partial<PerformanceAudit>): void
captureEmail(email: string): void              // sets email + email_captured = true
setSlider(slider: 'pace' | 'personalization' | 'presence', value: number): void
unlockTemplates(): void                        // sets templates_unlocked = true
markTemplateDownloaded(filename: string): void // adds to downloaded_templates[]

// Selectors
getImprovedConversionRate(): number
getCurrentMonthlyRevenue(): number
getImprovedMonthlyRevenue(): number
getMonthlyGain(): number
getAnnualGain(): number
isAuditComplete(): boolean                    // all required fields filled
```

---

## 5. Template files to keep / rename

Keep all existing JSON files in `/public/templates/`. Rename them to reflect the new naming convention:

```
OLD NAME                          NEW NAME
rapid-r-email-none.json       →   5p-pace-email.json
rapid-r-email-hubspot.json    →   5p-pace-email-crm.json
rapid-a-email-none.json       →   5p-pace-email-qualifier.json
rapid-a-email-hubspot.json    →   5p-pace-email-qualifier-crm.json
rapid-p-email-none.json       →   5p-personalization-email.json
rapid-i-email-none.json       →   5p-presence-email.json
rapid-d-email-none.json       →   5p-pace-followup.json
rapid-d-email-hubspot.json    →   5p-pace-followup-crm.json
```

Add these new template placeholder files (empty `{}`) for the new lead sources:

```
5p-pace-ads-meta.json           — Ads → Airtable → instant notification
5p-presence-ads-meta.json       — Messenger auto-response
5p-pace-ads-google.json         — Form → Airtable → notification
5p-pace-referrals.json          — Email acknowledgement + booking link
5p-pace-website.json            — Web form → instant email qualifier
5p-presence-website.json        — Chat widget auto-response
```

---

## 6. Component changes

### Components to DELETE (no longer needed)

```
src/components/PillarCard.tsx
src/components/WorkflowDiagram.tsx      ← delete React Flow pillar diagrams
src/components/TaskRow.tsx
src/components/TaskDetail.tsx
src/components/TemplateDownload.tsx
src/components/ImpactSummary.tsx
src/components/AdvancedSpec.tsx
src/components/CompletionDiagram.tsx
src/components/ScoreCounter.tsx
```

### Components to BUILD (new)

```
src/components/AuditForm.tsx            — Screen 1 form with live revenue preview
src/components/RevenuePreview.tsx       — Live-updating current numbers card
src/components/SliderPanel.tsx          — Three improvement sliders (Pace, Personalization, Presence)
src/components/ResultsPanel.tsx         — Live revenue gain display
src/components/ConversionBar.tsx        — Animated bar: current → improved conversion rate
src/components/TemplateGate.tsx         — Email capture gate + template card reveal
src/components/TemplateCard.tsx         — Individual template card with download button
src/components/UpgradePrompt.tsx        — "Work with us" CTA section
src/components/GainLabel.tsx            — Dynamic label beneath sliders
```

### App header

Remove the `<ScoreCounter>` from the header. Replace with:
- Left: Profit AI Lab logo / wordmark
- Right: "Book a Call" link → `NEXT_PUBLIC_BOOKING_URL`

---

## 7. Static data files to change

### DELETE

```
src/data/pillars.ts       ← delete
src/data/tasks.ts         ← delete
src/data/diagrams.ts      ← delete (React Flow pillar configs no longer needed)
```

### REPLACE `src/data/templates.ts` entirely

```ts
// src/data/templates.ts

export type LeadSource = 'email' | 'ads_meta' | 'ads_google' | 'referrals' | 'website' | 'other'
export type TemplatePillar = 'pace' | 'presence' | 'personalization'

export type TemplateConfig = {
  id:          string
  name:        string
  description: string
  pillar:      TemplatePillar
  filename:    string
  lead_sources: LeadSource[]   // which lead sources this template is relevant for
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
    description: 'Sends a 3-step follow-up to leads who haven\'t responded, so no lead goes cold.',
    pillar: 'pace',
    filename: '5p-pace-followup.json',
    lead_sources: ['email', 'website', 'referrals', 'other'],
  },
]

// Helper: get templates relevant to a given lead source
export function getTemplatesForSource(lead_source: LeadSource): TemplateConfig[] {
  return templates.filter(t => t.lead_sources.includes(lead_source))
}
```

### CREATE `src/data/simulator.ts`

```ts
// src/data/simulator.ts
// Static config for the simulator sliders

export type SliderKey = 'pace' | 'personalization' | 'presence'

export type SliderConfig = {
  key:         SliderKey
  label:       string
  subtext:     string
  max_gain:    number     // maximum percentage points added to conversion rate at slider = 100
  gain_per_10: number     // percentage points added per 10 slider units
}

export const sliders: SliderConfig[] = [
  {
    key: 'pace',
    label: 'Pace — How fast you respond',
    subtext: 'Research shows leads contacted in under 5 minutes are 9× more likely to convert.',
    max_gain: 4,
    gain_per_10: 0.4,
  },
  {
    key: 'personalization',
    label: 'Personalization — How relevant your response is',
    subtext: 'Personalised follow-up increases conversion by up to 20% compared to generic responses.',
    max_gain: 3,
    gain_per_10: 0.3,
  },
  {
    key: 'presence',
    label: 'Presence — How available you are',
    subtext: 'Responding after hours and on multiple channels captures leads your competitors miss.',
    max_gain: 2,
    gain_per_10: 0.2,
  },
]
```

---

## 8. API route changes

### DELETE

```
app/api/personalise/route.ts    ← delete (no longer used)
```

### KEEP (unchanged)

```
app/api/spec/route.ts           ← keep as-is (Advanced toggle still exists if needed later)
```

### ADD

```
app/api/capture-email/route.ts
```

```ts
// app/api/capture-email/route.ts
// Receives email + audit data. In MVP: just saves to store (client-side).
// In Phase 2: POST to email marketing provider (e.g. MailerLite, ActiveCampaign).

// For MVP this route is optional — email capture can be handled entirely client-side
// in the Zustand store. Add this route only when integrating with an email provider.
```

---

## 9. Global CSS changes

Keep `src/styles/global.css` and the entire PAL design system intact. Add the following new utility classes:

```css
/* Slider styling */
.slider-track { ... }          /* custom range input styling */
.slider-thumb { ... }          /* cyan thumb */

/* Conversion bar */
.conversion-bar-bg { ... }     /* dark background bar */
.conversion-bar-fill { ... }   /* cyan-to-green gradient fill, animated width */

/* Template card */
.template-card { ... }         /* glassmorphism card */
.template-card-badge { ... }   /* Pace / Presence pill badge */
.template-card-downloaded { }  /* success state — green tick */

/* Gain display */
.gain-number-large { ... }     /* Annual gain — biggest number, cyan, bold */
.gain-number-medium { ... }    /* Monthly gain */
.gain-number-small { ... }     /* Conversion rate change */

/* Upgrade prompt */
.upgrade-prompt { ... }        /* distinct section — slightly lighter bg than page */
```

---

## 10. Environment variables

No changes to `.env.local`. Keep:

```
ANTHROPIC_API_KEY=           # Still used by /api/spec if Advanced toggle retained
NEXT_PUBLIC_BOOKING_URL=     # Used in UpgradePrompt and header
```

Add if integrating email provider in Phase 2:

```
EMAIL_PROVIDER_API_KEY=      # MailerLite / ActiveCampaign / etc.
EMAIL_LIST_ID=               # List to add captured emails to
```

---

## 11. Build order for the refactor

Do the changes in this order to avoid breaking the running app mid-refactor:

1. Update `src/store/useRapidStore.ts` — replace old types and actions with new `FivePStore` schema
2. Update `src/data/templates.ts` — replace with new template configs
3. Create `src/data/simulator.ts` — new slider configs
4. Delete old data files: `pillars.ts`, `tasks.ts`, `diagrams.ts`
5. Delete old components (list in Section 6)
6. Delete old routes: `/dashboard`, `/pillar`, `/complete`
7. Build new components in order: `RevenuePreview` → `AuditForm` → `SliderPanel` → `ResultsPanel` → `ConversionBar` → `GainLabel` → `TemplateCard` → `TemplateGate` → `UpgradePrompt`
8. Build `app/page.tsx` (Screen 1 — Performance Audit)
9. Build `app/simulator/page.tsx` (Screen 2 — The Simulator)
10. Build `app/thank-you/page.tsx` (Screen 3 — lightweight)
11. Update `app/layout.tsx` — new header (remove ScoreCounter, add Book a Call link)
12. Rename template files in `/public/templates/`
13. Add new placeholder template files
14. Run `npx tsc --noEmit` — fix any type errors
15. Run `npm run build` — fix any build errors

---

## 12. QA checklist for after the refactor

Run these before considering the refactor complete:

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — zero errors
- [ ] Screen 1: all fields validate correctly, live revenue preview updates on every keystroke
- [ ] Screen 2: all three sliders update the results panel in real time with no lag
- [ ] Screen 2: conversion bar animates smoothly as sliders move
- [ ] Screen 2: template section is hidden until any slider > 0
- [ ] Screen 2: email gate is skipped if email was entered on Screen 1
- [ ] Screen 2: templates shown match the user's selected `lead_source`
- [ ] Download: correct JSON file downloads for each template card
- [ ] Download: card shows success state after download
- [ ] Upgrade prompt: "Book a Free Strategy Call" links to `NEXT_PUBLIC_BOOKING_URL`
- [ ] Header: "Book a Call" link works
- [ ] No references to "RAPID", "pillar keys R/A/P/I/D", or old component names remain in the codebase
- [ ] Mobile layout: single column, sliders above results, all tap targets ≥ 44px
- [ ] All old routes (`/dashboard`, `/pillar/*`, `/complete`) return 404

---

## 13. What NOT to change

- `src/styles/global.css` design tokens and existing component classes — only ADD new classes
- `app/api/spec/route.ts` — leave untouched
- `public/icons/` — keep all SVG files
- `.claude/agents/` — keep all four agent files, they still apply
- `.env.local` structure — only add, don't remove
- Zustand `persist` middleware setup — keep localStorage persistence
- Next.js App Router structure — keep same routing pattern
- TypeScript strict mode — must remain on

---

## 14. Copy reference — key phrases to use throughout

Use this copy as the source of truth for labels, headings, and CTAs. Do not invent new copy.

| Location | Copy |
|----------|------|
| Screen 1 heading | "How many leads are you leaving on the table?" |
| Screen 1 subheading | "Complete your Performance audit to find out." |
| Screen 1 CTA | "See How to Grow This →" |
| Screen 2 heading | "Your Growth Simulator" |
| Screen 2 subheading | "Move the sliders to see how each improvement changes your revenue." |
| Annual gain label | "Additional Annual Revenue" |
| Monthly gain label | "Additional Monthly Revenue" |
| Template section heading | "Ready to make this real?" |
| Template section subtext | "We've built the Make automation templates to implement what you've modelled. Download them free." |
| Email gate label | "Enter your email to unlock your templates" |
| Email gate button | "Unlock My Templates" |
| Upgrade heading | "Want Personalization, Presence, and a full Process system?" |
| Upgrade subtext | "The templates above address Pace. Personalization, Presence strategy, and Process design require a tailored approach — that's what we do at Profit AI Lab." |
| Upgrade CTA | "Book a Free Strategy Call" |
| Header CTA | "Book a Call" |
| All sliders at 0 label | "Move the sliders to see your growth potential." |
| Only Pace active | "Responding faster alone could add $[monthlyGain]/month to your revenue." |
| Multiple sliders active | "Combining these improvements could add $[monthlyGain]/month — $[annualGain]/year." |

---

*5P System Refactoring Brief · Profit AI Lab · 2026*
