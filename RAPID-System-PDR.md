# RAPID System
## Product Design & Requirements Document

**Version:** 1.1
**Date:** 2026-03-01
**Status:** In Development
**Brand:** Profit AI Lab

---

## ⚡ CLAUDE CODE — READ THIS FIRST

This document is the single source of truth for building the RAPID System. Before writing any code, read this entire document. Then follow the instructions in this section exactly.

---

### Step 1 — Initialise the project

```bash
npx create-next-app@latest . \
  --typescript \
  --eslint \
  --no-tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

npm install zustand framer-motion reactflow @anthropic-ai/sdk html-to-image
```

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your_key_here
NEXT_PUBLIC_BOOKING_URL=your_calendly_or_booking_url
```

---

### Step 2 — Spawn the agent team

Before building any features, create the following agent definition files. These define the specialist roles that collaborate on this project. Claude Code will use these to stay in role when working on each area.

Create the directory and files:

```
.claude/
  agents/
    frontend.md
    backend.md
    ux.md
    qa.md
```

---

**`.claude/agents/frontend.md`**

```markdown
# Frontend Agent

## Role
You are the Frontend Engineer for the RAPID System. You build React components,
manage client-side state, and implement the UI exactly as specified in the PDR.

## Responsibilities
- Build all components listed in the File Structure (Section 13)
- Implement React Flow diagrams using static configs from src/data/diagrams.ts
- Wire Zustand store (useRapidStore.ts) to all components
- Implement Framer Motion animations: score counter, pillar unlock reveal, progress bar
- Implement html-to-image diagram PNG export on Pillar View
- Handle CRM toggle: swap diagram config and template filename, re-render diagram

## Rules
- Use ONLY CSS custom properties from src/styles/global.css — no inline styles, no Tailwind
- All components are TypeScript with strict types — no `any`
- Default to `'use client'` unless the component has zero interactivity
- Never call the Anthropic API directly — always go through /api/ routes
- Mobile first — every component must work at 375px minimum width
- Never use localStorage directly — always read/write through Zustand store actions

## Brand (Profit AI Lab)
- Background: #0A0F1E
- Accent cyan: #00D4FF
- Accent green: #00FF88
- Body text: #E0E6F0
- Muted text: #8892A4
- Cards: rgba(255,255,255,0.04) with backdrop-filter: blur(12px)
- Fonts: 'Exo 2' (headings), 'Outfit' (body), 'DM Mono' (code)
- Border radius: 12px (cards), 8px (buttons), 6px (inputs)
```

---

**`.claude/agents/backend.md`**

```markdown
# Backend Agent

## Role
You are the Backend Engineer for the RAPID System. You build Next.js API routes
and all server-side logic.

## Responsibilities
- Build and maintain all API routes in app/api/
- Implement Anthropic SDK calls for /api/personalise and /api/spec
- Ensure ANTHROPIC_API_KEY is never exposed to the client
- Implement error handling and timeouts on all Claude API calls
- Validate all incoming request bodies before passing to Claude

## API Routes

### POST /api/personalise
- Input: { pillar, business_name, monthly_leads, avg_deal_value, channel }
- Model: claude-haiku-4-5-20251001 (fast + cheap — simple copy task)
- Timeout: 3000ms — return { copy: null } on timeout so frontend falls back silently
- Returns: { copy: string | null }

### POST /api/spec
- Input: { task_name, task_description, pillar, channel }
- Model: claude-opus-4-6 (quality matters here)
- No hard timeout — can take 10–20s; frontend shows spinner
- Returns: { prompt_template, skill_md, input_schema, output_schema, estimated_daily_cost_usd }

## Rules
- All routes use Next.js App Router route handlers (route.ts)
- Always return proper HTTP status codes and consistent JSON shapes
- Never log request bodies containing user data
- Wrap all Anthropic calls in try/catch — return clean JSON error, never a raw 500
- ANTHROPIC_API_KEY must only be referenced inside app/api/ — never imported elsewhere
```

---

**`.claude/agents/ux.md`**

```markdown
# UX Agent

## Role
You are the UX Expert for the RAPID System. You review every screen for clarity,
conversion, and usability. You speak on behalf of the primary user: a non-technical
small business owner who is time-poor and not confident with technology.

