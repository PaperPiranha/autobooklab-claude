# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Stack

- **Next.js 16** App Router (not Vite — PRD says Vite but Next.js was scaffolded and is preferred)
- **React 19**, **TypeScript** strict mode, path alias `@/*` → project root
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Supabase** — auth, Postgres DB, file storage (local Docker first, then hosted)
- **Shadcn/UI** — component library (to be installed in M1)
- **Stripe** — Free / Starter / Pro tiers in GBP
- **Anthropic Claude API** via Vercel AI SDK — content generation
- **Unsplash API** — royalty-free image search
- **react-pdf** + **epub-gen** — export pipelines
- **Resend** — transactional email (welcome, export-ready)

## Design System

- Dark mode default, light mode toggle
- Background: `#0F0F0F`, accent: `#F97316` (orange)
- Components: Shadcn/UI with Tailwind CSS
- Geist Sans + Geist Mono fonts

## Architecture

All routes live under `app/` using Next.js App Router conventions:
- `app/(auth)/` — sign in, sign up, password reset
- `app/(dashboard)/` — protected dashboard shell, projects list
- `app/(editor)/` — WYSIWYG eBook editor
- `app/api/` — server-side API routes (AI generation, Stripe webhooks, Resend)
- `components/` — shared Shadcn/UI + custom components
- `lib/` — Supabase client, AI SDK helpers, Stripe client, utility functions
- `supabase/migrations/` — SQL migration files

Supabase is used for auth (server-side with Next.js middleware), database (Postgres with RLS), and storage (cover images, exports).

## Milestones

### M1 — Foundation, Auth & Dashboard Shell
- Install and configure Shadcn/UI
- Set up Supabase locally with Docker (`supabase start`)
- Auth flows: sign up, sign in, password reset, email verification
- Middleware-based route protection
- Onboarding: plan selection screen (Free / Starter / Pro)
- Dashboard shell: sidebar nav, user menu, empty projects state
- Dark theme wired up (#0F0F0F bg, #F97316 accent)

### M2 — eBook Creation Pipeline
- Supabase schema: `books`, `chapters`, `outlines` tables with RLS
- Multi-step creation wizard: title → genre/description → outline → chapter list
- Chapter text editor (plain textarea, no AI yet)
- Projects dashboard: list, open, delete

### M3 — AI Content Generation + Images
- Anthropic Claude API via Vercel AI SDK (streaming)
- Chapter draft generation, rewrite, summarize tools
- Unsplash API integration (search, select, insert into chapter)
- Credit system: `credits` table, deduct on AI call, enforce quota
- API routes: `POST /api/ai/generate`, `POST /api/ai/rewrite`

### M4 — WYSIWYG Editor + Templates
- Rich text editor (TipTap) with custom extensions
- Drag-and-drop section reordering
- Template library: 3–5 pre-built eBook layouts
- Image placement, resizing, captioning in editor
- Auto-save to Supabase

### M5 — PDF & EPUB Export
- `react-pdf` for PDF rendering pipeline
- `epub-gen` for EPUB packaging
- Export queued as background job, stored in Supabase Storage
- Trigger Resend email when export is ready

### M6 — Stripe Billing & Credit Management
- Stripe products: Free (0 credits), Starter (£9/mo), Pro (£29/mo)
- Stripe Checkout + Customer Portal
- Webhook handler: `POST /api/webhooks/stripe`
- Monthly credit refresh on subscription renewal
- Plan info + usage stats in dashboard

### M7 — Polish, Responsiveness & Emails
- Mobile-responsive layouts
- Light mode toggle (persisted to localStorage / Supabase user prefs)
- Welcome email on sign-up (Resend)
- Export-ready email notification
- Loading skeletons, error boundaries, empty states
- Performance audit and bundle optimization
