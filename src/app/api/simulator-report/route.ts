import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SIMULATOR_REPORT_WEBHOOK_URL = 'https://hook.eu2.make.com/tx46i7hvzsj1vk66wo55li7hpetpkz1a'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const image = typeof body.image === 'string' ? body.image : ''
  const date = typeof body.date === 'string' ? body.date : ''
  const businessType = typeof body.businessType === 'string' ? body.businessType : ''
  const baseline = body.baseline && typeof body.baseline === 'object' ? body.baseline : null

  if (!name) {
    return NextResponse.json({ ok: false, error: 'Enter your name' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address' }, { status: 400 })
  }
  if (!image.startsWith('data:image/') && !image.trim().startsWith('<')) {
    return NextResponse.json({ ok: false, error: 'Missing report image' }, { status: 400 })
  }
  if (!baseline) {
    return NextResponse.json({ ok: false, error: 'Missing baseline values' }, { status: 400 })
  }

  try {
    const webhookRes = await fetch(SIMULATOR_REPORT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'simulator-report',
        submittedAt: new Date().toISOString(),
        name,
        email,
        date,
        image,
        businessType,
        baseline,
      }),
    })

    if (!webhookRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Webhook error: ${webhookRes.status}` },
        { status: 500 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