## Responsibilities
- Review each screen against the user journey in Section 7 of the PDR
- Ensure every screen has a single clear primary action — no decision paralysis
- Audit all copy for plain English — flag any technical jargon
- Verify the RAPID Score is always visible after onboarding
- Check that locked pillars communicate clearly why they're locked and what unlocks them
- Verify revenue impact figures are shown in $ with monthly AND annual figures
- Ensure error states are friendly — no raw error messages ever shown
- Confirm the Done-For-You CTA is the most visually prominent element on the completion screen

## UX Principles
- Every screen must answer: "what do I do next?" — if it doesn't, flag it
- Progress must always be visible — the user must never wonder how far they are
- Numbers must feel real — use the user's actual lead volume and deal value everywhere
- The product feels like a coach, not a tool — warm, directive, outcome-focused
- Mobile first — validate every layout at 375px, 768px, 1280px

## Review Checklist (run before marking any screen complete)
- [ ] Single primary CTA visible without scrolling on mobile
- [ ] RAPID Score visible in header or hero
- [ ] Revenue impact shown with $ figures (not %)
- [ ] No jargon (flag words: schema, webhook, API, node, pipeline, endpoint)
- [ ] Locked state is clear and non-frustrating
- [ ] Error state is friendly and tells the user what to do next
- [ ] Loading state exists for every async operation
- [ ] Completion/success states feel rewarding
```

---

**`.claude/agents/qa.md`**

```markdown
# QA Agent

## Role
You are the QA Engineer for the RAPID System. You run pre-deployment checks
across the entire codebase and block deployment if critical issues exist.

## Pre-Deployment Commands
Run all three — all must pass with zero errors:

```bash
npx tsc --noEmit
npm run build
npm run lint
```

## Manual Checks

### Files
- [ ] All 8 template JSON files exist in public/templates/
- [ ] Template manifest in src/data/templates.ts references only files that exist
- [ ] All 10 diagram configs exist in src/data/diagrams.ts (5 pillars × 2 variants)
- [ ] .env.local exists and is listed in .gitignore

### Code Quality
- [ ] Zero `any` types in the codebase
- [ ] Zero inline styles in any component (all styling via global.css)
- [ ] Zero direct localStorage calls outside src/store/useRapidStore.ts
- [ ] Zero console.log statements in production code
- [ ] No hardcoded API keys anywhere in src/ or app/

### Security
- [ ] ANTHROPIC_API_KEY only referenced inside app/api/ routes
- [ ] ANTHROPIC_API_KEY not present in any client bundle

### Responsiveness
- [ ] No fixed pixel widths above 375px outside a media query
- [ ] All interactive elements are tap-friendly on mobile (min 44px touch target)

