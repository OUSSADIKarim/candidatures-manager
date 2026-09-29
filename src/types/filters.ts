export type SkillMatchMode = 'all' | 'any'

export type SortOption = 'date-desc' | 'date-asc' | 'nom-asc' | 'nom-desc'

export interface CandidatureFilters {
  q: string
  statuts: string[]
  postes: string[]
  competences: string[]
  competencesMode: SkillMatchMode
  dateFrom: string | null // YYYY-MM-DD
  dateTo: string | null // YYYY-MM-DD
}

export function createEmptyFilters(): CandidatureFilters {
  return {
    q: '',
    statuts: [],
    postes: [],
    competences: [],
    competencesMode: 'all',
    dateFrom: null,
    dateTo: null,
  }
}

/** Number of active filter groups, excluding the full-text search. */
export function countActiveFilters(filters: CandidatureFilters): number {
  return [
    filters.statuts.length > 0,
    filters.postes.length > 0,
    filters.competences.length > 0,
    Boolean(filters.dateFrom || filters.dateTo),
  ].filter(Boolean).length
}
