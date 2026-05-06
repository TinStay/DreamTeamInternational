# DreamTeamWeb – Working Rules (from this chat)

These rules are **project-local requirements** agreed during the current chat and should be followed for future work in this repo.

## Architecture / Conventions
- **Use existing patterns first**: prefer reusing or extending existing components/utilities instead of duplicating logic.
- **shadcn + Tailwind + TypeScript**: all new UI must be TypeScript-first and styled with Tailwind, following the shadcn-style component conventions already used in `src/components/ui`.
- **Component location**: place reusable UI primitives in `src/components/ui/`.
- **Avoid inline CSS-in-JS**: do not use `style jsx`; prefer Tailwind or shared CSS in `src/app/globals.css`.

## UI/UX Requirements
- **Buttons must be clickable**: any interactive button-like element must have a **pointer cursor** (`cursor-pointer`) unless explicitly disabled.
- **Modals**:
  - Mobile: modal overlays should be **full-viewport** (`100vw` / `100vh` or `100dvh`) with a clear **X close** action on the top-right.
  - Desktop: modal sizing and layout should follow the design requirements in the latest ticket/message; avoid unexpected scroll traps.
- **Breadcrumbs**: non-home pages should show breadcrumbs at the top (home pages should not).

## Forms / Email (Resend)
- All website and training inquiry forms should POST to the server route and send email via **Resend**.
- Delivery target: **always send to** `info@dreamteam.technology`.
- Include a moderator-only internal label in Bulgarian (**`formStateBg`**) indicating which form was used.
- Email should include a clean **HTML template** plus a plaintext fallback.

## Engineering Quality
- Keep changes **minimal, production-ready, and consistent** with repo style.
- After edits, ensure `npm run build` passes.

