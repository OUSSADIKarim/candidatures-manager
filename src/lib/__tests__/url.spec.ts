import { describe, expect, it } from 'vitest'
import { safeHttpUrl } from '../url'

describe('safeHttpUrl', () => {
  it.each(['https://example.com/cv/sophie.pdf', 'http://example.com/cv.pdf'])(
    'accepts %s',
    (url) => {
      expect(safeHttpUrl(url)).toBe(url)
    },
  )

  it('trims surrounding spaces', () => {
    expect(safeHttpUrl('  https://example.com/cv.pdf ')).toBe('https://example.com/cv.pdf')
  })

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'example.com/cv.pdf',
    '',
    null,
    undefined,
  ])('rejects %s', (url) => {
    expect(safeHttpUrl(url)).toBeNull()
  })
})
