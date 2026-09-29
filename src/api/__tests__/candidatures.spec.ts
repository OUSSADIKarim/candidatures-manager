import { describe, expect, it } from 'vitest'
import { normalizeCandidature } from '../candidatures'

describe('normalizeCandidature', () => {
  it('fills defaults for a record with missing fields', () => {
    expect(normalizeCandidature({ id: 7, nom: 'Nora Test' })).toEqual({
      id: 7,
      nom: 'Nora Test',
      poste: '',
      statut: '',
      competences: [],
      experience: '',
      dateCandidature: '',
      email: '',
      telephone: '',
      cv: '',
      lettreMotivation: '',
      salaireSouhaite: 0,
      disponibilite: '',
      localisation: '',
      commentaires: [],
    })
  })

  it('keeps a complete record unchanged', () => {
    const complete = normalizeCandidature({
      id: 1,
      nom: 'Sophie Martin',
      competences: ['Vue.js'],
      salaireSouhaite: 45000,
      commentaires: [{ id: 1, auteur: 'Marie', date: '2024-01-20T10:00:00Z', contenu: 'Vu' }],
    })

    expect(normalizeCandidature(complete)).toEqual(complete)
  })
})
