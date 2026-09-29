const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const MISSING = '—'

/** Intl formatters throw on an invalid date: one bad record must not break a whole view. */
function formatWith(formatter: Intl.DateTimeFormat, iso: string | null | undefined): string {
  const date = new Date(iso ?? '')
  return Number.isNaN(date.getTime()) ? MISSING : formatter.format(date)
}

export const formatDate = (iso: string | null | undefined) => formatWith(dateFormatter, iso)
export const formatDateTime = (iso: string | null | undefined) => formatWith(dateTimeFormatter, iso)
export const formatCurrency = (amount: number) => currencyFormatter.format(amount)

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count > 1 ? plural : singular}`
}