## Blocking Issues (do not deploy if any exist)
- TypeScript errors
- Build errors
- API key exposed in client code
- Missing template files referenced in manifest
- Direct localStorage calls outside Zustand store
- Zero test of the download flow end-to-end
```

---

### Step 3 — Build order

Follow this sequence exactly. Do not skip ahead. Each phase depends on the previous.

**Phase 1 — Foundation (build these first, in order)**
1. `src/styles/global.css` — full PAL design system (CSS variables, typography, utility classes, component classes)
2. `src/data/pillars.ts` — all 5 pillar configs with static diagnostic copy
3. `src/data/tasks.ts` — all task configs with checklist steps
4. `src/data/diagrams.ts` — React Flow node/edge configs (all 10 variants)
5. `src/data/templates.ts` — template manifest + `getTemplate()` helper
6. `src/store/useRapidStore.ts` — Zustand store with all actions and selectors
7. Placeholder JSON files in `public/templates/` (empty `{}` for now — real files added before launch)

**Phase 2 — Screens (build in order)**
8. `app/page.tsx` — Entry / onboarding screen
9. `app/dashboard/page.tsx` — RAPID Roadmap
10. `app/pillar/[id]/page.tsx` — Pillar View
11. `app/pillar/[id]/task/[tid]/page.tsx` — Task Detail
12. `app/complete/page.tsx` — Completion screen

**Phase 3 — API & AI**
13. `app/api/personalise/route.ts`
14. `app/api/spec/route.ts`
15. Wire personalisation into Pillar View (progressive enhancement — silent swap)
16. Wire spec generation into Advanced toggle on Task Detail

**Phase 4 — QA**
17. Run QA agent full checklist
18. Fix all blocking issues
19. Final `npm run build` — must be zero errors

---

### Step 4 — Opening prompt

When you open Claude Code in the project folder, paste this as your very first message:

> Read RAPID-System-PDR.md completely from top to bottom before doing anything else.
> This is a greenfield Next.js 14 project — do not reference any external codebase.
> Follow the build order in the Claude Code section exactly.
> First, create the .claude/agents/ directory and all four agent files.
> Then begin Phase 1 with global.css.
> If anything in the PDR is ambiguous, ask me before making assumptions.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [The RAPID Framework](#3-the-rapid-framework)
4. [Goals & Success Criteria](#4-goals--success-criteria)
5. [User Personas](#5-user-personas)
6. [Product Overview](#6-product-overview)
7. [User Journey](#7-user-journey)
8. [Template Library](#8-template-library)
9. [Visual Workflow Diagrams](#9-visual-workflow-diagrams)
10. [Feature Specifications](#10-feature-specifications)
11. [Data Model](#11-data-model)
12. [AI Usage](#12-ai-usage)
13. [Tech Stack & Architecture](#13-tech-stack--architecture)
14. [Screens Summary](#14-screens-summary)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [MVP Build Plan](#16-mvp-build-plan)
17. [Acceptance Criteria](#17-acceptance-criteria)

---

## 1. Executive Summary

**RAPID System** is a guided lead conversion implementation product built for small business owners. It helps businesses diagnose, build, and activate their lead conversion system using a proprietary 5-pillar framework: **Reach, Act, Personalise, Instant, Drive**.

The product is structured as a self-guided web application (Mode 1) that walks the user through each RAPID pillar step by step — diagnosing their current state, showing the cost of their gaps, and deploying pre-built Make automation templates to fix them. A second mode (AI Coach / Mode 2) is planned for V2.

Unlike generic automation builders, RAPID System is positioned as a **process and system implementation coach**. The automation is the engine, not the product. The product is a working lead conversion system that a small business owner can understand, implement, and own.

---

## 2. Problem Statement

Small business owners lose leads every day not because they have a bad offer, but because their lead conversion process is broken. They respond too slowly, they follow up inconsistently, they treat every lead the same, and they disappear outside business hours.

The result: competitors who respond faster win the client, not the business with the better service.

Existing solutions either sell generic automation tools (too technical, no business context) or expensive consulting engagements (too slow, too costly). There is no product that combines a clear diagnostic, a named implementation system, and ready-to-deploy automation templates in a single guided experience.

**RAPID System solves this** by giving any small business owner a step-by-step path from broken lead process to fully automated conversion system — in a single session, without technical knowledge.

---

## 3. The RAPID Framework

RAPID is a proprietary 5-pillar methodology developed by Profit AI Lab for lead conversion. Each pillar maps to a specific failure point in the typical small business lead process.

| Letter | Pillar | What it means |
|--------|--------|---------------|
| **R** | Reach | Capture attention across every channel instantly |
| **A** | Act | Respond before your competitor does — in seconds |
| **P** | Personalise | Tailor every message to their specific situation |
| **I** | Instant | Be available 24/7 without being online 24/7 |
| **D** | Drive | Follow up automatically until they decide |

The 5 pillars are implemented sequentially as modules within the product. Each module contains a diagnostic, a process breakdown, automation templates, and a completion checklist. A user's **RAPID Score (0–5)** tracks their implementation progress.

---

## 4. Goals & Success Criteria

### Goals

- Allow any small business owner to self-diagnose their lead conversion gaps in under 3 minutes
- Guide them through implementing one RAPID pillar at a time with zero technical knowledge required
- Deliver pre-built Make scenario templates that match their specific setup (channel + CRM)
- Generate a visual workflow diagram per pillar that they can share with their team
- Produce a RAPID Score that gamifies implementation progress and drives completion
- Act as a top-of-funnel qualifier for Profit AI Lab's done-for-you services

### Success Criteria

| Metric | Target |
|--------|--------|
| Time to first RAPID Score | < 3 minutes from landing |
| Pillar completion rate | > 60% complete at least 1 pillar in session |
| Template download rate | > 40% of users who complete a pillar download the template |
| Upgrade CTA click rate | > 15% of completed users click Done-For-You CTA |
| Score to services conversion | Tracked via booking CTA on completion screen |

---

## 5. User Personas

### Primary — The Overwhelmed Owner

A small business owner with 5–50 leads per month who knows they're losing deals but doesn't know why or how to fix it. Not technical. Values speed and simplicity. Wants something that works, not something to configure. They enter via the RAPID Audit, already knowing their score.

### Secondary — The Growth-Focused Operator

A sales or ops manager at a small-to-medium business who is actively looking for automation tools. Has tried Make or Zapier but abandoned them. Wants a structured system, not a blank canvas. More likely to explore all 5 pillars and download multiple templates.

### Tertiary — The Consultant / Agency

An AI or automation consultant who uses RAPID System as an intake and delivery tool for clients. Needs white-label potential (V2). Uses the visual workflow diagrams as client-facing deliverables. Interested in Mode 2 (AI Coach) for scaling delivery.

---

## 6. Product Overview

### Core Concept

The product is structured around the 5 RAPID pillars as fixed modules. It is pre-configured for a single outcome: a working lead conversion system. There is no URL analysis, no generic process generation, no blank canvas.

```
Entry → RAPID Audit score (pre-loaded) or 3-question onboarding
     ↓
