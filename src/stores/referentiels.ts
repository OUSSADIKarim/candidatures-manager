// Reference data (statuts, postes, compétences): rarely modified, so fetched once and cached
// for the session. `load({ force: true })` refreshes it.
import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { referentielsApi } from '@/api/referentiels'
import type { Competence, Poste, Statut } from '@/types/models'
import type { LoadStatus } from './types'

const FALLBACK_COLOR = '#94a3b8'

export const useReferentielsStore = defineStore('referentiels', () => {
  const statuts = ref<Statut[]>([])
  const postes = ref<Poste[]>([])
  const competences = ref<Competence[]>([])
  const status = ref<LoadStatus>('idle')
  const error = shallowRef<unknown>(null)
  let pending: Promise<void> | null = null

  const statutByNom = computed(() => new Map(statuts.value.map((s) => [s.nom, s])))

  function colorOf(statut: string): string {
    return statutByNom.value.get(statut)?.couleur ?? FALLBACK_COLOR
  }

  function load({ force = false } = {}): Promise<void> {
    if (status.value === 'success' && !force) return Promise.resolve()
    if (pending) return pending

    status.value = 'loading'
    error.value = null
    pending = Promise.all([
      referentielsApi.statuts(),
      referentielsApi.postes(),
      referentielsApi.competences(),
    ])
      .then(([s, p, c]) => {
        statuts.value = s
        postes.value = p
        competences.value = c
        status.value = 'success'
      })
      .catch((e: unknown) => {
        error.value = e
        status.value = 'error'
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  return { statuts, postes, competences, status, error, statutByNom, colorOf, load }
})
