/**
 * `<main>` shell for pages that mount {@link GradientBlurPageBg} as a fixed `z-[-1]` layer.
 * Keeps home, training, and contact/process layouts visually aligned.
 *
 * `overflow-x-clip` (not `hidden`): `hidden` turns <main> into a scroll
 * container, which breaks `position: sticky` for the scroll-driven projects
 * showcase and the portfolio controls. `clip` only clips, no scrollport.
 */
export const MAIN_WITH_FIXED_PAGE_BG_CLASS =
  "relative flex min-h-screen flex-col overflow-x-clip";