RAPID Roadmap Dashboard → 5 pillars, live score, revenue impact
     ↓
Pillar View → Diagnostic + process breakdown + visual workflow + template download
     ↓
Task Detail → Plain-English setup checklist (optional drill-down)
     ↓
Implementation Confirmation → Mark done, score updates, next pillar unlocks
     ↓
Completion Screen → Full system diagram, total savings, Done-For-You CTA
```

### Mode 1 vs Mode 2

| Mode | Description |
|------|-------------|
| **Mode 1 — Self-Guided (this PDR)** | Web app. User navigates screens independently. Pillar by pillar. Template downloads. Completion tracking. |
| **Mode 2 — AI Coach (V2)** | Conversational AI interface. Same RAPID content delivered via Claude chat. Adaptive to the user's situation. Escalates to Done-For-You services. |

---

## 7. User Journey

### Screen 1 — Entry

The user arrives from one of two paths:

- **From the RAPID Audit:** score is pre-loaded via `?score=2` query param. The screen shows results immediately: *"You scored 2/5. Your biggest gaps are Speed and Drive. Here is your implementation roadmap."*
- **Direct entry:** 3-question onboarding — monthly lead volume, primary channel, average deal value.

Single CTA: **"Build My RAPID System."** No dashboard yet. No exploration. Forward momentum only.

---

### Screen 2 — RAPID Roadmap (Dashboard)

The user's home base throughout the journey. Five pillars displayed as a vertical roadmap with:

- Pillar name, icon, one-line description
- Status badge: `Not Started` / `In Progress` / `Complete`
- Revenue impact estimate per pillar (calculated from their lead volume and deal value)
- **RAPID Score (0–5)** as a hero metric with progress bar

Pillar **R (Reach)** is unlocked on arrival. Pillars A, P, I, D are visible but locked. Each unlocks in sequence.

---

### Screen 3 — Pillar View

Clicking an unlocked pillar opens a focused single-page experience with three sections:

#### Section A — The Problem (personalised)

A stat block showing their situation vs. the benchmark. Example for Pillar A (Act):

> *"You respond to leads within a few hours. Leads contacted within 5 minutes are 9x more likely to convert. With your lead volume and deal value, you may be leaving $X/month on the table."*

Static copy shown by default. If `/api/personalise` returns within 3 seconds, static copy is silently replaced. No spinner for this — it's a background enhancement.

#### Section B — The Process Breakdown

A table showing 3–4 pre-built tasks that fix this pillar. Each row: task name, current weekly hours, post-automation hours, annual saving. All static data — no AI generation at runtime.

**Cost formula:** `annual_saving = hours_per_week_saved × hourly_rate × 52`
Default `hourly_rate = avg_deal_value / 10` if not explicitly set.

#### Section C — The Automation

A React Flow diagram showing exactly what gets built. Each node: app logo + one-line action. Below the diagram:

- **Primary CTA:** `Download Make Template` — downloads matching JSON from `/public/templates/`
- **Toggle:** `Add CRM Sync` — swaps diagram and template to CRM variant
- CRM selector (shown only when toggle active): HubSpot / Pipedrive / Airtable / GoHighLevel / None

---

### Screen 4 — Task Detail (optional drill-down)

Clicking a task opens a detail view:

- What this task does (2 sentences, plain English)
- What the AI handles (bullet list)
- What you still decide (human-in-the-loop items)
- Setup checklist (3–6 checkable steps, persisted in Zustand)
- Time to implement estimate
- **Advanced toggle** (hidden by default): triggers `/api/spec`, shows prompt template + skill.md + schema + cost

---

### Screen 5 — Implementation Confirmation

User clicks **"Mark as Implemented"** after completing the checklist:

- Pillar status → `complete`, RAPID Score increments
- Framer Motion: counter animates up, pillar card turns green, progress bar fills
- Impact summary shown: *"With Act live, you've recovered X hrs/week and $Y/year. 4 pillars to go."*
- Next pillar reveals with animation

---

### Screen 6 — Completion Screen

All 5 pillars complete:

- Master React Flow diagram showing all 5 pillar workflows connected
- Total numbers: hours/week saved, annual saving, monthly revenue recovered
- **Done-For-You CTA** (most prominent element): *"Want us to review your setup and optimise it for your industry?"* — links to `NEXT_PUBLIC_BOOKING_URL`
- Mode 2 teaser: *"Prefer to be guided by AI? RAPID Coach — coming soon."*

---

## 8. Template Library

### Template Matching Logic

```ts
// src/data/templates.ts
type TemplateKey = `${PillarKey}-${Channel}-${CRM}`

