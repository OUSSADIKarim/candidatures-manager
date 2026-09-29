import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { candidaturesApi } from '@/api/candidatures'
import { ApiError } from '@/api/http'
import type { Candidature } from '@/types/models'
import { useCandidaturesStore } from '../candidatures'

// Automock: every candidaturesApi method becomes a typed mock, no request is sent.
vi.mock('@/api/candidatures')

const api = vi.mocked(candidaturesApi)

function candidature(overrides: Partial<Candidature> = {}): Candidature {
  return {
    id: 1,
    nom: 'Sophie Martin',
    poste: 'Développeur Full Stack',
    statut: 'En attente',
    competences: ['Vue.js'],
    experience: '3 ans',
    dateCandidature: '2024-01-15T10:30:00Z',
    email: 'sophie.martin@email.com',
    telephone: '',
    cv: '',
    lettreMotivation: '',
    salaireSouhaite: 45000,
    disponibilite: 'Immédiate',
    localisation: 'Paris, France',
    commentaires: [],
    ...overrides,
  }
}

/** A promise resolved or rejected by the test, to control when the "server" answers. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const networkError = () => new ApiError('network', 'Impossible de joindre le serveur.')

/** Store with candidature 1 loaded in the list and in its board column. */
async function setup(items: Candidature[] = [candidature()]) {
  const store = useCandidaturesStore()
  api.list.mockImplementation(async ({ filters }) => {
    const matching = filters.statuts.length
      ? items.filter((c) => filters.statuts.includes(c.statut))
      : items
    return { items: structuredClone(matching), total: matching.length }
  })
  await store.fetchList()
  await store.fetchBoard(['En attente', 'Entretien RH', 'Accepté'])
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.resetAllMocks()
})

describe('updateStatus', () => {
  it('applies the new status before the server answers, then confirms it', async () => {
    const store = await setup()
    const patch = deferred<Candidature>()
    api.patch.mockReturnValue(patch.promise)

    const result = store.updateStatus(1, 'Entretien RH')

    expect(store.getById(1)?.statut).toBe('Entretien RH')
    expect(store.pendingStatusIds.has(1)).toBe(true)
    expect(store.columnItems('Entretien RH').map((c) => c.id)).toEqual([1])
    expect(store.columnItems('En attente')).toEqual([])
    expect(store.column('En attente').total).toBe(0)
    expect(store.column('Entretien RH').total).toBe(1)

    patch.resolve(candidature({ statut: 'Entretien RH' }))

    expect(await result).toEqual({ status: 'saved' })
    expect(api.patch).toHaveBeenCalledWith(1, { statut: 'Entretien RH' })
    expect(store.pendingStatusIds.has(1)).toBe(false)
    expect(store.getById(1)?.statut).toBe('Entretien RH')
  })

  it('rolls back to the confirmed status when the request fails', async () => {
    const store = await setup()
    api.patch.mockRejectedValue(networkError())

    const result = await store.updateStatus(1, 'Accepté')

    expect(result.status).toBe('failed')
    expect(store.getById(1)?.statut).toBe('En attente')
    expect(store.columnItems('En attente').map((c) => c.id)).toEqual([1])
    expect(store.columnItems('Accepté')).toEqual([])
    expect(store.column('En attente').total).toBe(1)
    expect(store.column('Accepté').total).toBe(0)
    expect(store.pendingStatusIds.has(1)).toBe(false)
  })

  it('sends quick successive changes in order and skips the overtaken ones', async () => {
    const store = await setup()
    const first = deferred<Candidature>()
    api.patch.mockReturnValueOnce(first.promise)
    api.patch.mockImplementation(async (_id, changes) => candidature(changes))

    const toRh = store.updateStatus(1, 'Entretien RH')
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1))
    // Two more changes while the first request is in flight: they wait for it.
    const toAccepte = store.updateStatus(1, 'Accepté')
    const toAttente = store.updateStatus(1, 'En attente')
    await Promise.resolve()

    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(store.getById(1)?.statut).toBe('En attente')

    first.resolve(candidature({ statut: 'Entretien RH' }))

    expect(await toRh).toEqual({ status: 'superseded' })
    expect(await toAccepte).toEqual({ status: 'superseded' })
    expect(await toAttente).toEqual({ status: 'saved' })
    // "Accepté" was overtaken before being sent: never requested.
    expect(api.patch.mock.calls.map(([, changes]) => changes.statut)).toEqual([
      'Entretien RH',
      'En attente',
    ])
    expect(store.getById(1)?.statut).toBe('En attente')
    expect(store.pendingStatusIds.has(1)).toBe(false)
  })

  it('rolls back to the last status the server accepted, not the initial one', async () => {
    const store = await setup()
    const first = deferred<Candidature>()
    api.patch.mockReturnValueOnce(first.promise)
    api.patch.mockRejectedValueOnce(networkError())

    const toRh = store.updateStatus(1, 'Entretien RH')
    await vi.waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1))
    const toAccepte = store.updateStatus(1, 'Accepté')
    first.resolve(candidature({ statut: 'Entretien RH' }))

    expect(await toRh).toEqual({ status: 'superseded' })
    expect((await toAccepte).status).toBe('failed')
    expect(store.getById(1)?.statut).toBe('Entretien RH')
    expect(store.columnItems('Entretien RH').map((c) => c.id)).toEqual([1])
  })

  it('keeps the optimistic status when a refetch lands while the change is pending', async () => {
    const store = await setup()
    const patch = deferred<Candidature>()
    api.patch.mockReturnValue(patch.promise)

    const result = store.updateStatus(1, 'Entretien RH')
    await store.fetchList() // the server still answers "En attente"

    expect(store.getById(1)?.statut).toBe('Entretien RH')

    patch.resolve(candidature({ statut: 'Entretien RH' }))
    await result
    expect(store.getById(1)?.statut).toBe('Entretien RH')
  })
})

