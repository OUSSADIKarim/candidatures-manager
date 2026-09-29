import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_URL, ApiError, request, toSearchParams } from '../http'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

/** A fetch that never answers, but rejects like the real one when its signal aborts. */
function hangingFetch(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  })
}

async function errorOf(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('toSearchParams', () => {
  it('repeats array values and skips empty ones', () => {
    const params = toSearchParams({ statut: ['A', 'B'], q: '', poste: undefined, _page: 2 })
    expect(params.toString()).toBe('statut=A&statut=B&_page=2')
  })
})

describe('request', () => {
  it('builds the URL and returns data with headers', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 1 }], { headers: { 'X-Total-Count': '12' } }))

    const { data, headers } = await request('/candidatures', { query: { _page: 1, _limit: 10 } })

    expect(fetchMock.mock.calls[0]![0]).toBe(`${API_URL}/candidatures?_page=1&_limit=10`)
    expect(data).toEqual([{ id: 1 }])
    expect(headers.get('X-Total-Count')).toBe('12')
  })

  it('sends a JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, statut: 'Accepté' }))

    await request('/candidatures/1', { method: 'PATCH', body: { statut: 'Accepté' } })

    const init = fetchMock.mock.calls[0]![1]!
    expect(init.method).toBe('PATCH')
    expect(init.body).toBe('{"statut":"Accepté"}')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('accepts an empty response body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    const { data } = await request('/candidatures/1', { method: 'DELETE' })

    expect(data).toBeNull()
  })

  it.each([
    [404, 'not_found'],
    [500, 'server'],
    [400, 'client'],
  ] as const)('maps HTTP %i to a "%s" error', async (status, kind) => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status }))

    const error = await errorOf(request('/candidatures/1'))

    expect(error.kind).toBe(kind)
    expect(error.status).toBe(status)
  })

  it('maps an unreachable server to a "network" error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    expect((await errorOf(request('/candidatures'))).kind).toBe('network')
  })

  it('maps an unreadable body to a "server" error', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>'))

    expect((await errorOf(request('/candidatures'))).kind).toBe('server')
  })

  it('times out', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(hangingFetch)

    const error = errorOf(request('/candidatures', { timeoutMs: 1000 }))
    await vi.advanceTimersByTimeAsync(1000)

    expect((await error).kind).toBe('timeout')
  })

  it('reports a cancellation by the caller as "aborted"', async () => {
    fetchMock.mockImplementation(hangingFetch)
    const controller = new AbortController()

    const error = errorOf(request('/candidatures', { signal: controller.signal }))
    controller.abort()

    expect((await error).kind).toBe('aborted')
  })

  it('reports a cancellation while the body is being read as "aborted"', async () => {
    const controller = new AbortController()
    const response = new Response('[]')
    vi.spyOn(response, 'text').mockImplementation(async () => {
      controller.abort()
      throw new DOMException('Aborted', 'AbortError')
    })
    fetchMock.mockResolvedValue(response)

    const error = await errorOf(request('/candidatures', { signal: controller.signal }))

    expect(error.kind).toBe('aborted')
  })
})
