/**
 * Curio layout tokens — composition-first class bundles (Tailwind v4).
 * Use with `cn()` for consistent max-width, padding, and vertical rhythm.
 */

/** Full-width page background shell (public + dashboard content areas). */
export const pageShell =
  'min-h-[calc(100vh-4rem)] bg-[var(--surface-secondary)]';

/** Primary content column (~72rem / 1152px). Stripe/Linear-style reading width. */
export const content =
  'w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

/** Wider marketing / hero inner cap when needed. */
export const contentWide =
  'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10';

/** Standard section vertical rhythm. */
export const sectionY =
  'py-16 md:py-20 lg:py-24';

/** Tighter sections (below fold lists). */
export const sectionYCompact =
  'py-12 md:py-16 lg:py-20';

/** Hero bands — shorter, calmer than full viewport stacks. */
export const heroBand =
  'relative overflow-hidden bg-black-deep py-14 md:py-20 lg:py-24';

/** Soft glow behind hero titles (reuse on marketplace-style heroes). */
export const heroGlow =
  'pointer-events-none absolute left-1/2 top-1/2 h-[min(520px,80vw)] w-[min(520px,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-primary/[0.07] blur-[80px]';

/** Dashboard main column: breathable, not edge-stretched. */
export const dashboardMain =
  'w-full max-w-6xl mx-auto px-5 py-8 md:px-8 md:py-10 lg:py-12';

/** Stack spacing between major page blocks. */
export const stackPage =
  'flex flex-col gap-10 md:gap-12';

/** Subtle elevated surface (cards / panels) — ring only, no harsh border. */
export const surfacePanel =
  'rounded-[var(--radius-lg)] bg-[var(--surface-primary)] shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]';

/** Filters / toolbar row — light separation without boxing. */
export const filterBar =
  'flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[var(--radius-lg)] bg-[var(--surface-primary)]/80 px-4 py-4 md:px-5 md:py-4 ring-1 ring-black/[0.03] dark:ring-white/[0.05]';

/** Responsive product / artisan grids — editorial spacing, not cramped 4-col glue. */
export const gridCards =
  'grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4';

export const gridCardsDense =
  'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8';

/** Dashboard stat tile — subtle top highlight, no heavy border. */
export const dashboardStatCard =
  'rounded-[var(--radius-lg)] bg-[var(--surface-primary)] p-5 shadow-sm ring-1 ring-black/[0.04] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_55%),var(--surface-primary)] dark:ring-white/[0.06] md:p-6';

/** Dashboard list panel shell. */
export const dashboardPanel =
  'flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-primary)] shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]';

export const dashboardPanelHead =
  'flex items-center justify-between border-b border-black/[0.04] bg-[var(--surface-secondary)]/25 px-5 py-4 dark:border-white/[0.05] md:px-6 md:py-4';
