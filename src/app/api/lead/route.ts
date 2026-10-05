import { NextRequest, NextResponse } from 'next/server'

/**
 * Simulator lead → GoHighLevel.
 * 1. Upsert the contact (name, email, phone, Profile custom field) — no tags here,
 *    because upsert *replaces* a contact's tags.
 * 2. Add the "simulator" tag with the Add Tags endpoint, which keeps existing tags.
 * 3. Add the values they entered as a note.
 */

const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = process.env.GHL_API_VERSION ?? 'v3'
const TAG = 'simulator'
const PROFILES = ['Founder', 'Agency', 'Small Business', 'Professional Service'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LeadBody = {
  name?: unknown
  email?: unknown
  phone?: unknown
  profile?: unknown
  values?: unknown
}

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

async function ghl(path: string, token: string, body: unknown) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method: 'POST',
    headers: ghlHeaders(token),
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`GHL ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
  return json
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
  const profile = PROFILES.find(p => p === body.profile)
  const values = body.values && typeof body.values === 'object' ? body.values as Record<string, unknown> : {}

  if (!name) return NextResponse.json({ ok: false, error: 'Enter your name.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })

  const token = process.env.GHL_API_KEY
  const locationId = process.env.GHL_LOCATION_ID
  const profileFieldId = process.env.GHL_PROFILE_FIELD_ID
  if (!token || !locationId) {
    console.error('[lead] GHL_API_KEY or GHL_LOCATION_ID is not set')
    return NextResponse.json({ ok: false, error: 'Lead capture is not configured' }, { status: 500 })
  }

  try {
    // 1. Upsert contact (no tags — see header comment)
    const upsert = await ghl('/contacts/upsert', token, {
      locationId,
      ...splitName(name),
      name,
      email,
      ...(phone ? { phone } : {}),
      source: 'Revenue Simulator',
      ...(profile && profileFieldId ? { customFields: [{ id: profileFieldId, fieldValue: profile }] } : {}),
    })
    const contactId: string | undefined = upsert?.contact?.id
    if (!contactId) throw new Error('GHL upsert returned no contact id')

    // 2. Add tag without touching existing ones
    await ghl(`/contacts/${contactId}/tags`, token, { tags: [TAG] })

    // 3. Note with the values they entered
    const lines = Object.entries(values)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .map(([k, v]) => `${k}: ${v}`)
    const noteBody = [
      'Revenue Simulator submission',
      `Profile: ${profile ?? 'Not selected'}`,
      ...lines,
    ].join('\n')
    await ghl(`/contacts/${contactId}/notes`, token, { body: noteBody })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[lead]', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'Could not save your details' }, { status: 502 })
  }
}
