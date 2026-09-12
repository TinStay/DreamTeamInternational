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
- **Resend** for contact/inquiry email; **PostHog** + **Vercel Analytics**; **next-themes** (dark default); **OpenAI conversion pixel** (`oaiq`, loader in `src/app/layout.tsx`, `lead_created` fired via `src/lib/openai-pixel.ts`)
- No styled-components / CSS-in-JS / `style jsx` — Tailwind classes or shared CSS in `src/app/globals.css` only

## 3. Structure (where things live)

| Path | Purpose |
| --- | --- |
| `src/app/[lang]/…` | Locale routes (`bg`, `en`): home, `contact`, `portfolio`, `projects(/[slug])`, `services(/[slug])`, `training(/[slug])`, `privacy`, `terms` |
| `src/app/api/contact/route.ts` | Contact endpoint → Resend (validation, honeypot `website` field, rate limit) |
| `src/app/layout.tsx` | Root layout: metadata, Organization/WebSite JSON-LD, providers, `defaultTheme="dark"` |
| `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` | SEO endpoints; robots explicitly allows AI crawlers |
| `src/app/home-page.tsx` | Home composition — self-contained sections stacked in order. The hero (`hero-section.tsx`) owns the partners marquee (bottom strip over the video) and its primary CTA jumps to `#quote`; the full portfolio lives on `/portfolio` (no teaser on the home page — `ui/hero-3.tsx` is an unused marquee primitive kept for reuse) |
| `src/components/quote-form/` + `src/lib/quote-form/constants.ts` | Multi-step quote form (home, after services): steps in `steps/`, option keys/icons/limits in the constants file, labels in the dictionaries (`quoteForm`), submits to `/api/quote` (Resend + attachments, ≤4.4 MB total — the Vercel body ceiling; email markup in `src/app/api/quote/email-template.ts`) |
| `src/lib/server/form-guards.ts`, `src/lib/dates.ts`, `src/lib/found-us.ts`, `src/lib/social-links.ts` | Shared: request hygiene for both form APIs (clean/rate-limit/escape/EMAIL_RE), DD-MM-YYYY date display, the "how did you find us" key catalogue, social profile links (UI + JSON-LD) |
| `src/lib/youtube-embeds.ts` + `src/lib/portfolio-highlights.ts` | Portfolio clips per category, **newest first** in each array; embed as `/embed/ID` (never `/shorts/`). `portfolio-highlights.ts` maps category keys ↔ clip lists (`embedsForCategory`), exposes `youtubeThumbnailUrl` (`i.ytimg.com`, allowed in `next.config.ts`) and `portfolioHighlights()` (top 5 per category — currently unused) |
| `src/lib/partners.ts` + `partner-logo.tsx` | Partner list (logo filenames ↔ site URL) and the light/dark logo swap |
| `src/lib/projects.ts` + `src/components/projects-section.tsx` + `src/components/projects/` | Client case studies: identity data + numbers (category, style, YouTube id or `null` placeholder, `since`, platforms/views) in the lib; all copy under `projects.items[id]` in the dictionaries. Home shows `projects-showcase.tsx` — the scroll-driven "case studies journey" (ported from the Claude Design reference; line-up + order = `SHOWCASE_PROJECT_KEYS`, currently the five brands with a bespoke scene): a **transparent** sticky stage (the page background shows through the intro and between scenes) on a timeline in viewport units (`INTRO` 0.7 + `SPAN` 0.9 per project + `OUTRO` 0.3 — deliberately short so a couple of wheel ticks advance a scene; scroll progress smoothed with a stiff `useSpring` so canvases/players don't trail the wheel, every style derived via `useTransform` — no rAF loop). Intro = cinema headline (`projects.showcase.*`, the section `h2`, theme tokens) that scales/blurs away, then page-coloured curtains (`bg-background`) open on the first scene; each scene holds for `HOLD` (slow 4% push-in) then hands over with the next of `TRANSITIONS` (`flow` diagonal wipe → `push` → `pushX` → `zoomOut`, cycling); `sceneFrame()` is the pure geometry. Each scene = a **brand world** from `projects/showcase-scenes.tsx` (`sceneVisualFor`: `tone` light/dark, solid `background`, `layout` for the copy block, `morph` target, `Visual`) + the shared copy block drawn by the showcase — client name, headline, `items[id].highlight`, **highlight tags** (`ProjectTagChips variant="highlights"` → category + `items[id].tags`) and CTA — placed per `layout` (`bottom-left` default, Emblema `center`, Plasico `top-left` with header clearance); no logo circles — brand marks are scene-specific (Emblema wordmark top-centre inside its world; Plasico wordmark on a white pill via the scene's `Overlay`, which the showcase renders *above* the morph shape with the same frame transform so the green bar passes behind it). Light worlds flip to dark text, dark CTA pill and `TAG_CHIP_LIGHT_CLASS`. `MorphOverlay` is the one pill shape that travels between worlds, interpolating each scene's `morph` target during the hand-over (nothing on Boleron/Emblema → Mindguard hairline, hidden while that scene animates its own wave line (`ownsShape`) → Plasico bottom bar → OSMO multiply-blended circle). Worlds: Boleron (purple, orbit rings, giant name, Roni as a 72-frame scroll-scrubbed `FrameSequence` from `public/projects/boleron/roni/`), Emblema (cream, gold glows/dust, the two buildings as a split 72-frame sequence from `public/projects/emblema/buildings/` with labels from `projects.showcase.scenes.emblema.buildings`), Mindguard (navy, teal rings + wave line, tablet frame), Plasico (white, giant green name, tilted tall card with the YouTube clip + a 16:9 frame playing the Bunny Stream film `PLASICO_WIDE_VIDEO` — Bunny (`iframe.mediadelivery.net`) sources build via `src/lib/bunny-stream.ts`; `null` shows the branded placeholder), OSMO (white, green orb, portrait frame + detail square); anything else gets `FallbackVisual` (accent gradient + clip). Primitives live in `projects/showcase-primitives.tsx` (`ParallaxLayer` depth/dx/rotate/scale vs. scene-local time, `Reveal` staggers, `Sparks` → `animate-showcase-rise`, `FrameSequence` — frames load only once the section is within 800px (`useInView`), nearest loaded frame is drawn meanwhile —, `EmbedCover` cover-fit background player (any `src` — YouTube or Bunny) for a box aspect, `ProjectEmbedCover` for a project's YouTube clip); `animate-showcase-breathe` is the slow glow/building pulse. Only the active project's neighbours mount a player. Stage furniture: "view all" pill top-right + right-hand rail (counter + one fill bar per project, also jump buttons), both `mix-blend-difference` so they read on light worlds. Reduced-motion users get the plain card list; big "view all" CTA follows; `/projects` lists all (quote CTA in the page header, category card on the left, floating scroll-revealed cards two-up and row-aligned on desktop - same in-frame standard as the showcase: the clip plays muted behind the copy via `ProjectBackdropMedia` once the card nears the viewport, logo circle + tag chips on top, headline + dominant "view project" pill at the bottom); `/projects/[slug]` is the case study (logo, chips + highlight tags, mission, stats, platforms, quote wizard). Slugs = `PROJECT_KEYS`, pre-rendered, in the sitemap |
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

