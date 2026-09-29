import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, initials, pluralize } from '../format'

describe('formatDate', () => {
  it('formats an ISO date in French', () => {
    expect(formatDate('2024-01-15T10:30:00Z')).toBe('15 janv. 2024')
  })

  it.each(['', 'not-a-date', null, undefined])('shows a placeholder for %s', (value) => {
    expect(formatDate(value)).toBe('—')
    expect(formatDateTime(value)).toBe('—')
  })
})

describe('initials', () => {
  it('keeps the first two words', () => {
    expect(initials('Sophie Martin')).toBe('SM')
    expect(initials('  jean  de la fontaine ')).toBe('JD')
    expect(initials('')).toBe('')
  })
})

describe('pluralize', () => {
  it('agrees with the count', () => {
    expect(pluralize(0, 'candidature')).toBe('0 candidature')
    expect(pluralize(1, 'candidature')).toBe('1 candidature')
    expect(pluralize(12, 'candidature')).toBe('12 candidatures')
  })
})