describe('addComment', () => {
  const payload = { contenu: 'Très bon profil', auteur: 'Marie' }

  it('shows the comment as pending, then saves it on top of the latest server list', async () => {
    const store = await setup()
    const colleague = { id: 99, auteur: 'Pierre', date: '2024-01-20T10:00:00Z', contenu: 'Vu' }
    const get = deferred<Candidature>()
    api.get.mockReturnValue(get.promise)
    api.patch.mockImplementation(async (_id, changes) => candidature(changes))

    const result = store.addComment(1, payload)

    expect(store.commentsOf(1)).toMatchObject([{ ...payload, syncState: 'pending' }])

    // A colleague commented meanwhile: their comment must survive our save.
    get.resolve(candidature({ commentaires: [colleague] }))

    expect(await result).toEqual({ status: 'saved' })
    const sent = api.patch.mock.calls[0]![1].commentaires!
    expect(sent).toMatchObject([colleague, payload])
    expect(sent[1]).not.toHaveProperty('syncState')
    expect(store.pendingComments[1]).toEqual([])
    expect(store.commentsOf(1)).toMatchObject([colleague, payload])
  })

  it('keeps a failed comment and saves it exactly once on retry', async () => {
    const store = await setup()
    api.get.mockRejectedValueOnce(networkError())

    const result = await store.addComment(1, payload)

    expect(result.status).toBe('failed')
    expect(store.commentsOf(1)).toMatchObject([{ ...payload, syncState: 'failed' }])
    expect(api.patch).not.toHaveBeenCalled()

    // The first attempt actually reached the server (e.g. timeout after the write).
    const commentId = store.pendingComments[1]![0]!.id
    const alreadySaved = { id: commentId, date: '2024-01-20T10:00:00Z', ...payload }
    api.get.mockResolvedValue(candidature({ commentaires: [alreadySaved] }))
    api.patch.mockImplementation(async (_id, changes) => candidature(changes))

    expect(await store.retryComment(1, commentId)).toEqual({ status: 'saved' })
    expect(api.patch.mock.calls[0]![1].commentaires).toHaveLength(1)
    expect(store.commentsOf(1)).toHaveLength(1)
  })

  it('saves two quick comments one after the other, losing neither', async () => {
    const store = await setup()
    let server = candidature()
    api.get.mockImplementation(async () => structuredClone(server))
    api.patch.mockImplementation(async (_id, changes) => {
      server = { ...server, ...changes }
      return structuredClone(server)
    })

    await Promise.all([
      store.addComment(1, { contenu: 'Premier', auteur: 'Marie' }),
      store.addComment(1, { contenu: 'Second', auteur: 'Marie' }),
    ])

    expect(server.commentaires.map((c) => c.contenu)).toEqual(['Premier', 'Second'])
    expect(store.commentsOf(1).map((c) => c.contenu)).toEqual(['Premier', 'Second'])
  })

  it('removes a discarded comment', async () => {
    const store = await setup()
    api.get.mockRejectedValue(networkError())
    await store.addComment(1, payload)

    store.discardComment(1, store.pendingComments[1]![0]!.id)

    expect(store.commentsOf(1)).toEqual([])
  })
})

