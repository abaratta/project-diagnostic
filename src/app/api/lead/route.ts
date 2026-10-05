import { NextRequest, NextResponse } from 'next/server'

/**
 * Simulator lead → Make scenario "PAL simulator to GHL" (same pattern as the sales demo).
 * The scenario upserts the GHL contact with the Profile custom field, adds the "simulator" tag
 * via Add Tags (so existing tags are kept) and adds the entered values as a note.
 *
 * Env: MAKE_WEBHOOK_URL (the scenario's custom webhook), MAKE_WEBHOOK_SECRET (checked by the
 * scenario's first filter so only this site can trigger it).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIMEOUT_MS = 10000

/** Site profile label → exact option value of the GHL "Profile" dropdown. */
const PROFILE_TO_GHL: Record<string, string> = {
  'Founder': 'Founder',
  'Agency': 'Agency',
  'Small Business': 'Small business',
  'Professional Service': 'Professional Service',
}

type LeadBody = {
  name?: unknown
  email?: unknown
  phone?: unknown
  profile?: unknown
  values?: unknown
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

export async function POST(req: NextRequest) {
  let body: LeadBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : ''
  const profile = typeof body.profile === 'string' ? PROFILE_TO_GHL[body.profile] ?? '' : ''
  const values = body.values && typeof body.values === 'object' ? body.values as Record<string, unknown> : {}

  if (!name) return NextResponse.json({ ok: false, error: 'Enter your name.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })

  const url = process.env.MAKE_WEBHOOK_URL
  if (!url) {
    console.warn('[lead] MAKE_WEBHOOK_URL not set; lead not sent to GHL')
    return NextResponse.json({ ok: false, error: 'Lead capture is not configured' }, { status: 500 })
  }

  // Make drops these straight into the GHL request body, so send them pre-escaped as a JSON fragment.
  const contactFields = JSON.stringify({
    ...splitName(name),
    name,
    email,
    ...(phone ? { phone } : {}),
  }).slice(1, -1)

  const note = [
    'Revenue Simulator submission',
    `Profile: ${profile || 'Not selected'}`,
    ...Object.entries(values)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .map(([k, v]) => `${k}: ${v}`),
  ].join('\n')

  const payload = JSON.stringify({
    name,
    email,
    phone,
    profile,
    contactFields,
    note,
    secret: process.env.MAKE_WEBHOOK_SECRET ?? '',
  })

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (res.ok) return NextResponse.json({ ok: true })
      console.error(`[lead] Make responded ${res.status} (attempt ${attempt})`)
      if (res.status < 500 && res.status !== 429) break
    } catch (err) {
      console.error(`[lead] Make request failed (attempt ${attempt})`, err)
    }
    if (attempt === 1) await new Promise(r => setTimeout(r, 600))
  }
  return NextResponse.json({ ok: false, error: 'Could not save your details' }, { status: 502 })
}
