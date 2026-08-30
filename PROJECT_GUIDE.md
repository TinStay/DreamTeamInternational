# DreamTeam Web — Project Guide

Single source of truth for this repo: what the app is, how it's built, and the rules every change must follow. **Living document** — update it whenever the architecture, conventions, or business facts change (e.g. after optimizations or new features).

## 1. What this app is

Marketing site for **DreamTeam** — an AI video production **company** (never call it an "agency") based in Sofia, Bulgaria, serving clients in Bulgaria and worldwide.

- Website: `https://dreamteam.video` (base URL for metadata, sitemap, JSON-LD)
- Email stays on the old domain: `info@dreamteam.technology` (Resend-verified — do not change without re-verifying)
- Services: AI Video Production (`ai-video`), Brand Mascots (`brand-mascots`), AI Images / Graphic Design (`ai-images`), Video & Image Automation (`ai-automation`)
- Training: individual lessons, Skool community, team workshops
- Business facts used in copy: individual quotes (price depends on complexity/length); delivery 5–12 **working days** with a **paid prioritization** option; tools chosen adaptively across AI/video models; clients get full commercial rights; fully remote workflow.

## 2. Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript (strict)**
  - ⚠️ Read `node_modules/next/dist/docs/` before using unfamiliar APIs — this version differs from training data. `params`/`searchParams` are **Promises** (must be awaited).
- **Tailwind CSS v4** (+ `tw-animate-css`), shadcn-style components on **@base-ui/react** + Radix primitives
- **motion** (`import { motion } from "motion/react"`) for animation — do NOT add `framer-motion`; it was consolidated away
- **Resend** for contact/inquiry email; **PostHog** + **Vercel Analytics**; **next-themes** (dark default)
- No styled-components / CSS-in-JS / `style jsx` — Tailwind classes or shared CSS in `src/app/globals.css` only

## 3. Structure (where things live)

| Path | Purpose |
| --- | --- |
| `src/app/[lang]/…` | Locale routes (`bg`, `en`): home, `contact`, `services(/[slug])`, `training(/[slug])`, `privacy`, `terms` |
| `src/app/api/contact/route.ts` | Contact endpoint → Resend (validation, honeypot `website` field, rate limit) |
| `src/app/layout.tsx` | Root layout: metadata, Organization/WebSite JSON-LD, providers, `defaultTheme="dark"` |
| `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` | SEO endpoints; robots explicitly allows AI crawlers |
| `src/app/home-page.tsx` | Home composition — self-contained sections stacked in order |
| `src/components/quote-form/` + `src/lib/quote-form/constants.ts` | Multi-step quote form (home, after services): steps in `steps/`, option keys/icons/limits in the constants file, labels in the dictionaries (`quoteForm`), submits to `/api/quote` (Resend + attachments, ≤4 MB total; email markup in `src/app/api/quote/email-template.ts`) |
| `src/lib/youtube-embeds.ts` | Portfolio clips per category, **newest first** in each array; embed as `/embed/ID` (never `/shorts/`) |
| `src/lib/partners.ts` + `partner-logo.tsx` | Partner list (logo filenames ↔ site URL) and the light/dark logo swap |
| `src/components/` | Page sections (hero, services, reviews, faq, contact…) + `training/`, `services/`, `legal/` views |
| `src/components/ui/` | Reusable primitives (shadcn-style) — put new primitives here |
| `src/lib/i18n/` | `config.ts` (server-safe LOCALES/dictionaries), `language-context.tsx` (client hook), `bg.ts` + `en.ts` dictionaries |
| `src/lib/routes.ts` | Localized path helpers (`homePath`, `servicePath`, …) — always use these, never hardcode paths |
| `src/lib/services/constants.ts` | Service identity: icon path ↔ URL slug maps (`SERVICE_SLUG_BY_ICON`) |
| `public/llms.txt` | Company/services brief for AI assistants — keep in sync with real offerings |

## 4. Rules (must-follow)

### Localization (bg primary, en secondary)
- **Every user-facing string lives in BOTH `src/lib/i18n/bg.ts` and `en.ts`.** No hardcoded UI text in components. The `Dictionary` type is inferred from `en.ts`, so the build fails on locale drift — keep shapes identical.
- When adding any feature, add translations for **all active locales in the language toggle** (currently bg + en). Bulgarian copy must read native — no machine-translation tone, no AI clichés.
- New pages: `generateStaticParams` from `LOCALES`, `dynamicParams = false` (unknown locales → 404), `generateMetadata` with per-locale title/description + `canonical` + `localeAlternates()`.
- Review content (names, roles, initials, review text) is localized too — it lives in the dictionaries under `reviews.items`.

