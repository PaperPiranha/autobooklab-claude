# AutoBookLab — Build Plan

## Milestone 1 — Foundation, Auth & Dashboard Shell ✓
- [x] Install and configure Shadcn/UI (manual install — components.json + Radix UI primitives)
- [x] Set up Supabase locally with Docker (running on port 54331)
- [x] Auth flows: sign up, sign in, password reset, email verification
- [x] Middleware-based route protection (proxy.ts — Next.js 16 convention)
- [x] Onboarding: plan selection screen
- [x] Dashboard shell: sidebar nav, user menu, empty projects state
- [x] Dark theme (#0F0F0F bg, #F97316 accent)

## Milestone 2 — eBook Creation Pipeline ✓
- [x] Supabase schema: `books`, `chapters` tables with RLS + triggers
- [x] Multi-step creation wizard: title → genre → description → chapters
- [x] Basic chapter text editor with 1.5s auto-save + word count
- [x] Projects dashboard: list, open, delete

## Milestone 3 — AI Content Generation + Images ✓
- [x] Claude API via Vercel AI SDK streaming (claude-sonnet-4-6, toTextStreamResponse)
- [x] Chapter draft generation, rewrite, summarize — collapsible AI panel in editor
- [x] Unsplash API proxy (`/api/images/search`) — search + insert as markdown
- [x] Credit system: `credits` + `credit_transactions` tables, atomic `spend_credit` RPC
- [x] API routes: `/api/ai/generate`, `/api/ai/rewrite`

## Milestone 4 — WYSIWYG Editor + Templates ✓
- [x] TipTap rich text editor (StarterKit + Image + Placeholder + CharacterCount + Typography + Link + Underline)
- [x] Drag-and-drop chapter reordering (dnd-kit, optimistic updates via useTransition)
- [x] Template library (5 layouts: blank, standard, how-to, listicle, case study)
- [x] Image placement and captioning (toolbar image dialog + AI panel Unsplash integration)
- [x] Auto-save to Supabase (1.5s debounce + flush on unmount)

## Milestone 5 — PDF & EPUB Export ✓
- [x] `@react-pdf/renderer` PDF pipeline — dark title page + chapter layout, HTML-to-blocks parser
- [x] `epub-gen-memory` EPUB packaging — HTML chapters, custom CSS, in-memory Buffer
- [x] Exports stored in Supabase Storage (`exports` bucket, private, RLS by user folder)
- [x] `exports` table with status tracking + signed-URL download endpoint
- [x] Resend email on export ready (optional — skipped if RESEND_API_KEY not set)
- [x] Export panel UI on book page with PDF/EPUB buttons, auto-download, recent export history

## Milestone 6 — Stripe Billing & Credit Management
- [ ] Stripe products: Free / Starter (£9) / Pro (£29)
- [ ] Stripe Checkout + Customer Portal
- [ ] Webhook handler: `/api/webhooks/stripe`
- [ ] Monthly credit refresh on renewal
- [ ] Plan info + usage stats in dashboard

## Milestone 7 — Polish, Responsiveness & Emails
- [ ] Mobile-responsive layouts
- [ ] Light mode toggle (persisted)
- [ ] Welcome email on sign-up (Resend)
- [ ] Export-ready email notification
- [ ] Loading skeletons, error boundaries, empty states
- [ ] Performance and bundle audit
