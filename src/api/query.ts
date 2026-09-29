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

/**
 * The recruiter picks local calendar days while stored dates are UTC instants: the bounds are
 * the local start and end of day, converted to UTC. JSON Server compares them as strings, and
 * stored dates come with or without milliseconds ("…:00Z", "…:00.123Z"), hence the formats:
 * the lower bound has no suffix (sorts before any instant of that second), the upper one ends
 * with "Z" (sorts after any millisecond of that second).
 */
function localDayBound(day: string | null, edge: 'start' | 'end'): string | undefined {
  if (!day) return undefined
  const date = new Date(`${day}T${edge === 'start' ? '00:00:00' : '23:59:59'}`)
  if (Number.isNaN(date.getTime())) return undefined
  const instant = date.toISOString().slice(0, 19)
  return edge === 'start' ? instant : `${instant}Z`
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
    dateCandidature_gte: localDayBound(filters.dateFrom, 'start'),
    dateCandidature_lte: localDayBound(filters.dateTo, 'end'),
    ...SORTS[sort],
    _page: page,
    _limit: limit,
  }
}
