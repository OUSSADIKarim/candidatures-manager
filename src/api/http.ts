// Thin fetch wrapper: base URL, query strings, timeout, cancellation and typed errors.

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const DEFAULT_TIMEOUT_MS = 8000

export type ApiErrorKind = 'network' | 'timeout' | 'aborted' | 'not_found' | 'server' | 'client'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

export type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue | QueryValue[]>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Query
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

export interface ApiResponse<T> {
  data: T
  headers: Headers
}

/** Serializes a query object; arrays become repeated keys (`statut=a&statut=b`). */
export function toSearchParams(query: Query = {}): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, raw] of Object.entries(query)) {
    for (const value of Array.isArray(raw) ? raw : [raw]) {
      if (value === null || value === undefined || value === '') continue
      params.append(key, String(value))
    }
  }
  return params
}

function errorFromStatus(status: number): ApiError {
  if (status === 404) return new ApiError('not_found', 'Ressource introuvable.', status)
  if (status >= 500) return new ApiError('server', `Erreur serveur (${status}).`, status)
  return new ApiError('client', `Requête invalide (${status}).`, status)
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', query, body, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options

  // One controller aborted by either the timeout or the caller's signal.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onCallerAbort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', onCallerAbort, { once: true })

  const search = toSearchParams(query).toString()
  const url = `${API_URL}${path}${search ? `?${search}` : ''}`

  // The timeout and cancellation cover the whole exchange, including reading the body.
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) throw errorFromStatus(response.status)

    const text = await response.text()
    // Some responses have no body (204, some DELETE implementations).
    const data = (text ? JSON.parse(text) : null) as T
    return { data, headers: response.headers }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (timedOut) throw new ApiError('timeout', 'Le serveur met trop de temps à répondre.')
    if (signal?.aborted) throw new ApiError('aborted', 'Requête annulée.')
    if (error instanceof SyntaxError) {
      throw new ApiError('server', 'Réponse du serveur illisible.')
    }
    throw new ApiError('network', 'Impossible de joindre le serveur.')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'aborted'
}