export const templateManifest: Record<TemplateKey, string> = {
  'R-email-none':     'rapid-r-email-none.json',
  'R-email-hubspot':  'rapid-r-email-hubspot.json',
  'A-email-none':     'rapid-a-email-none.json',
  'A-email-hubspot':  'rapid-a-email-hubspot.json',
  'P-email-none':     'rapid-p-email-none.json',
  'I-email-none':     'rapid-i-email-none.json',
  'D-email-none':     'rapid-d-email-none.json',
  'D-email-hubspot':  'rapid-d-email-hubspot.json',
}

// Falls back to -none variant if exact match not found
export function getTemplate(pillar: PillarKey, channel: Channel, crm: CRM): string {
  const key = `${pillar}-${channel}-${crm}` as TemplateKey
  return templateManifest[key] ?? templateManifest[`${pillar}-${channel}-none` as TemplateKey]
}
```

### MVP Template Set

| Key | Scenario description |
|-----|---------------------|
| R-email-none | Email received → AI intent classifier → acknowledge + route |
| R-email-hubspot | Above + create HubSpot contact |
| A-email-none | Email received → AI instant response → BANT qualifier → booking link if qualified |
| A-email-hubspot | Above + HubSpot opportunity creation + stage update |
| P-email-none | Email received → AI discovery agent → personalised response based on situation |
| I-email-none | Out-of-hours auto-reply → AI triage → human notification with summary |
| D-email-none | No-reply detection → AI follow-up sequence (3 steps, configurable delay) |
| D-email-hubspot | Above + HubSpot stage update on reply |

> Template JSON files are built in Make and exported as blueprint JSON. For MVP, placeholder `{}` files are acceptable — the download mechanism must work. Real templates replace placeholders before launch.

---

## 9. Visual Workflow Diagrams

Each pillar has a static React Flow config in `src/data/diagrams.ts`. **Diagrams are never AI-generated.**

### Node Types

| Type | Visual | Contents |
|------|--------|----------|
| `trigger` | Rounded rect, cyan border | Channel icon + source label |
| `agent` | Rounded rect, green border | Brain icon + action label |
| `action` | Rounded rect, white border | App logo + action label |
| `decision` | Diamond | Branch label (e.g. "Qualified?") |
| `end` | Pill | Terminal state (e.g. "Booked", "Nurtured") |

### Config Shape

```ts
type DiagramConfig = {
  nodes: Node[]   // React Flow Node[]
  edges: Edge[]   // React Flow Edge[]
}

type PillarDiagrams = {
  base: DiagramConfig      // No CRM
  crm:  DiagramConfig      // With CRM nodes added
}

