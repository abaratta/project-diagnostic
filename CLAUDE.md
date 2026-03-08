# RAPID System — Claude Code Context

## Commands
```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit   # Type check only
```

## Architecture
- **Framework:** Next.js 16.1.6 (App Router, `--src-dir` flag — pages in `src/app/`, NOT root `app/`)
- **Styling:** `src/styles/global.css` only — zero Tailwind, zero inline styles
- **State:** Zustand store at `src/store/useFivePStore.ts`
- **Data:** `src/data/` (simulator.ts, templates.ts)
- **API routes:** `src/app/api/` — only place `ANTHROPIC_API_KEY` may be used

## Routes
| Route | Purpose |
|---|---|
| `/` | Audit form (AuditForm.tsx) |
| `/gate` | Lead capture — name/email → Supabase + Make.com webhook |
| `/results` | Revenue report + simulator |
| `/simulator` | Interactive revenue simulator |
| `/booking` | Book a call |
| `/api/capture` | POST lead to Supabase + fires webhook |
| `/api/spec` | Claude Opus 4.6 on-demand spec generation |

## Environment Variables
| Variable | Used in |
|---|---|
| `ANTHROPIC_API_KEY` | `/api/spec`, `/api/personalise` |
| `SUPABASE_URL` | `src/lib/supabase.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase.ts` |
| `WEBHOOK_URL` | `/api/capture` |
| `NEXT_PUBLIC_BOOKING_URL` | Booking components |
| `NEXT_PUBLIC_SIMULATOR_KEY` | `/simulator` |

All vars live in `.env.local` (gitignored). Must be added manually to Vercel project settings.

## Gotchas
- `--src-dir` is active — never create files in root `app/` directory
- `ANTHROPIC_API_KEY` must never appear outside `src/app/api/` routes
- `src/app/globals.css` is the Next.js default — actual project styles live in `src/styles/global.css`
- Active branch: `v2-funnel-redesign` (production branch on Vercel)
- GitHub remote: `github.com/abaratta/project-rapid`
