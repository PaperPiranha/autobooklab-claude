We're building an AI-powered eBook creation platform similar to Designrr. The app enables users to create, design, and export professional eBooks with minimal effort using AI assistance.

App Functionality

User onboarding (account creation, plan selection)
Step-by-step eBook creation pipeline (title → outline → content generation → image selection → layout → export)
AI content generation (chapter drafts, rewrites, summaries)
AI image generation + Unsplash integration for cover art and inline images
Template library with pre-built eBook layouts
Live eBook editor (WYSIWYG) with drag-and-drop sections
Export to PDF and EPUB
Credit-based AI usage quota system with tiered GBP pricing
User dashboard (projects, usage stats, plan info)

Tech

React + TypeScript (Vite)
Supabase (auth, database, storage — locally first running on Docker)
Tailwind CSS
Stripe for payments (Free, Starter, Pro tiers in GBP)
Resend for welcome and export-ready emails
AI SDK for content generation (Claude API)
Unsplash API for royalty-free image search
react-pdf / epub-gen for export pipelines

Look & Feel

Use Shadcn/UI for components
Dark mode by default with light mode toggle
Modern, clean design — dark background (#0F0F0F), orange accent (#F97316)
Minimal chrome, generous whitespace, clear typography
The editor should feel simple and fast — improve on Designrr's cluttered UI

Process

Break app build into logical milestones
Use MCP for integrations
Milestone 1: Auth, onboarding, dashboard shell
Milestone 2: eBook creation pipeline (title → outline → chapters)
Milestone 3: AI content generation + Unsplash image integration
Milestone 4: WYSIWYG eBook editor with templates
Milestone 5: PDF and EPUB export
Milestone 6: Stripe billing, credit system, plan management
Milestone 7: Polish, responsive design, email notifications