// src/data/diagrams.ts exports:
export const diagrams: Record<PillarKey, PillarDiagrams> = { R, A, P, I, D }
```

### CRM Toggle Behaviour

Activating the CRM toggle swaps the active `DiagramConfig` from `base` to `crm`. React Flow re-renders. No API call — purely a config swap in component state.

### PNG Export

The diagram wrapper has `id="diagram-export"`. Export button calls `html-to-image` on that element and triggers a download: `rapid-[pillar]-workflow.png`.

---

## 10. Feature Specifications

### 10.1 Onboarding

- Inputs: `monthly_leads` (number, required), `primary_channel` (select, required), `avg_deal_value` (number, required), `business_name` (text, optional)
- Pre-fill `rapid_score_from_audit` from `?score=` query param if present
- Validation: required fields non-empty, numeric fields > 0
- On submit: write to Zustand store → navigate to `/dashboard`

### 10.2 RAPID Score

- Derived: `count of pillars where status === 'complete'`
- Shown in `<ScoreCounter>` in app header — visible on every screen after onboarding
- On increment: Framer Motion animates old → new value over 800ms

### 10.3 Revenue Impact Calculator

```ts
const PILLAR_UPLIFT: Record<PillarKey, number> = {
  R: 0.15,   // 15% — faster acknowledgement
  A: 0.25,   // 25% — speed-to-lead improvement
  P: 0.10,   // 10% — personalisation
  I: 0.08,   //  8% — after-hours availability
  D: 0.12,   // 12% — consistent follow-up
}

