// User preferences persisted in localStorage (active filters, preferred view, page size, sort,
// comment author). useLocalStorage already guards against unavailable storage.
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { createEmptyFilters, type CandidatureFilters, type SortOption } from '@/types/filters'

export type ViewMode = 'liste' | 'tableau'

export const PAGE_SIZES = [10, 20, 50] as const

export const usePreferencesStore = defineStore('preferences', () => {
  const view = useLocalStorage<ViewMode>('cm:view', 'liste')
  const pageSize = useLocalStorage<number>('cm:page-size', 10)
  const sort = useLocalStorage<SortOption>('cm:sort', 'date-desc')
  const filters = useLocalStorage<CandidatureFilters>('cm:filters', createEmptyFilters(), {
    mergeDefaults: true,
  })
  const authorName = useLocalStorage<string>('cm:author', '')

  function resetFilters() {
    filters.value = createEmptyFilters()
  }

  return { view, pageSize, sort, filters, authorName, resetFilters }
})
