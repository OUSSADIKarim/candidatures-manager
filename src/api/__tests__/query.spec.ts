import { describe, expect, it } from 'vitest'
import { buildCandidaturesQuery, buildSkillsPattern } from '../query'
import { createEmptyFilters } from '@/types/filters'

// JSON Server tests `competences_like` against the array serialized as "a,b,c".
const matches = (pattern: string | undefined, skills: string[]) =>
  new RegExp(pattern ?? '', 'i').test(skills.join(','))

describe('buildSkillsPattern', () => {
  it('returns undefined without skills', () => {
    expect(buildSkillsPattern([], 'all')).toBeUndefined()
  })

  it('requires every skill in "all" mode', () => {
    const pattern = buildSkillsPattern(['Vue.js', 'Docker'], 'all')
    expect(matches(pattern, ['Vue.js', 'Node.js', 'Docker'])).toBe(true)
    expect(matches(pattern, ['Vue.js', 'Node.js'])).toBe(false)
  })

  it('requires at least one skill in "any" mode', () => {
    const pattern = buildSkillsPattern(['React', 'Docker'], 'any')
    expect(matches(pattern, ['Vue.js', 'Docker'])).toBe(true)
    expect(matches(pattern, ['Vue.js', 'Node.js'])).toBe(false)
  })

  it('escapes regex characters and matches whole skills only', () => {
    const pattern = buildSkillsPattern(['Vue.js'], 'all')
    expect(matches(pattern, ['Vuexjs'])).toBe(false)
    expect(matches(pattern, ['Vue.js 2'])).toBe(false)
  })
})

describe('buildCandidaturesQuery', () => {
  it('maps filters, sort and pagination to JSON Server params', () => {
    const query = buildCandidaturesQuery({
      filters: {
        ...createEmptyFilters(),
        q: '  Paris ',
        statuts: ['En attente', 'Refusé'],
        dateFrom: '2024-01-10',
        dateTo: '2024-01-20',
      },
      sort: 'date-desc',
      page: 2,
      limit: 10,
    })

    expect(query).toMatchObject({
      q: 'Paris',
      statut: ['En attente', 'Refusé'],
      dateCandidature_gte: '2024-01-10',
      // Inclusive upper bound: ISO timestamps of that day compare greater than "2024-01-20".
      dateCandidature_lte: '2024-01-20T23:59:59.999Z',
      _sort: 'dateCandidature',
      _order: 'desc',
      _page: 2,
      _limit: 10,
    })
  })
})
