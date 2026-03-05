import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      task_name: string
      task_description: string
      pillar: string
      channel: string
    }

    if (!body.task_name || !body.task_description) {
      return NextResponse.json(
        { error: 'task_name and task_description are required' },
        { status: 400 }
      )
    }

    const prompt = `You are an AI automation architect. Generate a complete agent spec for the following task.

Task: ${body.task_name}
Description: ${body.task_description}
RAPID Pillar: ${body.pillar}
Channel: ${body.channel}

Return a JSON object with exactly these fields:
{
  "prompt_template": "The complete system prompt for this AI agent, with {placeholder} variables",
  "skill_md": "A skill.md definition file in markdown format describing this agent's capabilities",
  "input_schema": "JSON Schema object for the agent's inputs",
  "output_schema": "JSON Schema object for the agent's outputs",
  "estimated_daily_cost_usd": <number, estimated USD cost per day assuming 50 runs>
}

Return only valid JSON. No markdown fences. No explanation.`

    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = msg.content[0]
    if (block.type !== 'text') {
      return NextResponse.json({ error: 'No text response' }, { status: 500 })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(block.text) as Record<string, unknown>
    } catch {
      // Try to extract JSON from the text
      const match = block.text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: 'Could not parse spec response' }, { status: 500 })
      }
      parsed = JSON.parse(match[0]) as Record<string, unknown>
    }

    return NextResponse.json({
      prompt_template:          String(parsed.prompt_template ?? ''),
      skill_md:                 String(parsed.skill_md ?? ''),
      input_schema:             typeof parsed.input_schema === 'string' ? parsed.input_schema : JSON.stringify(parsed.input_schema, null, 2),
      output_schema:            typeof parsed.output_schema === 'string' ? parsed.output_schema : JSON.stringify(parsed.output_schema, null, 2),
      estimated_daily_cost_usd: Number(parsed.estimated_daily_cost_usd ?? 0.05),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
