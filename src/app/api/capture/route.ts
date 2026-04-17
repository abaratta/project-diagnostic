import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  // 1. Insert into Supabase
  const { error: dbError } = await getSupabase().from('leads').insert([body])
  if (dbError) {
    console.error('[capture] Supabase insert failed:', dbError.message)
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 })
  }

  // 2. Fire webhook if configured
  const webhookUrl = process.env.WEBHOOK_URL
  if (webhookUrl) {
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!webhookRes.ok) {
        console.error('[capture] Webhook responded with status:', webhookRes.status)
        return NextResponse.json(
          { ok: false, error: `Webhook error: ${webhookRes.status}` },
          { status: 500 }
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[capture] Webhook fetch failed:', message)
      return NextResponse.json({ ok: false, error: message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
