import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => vi.unstubAllEnvs())

  it('maps filters, sort and pagination to JSON Server params', () => {
    const query = buildCandidaturesQuery({
      filters: { ...createEmptyFilters(), q: '  Paris ', statuts: ['En attente', 'Refusé'] },
      sort: 'date-desc',
      page: 2,
      limit: 10,
    })

    expect(query).toMatchObject({
      q: 'Paris',
      statut: ['En attente', 'Refusé'],
      _sort: 'dateCandidature',
      _order: 'desc',
      _page: 2,
      _limit: 10,
    })
    expect(query.dateCandidature_gte).toBeUndefined()
    expect(query.dateCandidature_lte).toBeUndefined()
  })

  describe('date range', () => {
    // JSON Server compares the stored value and the bound as strings.
    const inRange = (stored: string, query: ReturnType<typeof buildCandidaturesQuery>) =>
      stored >= String(query.dateCandidature_gte) && stored <= String(query.dateCandidature_lte)

    const queryFor = (dateFrom: string, dateTo: string) =>
      buildCandidaturesQuery({
        filters: { ...createEmptyFilters(), dateFrom, dateTo },
        sort: 'date-desc',
      })

    it('uses the local day, converted to UTC', () => {
      vi.stubEnv('TZ', 'Europe/Paris') // UTC+1 in January
      const query = queryFor('2024-01-16', '2024-01-16')

      expect(query.dateCandidature_gte).toBe('2024-01-15T23:00:00')
      expect(query.dateCandidature_lte).toBe('2024-01-16T22:59:59Z')
      // 23:30 UTC on the 15th is 00:30 on the 16th in Paris: displayed as the 16th, so included.
      expect(inRange('2024-01-15T23:30:00Z', query)).toBe(true)
      expect(inRange('2024-01-15T22:59:59Z', query)).toBe(false)
      expect(inRange('2024-01-16T23:00:00Z', query)).toBe(false)
    })

    it('includes the first and last instants of the day, with or without milliseconds', () => {
      vi.stubEnv('TZ', 'UTC')
      const query = queryFor('2024-01-10', '2024-01-20')

      for (const stored of [
        '2024-01-10T00:00:00Z',
        '2024-01-10T00:00:00.000Z',
        '2024-01-20T23:59:59Z',
        '2024-01-20T23:59:59.999Z',
      ]) {
        expect(inRange(stored, query)).toBe(true)
      }
      expect(inRange('2024-01-09T23:59:59.999Z', query)).toBe(false)
      expect(inRange('2024-01-21T00:00:00Z', query)).toBe(false)
    })

    it('ignores an invalid date', () => {
      const query = queryFor('not-a-date', '')

      expect(query.dateCandidature_gte).toBeUndefined()
      expect(query.dateCandidature_lte).toBeUndefined()
    })
  })
})
