import { createSharedComposable, useMediaQuery } from '@vueuse/core'

/**
 * Tailwind's `md` breakpoint. Below it the app is list-only (cards instead of a table, no
 * board): a kanban loses its point when a single column fills the screen.
 */
export const useIsDesktop = createSharedComposable(() => useMediaQuery('(min-width: 768px)'))
