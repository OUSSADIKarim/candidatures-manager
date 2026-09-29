/**
 * Returns the URL only if it is a web link. `javascript:`, `data:` and the like are valid URLs
 * but run code or embed content when used as a link target, so they are rejected.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}