describe('remove', () => {
  const items = [
    candidature({ id: 1 }),
    candidature({ id: 2, nom: 'Thomas Dubois' }),
    candidature({ id: 3, nom: 'Emma Leroy' }),
  ]

  it('removes the candidature immediately and asks views to refetch once deleted', async () => {
    const store = await setup(items)
    const remove = deferred<void>()
    api.remove.mockReturnValue(remove.promise)

    const result = store.remove(2)

    expect(store.listItems.map((c) => c.id)).toEqual([1, 3])
    expect(store.list.total).toBe(2)
    expect(store.columnItems('En attente').map((c) => c.id)).toEqual([1, 3])

    remove.resolve()

    expect(await result).toEqual({ status: 'saved' })
    expect(store.getById(2)).toBeUndefined()
    expect(store.revision).toBe(1)
  })

  it('puts the candidature back in place when the deletion fails', async () => {
    const store = await setup(items)
    api.remove.mockRejectedValue(networkError())

    const result = await store.remove(2)

    expect(result.status).toBe('failed')
    expect(store.listItems.map((c) => c.id)).toEqual([1, 2, 3])
    expect(store.list.total).toBe(3)
    expect(store.columnItems('En attente').map((c) => c.id)).toEqual([1, 2, 3])
    expect(store.column('En attente').total).toBe(3)
    expect(store.revision).toBe(0)
  })

  it('treats "already deleted" (404) as a success', async () => {
    const store = await setup(items)
    api.remove.mockRejectedValue(new ApiError('not_found', 'Ressource introuvable.', 404))

    expect(await store.remove(2)).toEqual({ status: 'saved' })
    expect(store.listItems.map((c) => c.id)).toEqual([1, 3])
  })
})

describe('create', () => {
  it('stores the created candidature and asks views to refetch', async () => {
    const store = await setup()
    const { id: _id, ...input } = candidature({ nom: 'Nora Test' })
    api.create.mockResolvedValue(candidature({ id: 13, nom: 'Nora Test' }))

    const created = await store.create(input)

    expect(created.id).toBe(13)
    expect(store.getById(13)?.nom).toBe('Nora Test')
    expect(store.revision).toBe(1)
  })

  it('lets the error through so the form can show it', async () => {
    const store = await setup()
    const { id: _id, ...input } = candidature()
    api.create.mockRejectedValue(networkError())

    await expect(store.create(input)).rejects.toBeInstanceOf(ApiError)
    expect(store.revision).toBe(0)
  })
})

describe('fetchList', () => {
  it('exposes the error and keeps the previous items when a refresh fails', async () => {
    const store = await setup()
    api.list.mockRejectedValue(networkError())

    await store.fetchList()

    expect(store.list.status).toBe('error')
    expect(store.list.error).toBeInstanceOf(ApiError)
    expect(store.listItems.map((c) => c.id)).toEqual([1])
  })

  it('ignores a cancelled request', async () => {
    const store = await setup()
    api.list.mockRejectedValue(new ApiError('aborted', 'Requête annulée.'))

    await store.fetchList()

    expect(store.list.status).not.toBe('error')
  })

  it('falls back to the last page when the current one no longer exists', async () => {
    const store = useCandidaturesStore()
    api.list.mockImplementation(async ({ page }) =>
      page === 1 ? { items: [candidature()], total: 1 } : { items: [], total: 1 },
    )

    await store.setPage(3)

    expect(store.list.page).toBe(1)
    expect(store.listItems.map((c) => c.id)).toEqual([1])
  })
})
