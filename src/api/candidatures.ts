import type { Candidature } from '@/types/models'
import { request } from './http'
import { buildCandidaturesQuery, type ListParams } from './query'

export type NewCandidature = Omit<Candidature, 'id'>

export interface Paginated<T> {
  items: T[]
  total: number
}

/**
 * JSON Server validates nothing, so a record written by another client can miss fields.
 * Filling defaults here, at the boundary, keeps every component free of defensive checks.
 */
export function normalizeCandidature(raw: Partial<Candidature> & { id: number }): Candidature {
  return {
    id: raw.id,
    nom: raw.nom ?? '',
    poste: raw.poste ?? '',
    statut: raw.statut ?? '',
    competences: Array.isArray(raw.competences) ? raw.competences : [],
    experience: raw.experience ?? '',
    dateCandidature: raw.dateCandidature ?? '',
    email: raw.email ?? '',
    telephone: raw.telephone ?? '',
    cv: raw.cv ?? '',
    lettreMotivation: raw.lettreMotivation ?? '',
    salaireSouhaite: Number(raw.salaireSouhaite) || 0,
    disponibilite: raw.disponibilite ?? '',
    localisation: raw.localisation ?? '',
    commentaires: Array.isArray(raw.commentaires) ? raw.commentaires : [],
  }
}

export const candidaturesApi = {
  async list(params: ListParams, signal?: AbortSignal): Promise<Paginated<Candidature>> {
    const { data, headers } = await request<Candidature[]>('/candidatures', {
      query: buildCandidaturesQuery(params),
      signal,
    })
    // JSON Server only sends X-Total-Count when paginating.
    const total = Number(headers.get('X-Total-Count') ?? data.length)
    return { items: data.map(normalizeCandidature), total }
  },

  async get(id: number, signal?: AbortSignal): Promise<Candidature> {
    return normalizeCandidature(
      (await request<Candidature>(`/candidatures/${id}`, { signal })).data,
    )
  },

  async create(candidature: NewCandidature): Promise<Candidature> {
    return normalizeCandidature(
      (await request<Candidature>('/candidatures', { method: 'POST', body: candidature })).data,
    )
  },

  async patch(id: number, changes: Partial<Omit<Candidature, 'id'>>): Promise<Candidature> {
    return normalizeCandidature(
      (await request<Candidature>(`/candidatures/${id}`, { method: 'PATCH', body: changes })).data,
    )
  },

  async remove(id: number): Promise<void> {
    await request<unknown>(`/candidatures/${id}`, { method: 'DELETE' })
  },
}
