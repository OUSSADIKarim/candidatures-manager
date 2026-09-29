// Translates UI filters into JSON Server (v0.17) query params.
import type { CandidatureFilters, SortOption } from '@/types/filters'
import type { Query } from './http'

const SORTS: Record<SortOption, { _sort: string; _order: 'asc' | 'desc' }> = {
  'date-desc': { _sort: 'dateCandidature', _order: 'desc' },
  'date-asc': { _sort: 'dateCandidature', _order: 'asc' },
  'nom-asc': { _sort: 'nom', _order: 'asc' },
  'nom-desc': { _sort: 'nom', _order: 'desc' },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * `competences_like` is tested as a regex against the array serialized as "a,b,c".
 * Each skill is anchored between commas so "Vue.js" cannot match "Vue.js 2" or "XVue.js".
 * - any: one alternation, `(^|,)(A|B)(,|$)`
 * - all: one lookahead per skill, `^(?=.*(^|,)A(,|$))(?=.*(^|,)B(,|$))`
 */
export function buildSkillsPattern(skills: string[], mode: 'all' | 'any'): string | undefined {
  if (skills.length === 0) return undefined
  const escaped = skills.map(escapeRegExp)
  if (mode === 'any') return `(^|,)(${escaped.join('|')})(,|$)`
  return `^${escaped.map((skill) => `(?=.*(^|,)${skill}(,|$))`).join('')}`
}

export interface ListParams {
  filters: CandidatureFilters
  sort: SortOption
  page?: number
  limit?: number
}

export function buildCandidaturesQuery({ filters, sort, page, limit }: ListParams): Query {
  return {
    q: filters.q.trim() || undefined,
    statut: filters.statuts,
    poste: filters.postes,
    competences_like: buildSkillsPattern(filters.competences, filters.competencesMode),
    // Dates are ISO strings compared lexicographically: widen the upper bound to the end of the day.
    dateCandidature_gte: filters.dateFrom ?? undefined,
    dateCandidature_lte: filters.dateTo ? `${filters.dateTo}T23:59:59.999Z` : undefined,
    ...SORTS[sort],
    _page: page,
    _limit: limit,
  }
}