### Dates
- **All dates shown to users — UI, emails, documents — use the `DD-MM-YYYY` format** (e.g. `05-09-2026`). Internal storage/transfer can stay ISO (`yyyy-mm-dd`); convert at the display boundary.

### Theming & visual conventions
- Page background (`ui/gradient-blur-bg.tsx`, fixed `z-[-1]` on every page): light theme is the "Bloom Field" mesh gradient (`.bloom-field-gradient` in `globals.css` - radial blobs tinted from the brand red -> violet gradient, plus grain); dark theme is the slate grid + magenta/violet orb (`.page-dark-grid-layer`). `ui/background-gradient-glow.tsx` (aurora) and `ui/grid-pattern.tsx` are unused primitives.
- **Dark is the default theme.** Dark text-card surfaces use `bg-card` (near-black slate `#0c111e`; light theme `#f7f8fb` — both defined once in `globals.css`). **Interactive surfaces** (selectable cards, dropzones, datepickers, slider boxes, form fields) use `bg-card-elevated`, which is *derived* via `color-mix()` from `--input`/`--background` over `--card` so retunes can't desync it; the nav/footer glass (`.liquid-glass*`) is likewise `color-mix()`-derived from `--card`, and standard card borders use `border-card-border`. Never hardcode dark card backgrounds (`dark:bg-neutral-950` etc.) — use these tokens so future cards inherit the standard.
  - `src/app/layout.tsx` renders `<html className="dark" style={{colorScheme:"dark"}}>` **server-side**. Keep it: `:root` is the light palette and next-themes' script runs from `<body>`, so without it the light theme flashes on every cold load (visibly, because `body` animates `background-color`). `defaultTheme="dark"` + `enableSystem={false}` handle the client side.