function calcMonthlyImpact(pillar: PillarKey, monthly_leads: number, avg_deal_value: number): number {
  return Math.round(monthly_leads * avg_deal_value * PILLAR_UPLIFT[pillar])
}
```

Show as: `$X/month · $Y/year`

### 10.4 Template Download

```ts
async function handleDownload(pillar: PillarKey, channel: Channel, crm: CRM) {
  const filename = getTemplate(pillar, channel, crm)
  const res = await fetch(`/templates/${filename}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  store.markTemplateDownloaded(pillar)  // update Zustand
}
```

### 10.5 Pillar Locking

- Unlock sequence: R always unlocked → A unlocks when R complete → P when A complete → I when P → D when I
- Locked: `opacity: 0.5`, `pointer-events: none`, lock icon visible
- Dev/demo override: `?unlock_all=true` query param unlocks all (non-production use only)

### 10.6 Setup Checklist

- Items defined in `src/data/tasks.ts` as `{ id: string, label: string }[]`
- State in Zustand: `pillars[pillar].checklist_items[taskId][itemId] = boolean`
- `Mark as Implemented`: enabled when all items checked, OR user clicks override ("Skip — I've done this manually")

### 10.7 Advanced Toggle

- Hidden on Task Detail by default
- On click: calls `POST /api/spec` — show spinner (can take 10–20s)
- Displays: prompt template (copy button), skill.md (copy button), estimated daily cost in USD

---

## 11. Data Model

All state in **Zustand** with localStorage persistence via `persist` middleware.

### Types

```ts
type Channel  = 'email' | 'sms' | 'webchat' | 'form' | 'whatsapp'
type CRM      = 'none' | 'hubspot' | 'pipedrive' | 'airtable' | 'gohighlevel'
type PillarKey = 'R' | 'A' | 'P' | 'I' | 'D'

type UserProfile = {
  user_id:                null           // Phase 2: Supabase auth
  business_name:          string | null
  monthly_leads:          number
  avg_deal_value:         number
  primary_channel:        Channel
  crm:                    CRM
  rapid_score_from_audit: number | null
  created_at:             string
}

type PillarState = {
  status:              'not_started' | 'in_progress' | 'complete'
  crm_variant_active:  boolean
  template_downloaded: boolean
  checklist_items:     Record<string, boolean>
  completed_at:        string | null
}

type RapidProgress = {
  pillars: Record<PillarKey, PillarState>
}
```

### Zustand Store Actions

```ts
// All actions that must be implemented in useRapidStore.ts
setUserProfile(profile: Partial<UserProfile>): void
setPillarStatus(pillar: PillarKey, status: PillarState['status']): void
toggleCrmVariant(pillar: PillarKey): void
markTemplateDownloaded(pillar: PillarKey): void
setChecklistItem(pillar: PillarKey, itemId: string, checked: boolean): void
completePillar(pillar: PillarKey): void

// Selectors (derived, not stored)
getRapidScore(): number
getNextUnlockedPillar(): PillarKey | null
isPillarUnlocked(pillar: PillarKey): boolean
isOnboardingComplete(): boolean
```

### Static Data Files

| File | Contents |
|------|----------|
| `src/data/pillars.ts` | Pillar configs: title, tagline, description, benchmark stat, static diagnostic copy, uplift % |
| `src/data/tasks.ts` | Task configs: name, description, pillar, hours_saved, checklist steps, AI/human split description |
| `src/data/diagrams.ts` | React Flow node/edge configs for all 10 variants (5 pillars × base + crm) |
| `src/data/templates.ts` | Template manifest + `getTemplate()` helper |

> **Critical:** Build all 4 static data files completely before writing any component code. The screens are primarily rendering logic that consumes these files.

---

## 12. AI Usage

### 12.1 Personalised Diagnostic Copy

- **Route:** `POST /api/personalise`
- **Model:** `claude-haiku-4-5-20251001`
- **Timeout:** 3000ms — return `{ copy: null }` on timeout
- **Fallback:** static copy from `pillars.ts` — no error shown to user

**System prompt:**
```
You are a business coach writing a 2-3 sentence diagnostic for a small business owner.
Be direct and specific. Use their exact numbers. No jargon. No fluff.
Pillar: {pillar_name}
Business: {business_name}
Monthly leads: {monthly_leads}
Average deal value: ${avg_deal_value}
Primary channel: {channel}
Benchmark: {pillar_benchmark_stat}
Return only the 2-3 sentences. No preamble or explanation.
```

### 12.2 Agent Spec Generation

- **Route:** `POST /api/spec`
- **Model:** `claude-opus-4-6`
- **Trigger:** user clicks Advanced toggle on Task Detail
- **Returns:** `{ prompt_template, skill_md, input_schema, output_schema, estimated_daily_cost_usd }`
- Show a loading spinner while in progress — this can take 10–20 seconds

### 12.3 Mode 2 — AI Coach (V2)

Not in scope for this PDR. Do not build any conversational AI features in Mode 1.

---

## 13. Tech Stack & Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| AI | `@anthropic-ai/sdk` |
| State | Zustand + `persist` middleware |
| Diagrams | React Flow v11 (`reactflow`) |
| Animations | Framer Motion |
| Diagram export | `html-to-image` |
| Styling | Custom CSS — `src/styles/global.css` only. No Tailwind. No CSS modules. No styled-components. |
| Fonts | Google Fonts: Exo 2, Outfit, DM Mono |
| Storage MVP | localStorage (via Zustand persist) |
| Storage Phase 2 | Supabase |
| Hosting | Vercel |

### File Structure

```
.claude/
  agents/
    frontend.md
    backend.md
    ux.md
    qa.md

app/
  layout.tsx                   — Root layout: fonts, global CSS, header with ScoreCounter
  page.tsx                     — Entry / onboarding
  dashboard/
    page.tsx                   — RAPID Roadmap
  pillar/
    [id]/
      page.tsx                 — Pillar View
      task/
        [tid]/
          page.tsx             — Task Detail
  complete/
    page.tsx                   — Completion screen
  api/
    personalise/
      route.ts                 — Claude Haiku: personalised copy
    spec/
      route.ts                 — Claude Opus: agent spec

src/
  components/
    ScoreCounter.tsx           — Animated RAPID Score (in header)
    PillarCard.tsx             — Single pillar row on roadmap
    WorkflowDiagram.tsx        — React Flow wrapper (base + crm swap)
    TaskRow.tsx                — Task row in breakdown table
    TaskDetail.tsx             — Checklist + Advanced toggle
    TemplateDownload.tsx       — Download button + CRM toggle
    ImpactSummary.tsx          — $ revenue impact display
    AdvancedSpec.tsx           — Advanced spec display (prompt, skill.md, schema, cost)
    CompletionDiagram.tsx      — Master React Flow (all 5 pillars linked)
  data/
    pillars.ts
    tasks.ts
    diagrams.ts
    templates.ts
  store/
    useRapidStore.ts
  styles/
    global.css                 — Full PAL design system

public/
  templates/
    rapid-r-email-none.json
    rapid-r-email-hubspot.json
    rapid-a-email-none.json
    rapid-a-email-hubspot.json
    rapid-p-email-none.json
    rapid-i-email-none.json
    rapid-d-email-none.json
    rapid-d-email-hubspot.json
  icons/
    gmail.svg
    claude.svg
    hubspot.svg
    calendly.svg
    make.svg
```

### Environment Variables

```bash
# .env.local (never commit this file)
ANTHROPIC_API_KEY=           # Server only — never in client bundle
NEXT_PUBLIC_BOOKING_URL=     # Booking/Calendly URL for Done-For-You CTA
```

### API Routes

| Method | Route | Model | Purpose |
|--------|-------|-------|---------|
| POST | `/api/personalise` | claude-haiku-4-5-20251001 | Personalised diagnostic copy, 3s timeout |
| POST | `/api/spec` | claude-opus-4-6 | Agent spec generation, on-demand |

---

## 14. Screens Summary

| Screen | Route | Purpose |
|--------|-------|---------|
| Entry | `/` | Onboarding. 3 questions. Single CTA. |
| RAPID Roadmap | `/dashboard` | 5 pillars, score, revenue impact, sequential unlock. |
| Pillar View | `/pillar/[id]` | Diagnostic + breakdown + diagram + download. |
| Task Detail | `/pillar/[id]/task/[tid]` | Checklist + Advanced toggle. |
| Completion | `/complete` | Master diagram + total savings + Done-For-You CTA. |

---

## 15. Non-Functional Requirements

### Performance

- `/` and `/dashboard`: < 1s load — no API calls, all static data
- `/pillar/[id]`: < 500ms render — diagram is pre-configured, not generated
- AI personalisation: 3s hard timeout, falls back silently
- `/api/spec`: no timeout — show spinner, can take 10–20s
- Template download: instant — static file

### Design

- PAL brand: `#0A0F1E` bg, `#00D4FF` cyan, `#00FF88` green, glassmorphism cards
- Fonts: Exo 2 (headings), Outfit (body), DM Mono (code)
- Breakpoints: 375px / 768px / 1280px
- WCAG AA contrast on all text

### Security

- `ANTHROPIC_API_KEY` server-only — never in client bundle
- No auth in MVP
- `.env.local` in `.gitignore`
- No PII logged

### Phase 2 Readiness

- Zustand schema → Supabase tables: zero field changes needed
- `user_id: null` placeholder ready for auth
- No direct localStorage calls outside `useRapidStore.ts`

---

## 16. MVP Build Plan

### MVP Scope

- Email channel only
- CRM: None + HubSpot
- All 5 RAPID pillars with fully authored static content
- 8 Make templates (placeholders acceptable for initial build)
- 10 React Flow diagram configs (5 × base + crm)
- Revenue impact calculator
- Animated RAPID Score
- Template download (JSON)
- PNG diagram export
- AI personalisation (progressive enhancement, silent)
- On-demand agent spec (Advanced toggle)
- Done-For-You CTA → `NEXT_PUBLIC_BOOKING_URL`

### V1 Additions

- Channels: SMS, web chat, WhatsApp
- CRMs: Pipedrive, Airtable, GoHighLevel
- RAPID Audit standalone page (Typeform-style, 5 questions, instant score)
- Supabase auth + persistent data across devices
- Mode 2 — AI Coach (separate PDR)
- White-label / consultant mode

---

## 17. Acceptance Criteria

The MVP is complete when all of the following pass:

1. User can complete onboarding and reach RAPID Roadmap in under 3 minutes.
2. All 5 pillars display diagnostic copy, process breakdown table, and React Flow diagram.
3. CRM toggle switches diagram and template correctly for all combinations.
4. `Download Make Template` downloads the correct JSON for the user's `pillar-channel-crm`.
5. Marking a pillar complete increments the RAPID Score with animation and unlocks the next pillar.
6. Completing all 5 pillars shows the completion screen with master diagram and Done-For-You CTA.
7. All state persists across page refreshes via localStorage.
8. Advanced toggle calls `/api/spec` and displays the result with a loading spinner.
9. `/api/personalise` falls back to static copy silently when it exceeds 3 seconds.
10. Product is fully usable at 375px width.
11. `npx tsc --noEmit` — zero errors.
12. `npm run build` — zero errors.
13. `ANTHROPIC_API_KEY` has zero references outside `app/api/` routes.

---

*RAPID System — PDR v1.1 · Profit AI Lab · 2026 · Confidential*
