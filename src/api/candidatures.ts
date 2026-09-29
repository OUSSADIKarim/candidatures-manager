import type { Candidature } from '@/types/models'
import { request } from './http'
import { buildCandidaturesQuery, type ListParams } from './query'

export type NewCandidature = Omit<Candidature, 'id'>

export interface Paginated<T> {
  items: T[]
  total: number
}

export const candidaturesApi = {
  async list(params: ListParams, signal?: AbortSignal): Promise<Paginated<Candidature>> {
    const { data, headers } = await request<Candidature[]>('/candidatures', {
      query: buildCandidaturesQuery(params),
      signal,
    })
    // JSON Server only sends X-Total-Count when paginating.
    const total = Number(headers.get('X-Total-Count') ?? data.length)
    return { items: data, total }
  },

  async get(id: number, signal?: AbortSignal): Promise<Candidature> {
    return (await request<Candidature>(`/candidatures/${id}`, { signal })).data
  },

  async create(candidature: NewCandidature): Promise<Candidature> {
    return (await request<Candidature>('/candidatures', { method: 'POST', body: candidature })).data
  },

  async patch(id: number, changes: Partial<Omit<Candidature, 'id'>>): Promise<Candidature> {
    return (await request<Candidature>(`/candidatures/${id}`, { method: 'PATCH', body: changes }))
      .data
  },

  async remove(id: number): Promise<void> {
    await request<unknown>(`/candidatures/${id}`, { method: 'DELETE' })
  },
}