- Section headers: **centered** `h2` (`text-4xl md:text-5xl font-heading font-bold`, wrapper `text-center`) with an accent word in `text-section-accent`, subtitle `mx-auto max-w-2xl text-lg text-muted-foreground`. Page headers (`h1` on `/services`, `/projects`, …) stay left-aligned.
- Fonts: body/UI is **Fira Sans** (`--font-sans`), headings are **Sofia Sans** (variable 1–1000) via the `font-heading` utility (`--font-heading`). Both are **self-hosted through `next/font/google`** in `layout.tsx` with the `cyrillic` subset, and their `--font-*-sans` variables live on `<html>` — `--font-sans` / `--font-heading` resolve on `:root`, so defining them on `<body>` silently drops the family back to the Tailwind default. Uni Sans (`src/app/fonts/`) is no longer wired up.
- Portfolio "All" tab (on `/portfolio`) is a **hand-picked highlight reel** (`embedsForAll()`), not every clip. Category tabs show the full catalogue; `?category=<key>` pre-selects a tab.
- Partners render as scrolling marquee rows at **every** breakpoint (no static desktop grid), inside the hero. Keep `sizes` on the logos in step with their max rendered width.
- Hero copy sits bottom-left over the video on the `.hero-wash` overlay (`globals.css`, driven by `--background` so it is white in light and slate in dark). Headline uses `text-foreground` — never force white there.
- Desktop header (`site-header.tsx`) is a floating glass pill (`top-4`, 96% wide, rounded-full, drop shadow) like the mobile bar; nav links flow inline below `xl` (scrolling sideways) and are absolutely centred from `xl` up; Services and Training are hover/focus dropdowns (`NavDropdown`, panel on the same `liquid-glass-header` surface + deep shadow, 56px image tiles from `services.items` icons and `useTrainingCards()` photos, sources requested at 224px); nav links are absolutely centred on the bar; right side = theme toggle, click-to-call pill (`PHONE_PRIMARY` in `src/lib/contact-info.ts`, tinted surface so it reads as secondary in light theme), primary quote CTA with a send icon. Mobile keeps the dock (Projects · Contact · Services + menu; Portfolio is in the sheet) with plain links, no dropdowns. Anything that can sit at the bottom of a mobile viewport (e.g. the projects showcase rail) needs `pb-24` below `lg` to clear the fixed dock.
- `MAIN_WITH_FIXED_PAGE_BG_CLASS` uses `overflow-x-clip`, never `overflow-x-hidden` — `hidden` turns `<main>` into a scroll container and silently breaks every `position: sticky` inside it (projects showcase, portfolio controls).
- Home service cards use `ui/3d-card.tsx` (pointer-tracked tilt): `CardContainer` > `CardBody` > `ServiceCard depth`. `depth` makes the title/icon/link render as `CardItem`s that lift on hover, so it only works inside a `CardContainer` (`useMouseEnter` throws otherwise) - the `/services` page renders `ServiceCard` without it.
- **Every button — and every list/menu of buttons — gets a hover animation**, not just a colour change: a transform (lift, scale, nudge) plus a shadow or background shift, on a `transition-[...] duration-200 ease-out`. Examples to copy: `primaryGradientInteractiveClassName` (scale + deepening glow), the nav dropdown rows (`hover:translate-x-1` + tile scale + shadow), the category chips (`hover:-translate-y-[1px]`). Disabled states keep `cursor-not-allowed` and no motion.
- Interactive elements always get `cursor-pointer` (unless disabled). Breadcrumbs on all non-home pages (automatic via `PageBreadcrumbs`). Modals: full-viewport on mobile with a top-right X close.
- Images: use `next/image` with a `sizes` hint (qualities 75/100 are configured). Raw `<img>` only with an explicit reason.

### Forms & email
- Contact/training inquiry forms POST to `/api/contact` (includes the internal Bulgarian form label `formStateBg`); the home quote wizard POSTs multipart to `/api/quote` (attachments + option-keyed answers). Both send via Resend **to `info@dreamteam.technology`**, render HTML + plaintext, and share the hygiene layer in `src/lib/server/form-guards.ts`.
- Server-side validation is the contract: required name/email/message, length caps, honeypot (`website` must stay in forms, hidden), per-IP rate limit. Check `result.error` from Resend — never report success on failure.

### Quality gates
- `npm run build` **and** `npm run lint` must pass before finishing any change.
- If you ran `next build` locally, delete `.next` before `next dev` — stale production manifests cause dev 404s on dynamic routes.
- Keep changes minimal, production-ready, consistent with repo style. Report failures honestly.

## 5. Environment & deployment

- `.env.local`: `RESEND_API_KEY` (required for email), `RESEND_FROM` (optional, defaults to `info@dreamteam.technology`)
- Scripts: `npm run dev` / `build` / `start` / `lint`
- Hosted on Vercel; permanent redirects + security headers live in `next.config.ts` (retired `/zh` locale → `/en`)