### Reusable components
- Build components so they can be **added/removed from a layout without breaking it**: each home section is a self-contained `<section>` owning its own container/spacing (`mx-auto max-w-7xl px-4`), consuming the dictionary via `useLanguage()`, with an optional `className` prop.
- Primitives go in `src/components/ui/`, TypeScript-first, styled with Tailwind, following the existing shadcn conventions. Prefer reusing/extending existing components over duplicating.

### SEO & AI search
- Exactly **one keyword-rich `<h1>` per page** (home uses an `sr-only` h1; the visual hero headline is a `<p>`).
- Keep structured data in sync: Organization/WebSite (layout), Service + BreadcrumbList (service pages), FAQPage (FAQ section).
- New indexable routes must be added to `src/app/sitemap.ts` (`PATHS`) and get breadcrumb labels in `page-breadcrumbs.tsx` (`segmentToLabel`).
- Keep `public/llms.txt` and dictionary SEO fields (`seoTitle`/`seoDescription`) current. Never describe DreamTeam as an "agency".

### Theming & visual conventions
- **Dark is the default theme.** Dark text-card surfaces use `bg-card` (dark navy `#0f172a`, defined once in `globals.css` `.dark`). Never hardcode dark card backgrounds (`dark:bg-neutral-950` etc.) — use `bg-card`/`bg-card/NN` so future cards inherit the standard.
  - `src/app/layout.tsx` renders `<html className="dark" style={{colorScheme:"dark"}}>` **server-side**. Keep it: `:root` is the light palette and next-themes' script runs from `<body>`, so without it the light theme flashes on every cold load (visibly, because `body` animates `background-color`). `defaultTheme="dark"` + `enableSystem={false}` handle the client side.
- Section headers: left-aligned `h2` (`text-4xl md:text-5xl font-heading font-bold`) with an accent word in `text-section-accent`, subtitle `text-lg text-muted-foreground max-w-2xl`.
- Fonts: body/UI is **Nunito Sans** (`--font-sans`, Google import in `globals.css`); headings use **Uni Sans** via the `font-heading` utility (`--font-heading` in `globals.css` → `--font-uni-sans`, loaded with `next/font/local` from `src/app/fonts/`). Only Heavy (900) and Thin (100) are licensed/bundled, so `font-semibold`/`font-bold` on a heading resolve up to Heavy — don't add mid-weight heading styles expecting 600/700 to render distinctly.
- Portfolio "All" tab is a **hand-picked highlight reel** (`embedsForAll()`), not every clip — adding a video to a category does *not* put it on the home page. Category tabs show the full catalogue.
- Partners render as scrolling marquee rows at **every** breakpoint (no static desktop grid). Keep `sizes` on the logos in step with their max rendered width.
- Interactive elements always get `cursor-pointer` (unless disabled). Breadcrumbs on all non-home pages (automatic via `PageBreadcrumbs`). Modals: full-viewport on mobile with a top-right X close.
- Images: use `next/image` with a `sizes` hint (qualities 75/100 are configured). Raw `<img>` only with an explicit reason.

### Forms & email
- All inquiry forms POST to `/api/contact`, which sends via Resend **to `info@dreamteam.technology`**, includes the internal Bulgarian form label (`formStateBg`), and renders HTML + plaintext.
- Server-side validation is the contract: required name/email/message, length caps, honeypot (`website` must stay in forms, hidden), per-IP rate limit. Check `result.error` from Resend — never report success on failure.

### Quality gates
- `npm run build` **and** `npm run lint` must pass before finishing any change.
- If you ran `next build` locally, delete `.next` before `next dev` — stale production manifests cause dev 404s on dynamic routes.
- Keep changes minimal, production-ready, consistent with repo style. Report failures honestly.

## 5. Environment & deployment

- `.env.local`: `RESEND_API_KEY` (required for email), `RESEND_FROM` (optional, defaults to `info@dreamteam.technology`)
- Scripts: `npm run dev` / `build` / `start` / `lint`
- Hosted on Vercel; permanent redirects + security headers live in `next.config.ts` (retired `/zh` locale → `/en`)
