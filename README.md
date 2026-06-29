# DreamTeam Web

Marketing site for **DreamTeam**, an AI video production agency. Built with Next.js 16 (App Router) and React 19.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**, TypeScript
- **Tailwind CSS v4** with shadcn-style UI primitives in `src/components/ui`
- **Motion** (`motion` / `framer-motion`) for animation
- **Resend** for contact & training inquiry emails
- **PostHog** + **Vercel Analytics**

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

The root path redirects `/` → `/bg`. Localized pages live under `src/app/[lang]` and support `bg` and `en`.

## Environment

Create a `.env.local` file:

```bash
RESEND_API_KEY=...                      # required for the contact form to send mail
RESEND_FROM=info@dreamteam.technology   # optional; defaults to this address
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## Project layout

- `src/app/[lang]/` — locale-aware pages (home, contact, training, privacy, terms)
- `src/app/api/contact/` — contact & training inquiry endpoint (Resend)
- `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` — SEO/social metadata
- `src/components/` — page sections and UI components
- `src/lib/i18n/` — dictionaries (`bg.ts`, `en.ts`), `config.ts`, and the language context
