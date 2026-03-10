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

## Milestone 6 — Stripe Billing & Credit Management ✓
- [x] Stripe plan config: Free (10cr) / Starter £9 (50cr/mo) / Pro £29 (200cr/mo)
- [x] Stripe Checkout (`POST /api/billing/checkout`) — pre-fills customer, idempotent customer link
- [x] Customer Portal (`POST /api/billing/portal`) — manage/cancel subscription
- [x] Webhook handler (`POST /api/webhooks/stripe`) — verified signatures, handles checkout.session.completed, subscription.updated/deleted, invoice.paid/payment_failed
- [x] Monthly credit refresh via `refresh_credits_for_plan()` RPC on invoice.paid
- [x] `subscriptions` table with RLS + auto-create trigger for new users
- [x] Billing card on dashboard — current plan, credit bar, upgrade buttons, manage link
- [x] Lazy Stripe singleton (no build-time error when key not set)

## Milestone 7 — Polish, Responsiveness & Emails ✓
- [x] Mobile-responsive layouts — hamburger nav sheet on <lg, responsive padding/grid throughout
- [x] Light/dark mode toggle — next-themes ThemeProvider (defaultTheme: dark), persisted to localStorage, Sun/Moon toggle in sidebar header + mobile header
- [x] Welcome email on sign-up — sent via Resend from /auth/callback after email confirmation (non-fatal, skipped if key not set)
- [x] Export-ready email — already in M5, confirmed working
- [x] Loading skeletons — dashboard and book page skeleton screens matching real content layout
- [x] Error boundaries — app/error.tsx (root) and app/(dashboard)/error.tsx with retry + back buttons
- [x] CSS theme refactored: :root = light, .dark = dark (standard next-themes convention)
