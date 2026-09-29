import type { Competence, Poste, Statut } from '@/types/models'
import { request } from './http'

export const referentielsApi = {
  async statuts(): Promise<Statut[]> {
    return (await request<Statut[]>('/statuts', { query: { _sort: 'ordre', _order: 'asc' } })).data
  },
  async postes(): Promise<Poste[]> {
    return (await request<Poste[]>('/postes', { query: { _sort: 'titre' } })).data
  },
  async competences(): Promise<Competence[]> {
    return (await request<Competence[]>('/competences', { query: { _sort: 'nom' } })).data
  },
}
