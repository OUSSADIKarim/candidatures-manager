// Candidatures are stored once, normalized by id. The list page, board columns and detail
// view only hold ids, so an update to an entity is reflected everywhere at once.
import { computed, reactive, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { candidaturesApi, type NewCandidature } from '@/api/candidatures'
import { ApiError, isAbortError } from '@/api/http'
import type { SortOption } from '@/types/filters'
import type { Candidature, Commentaire, PendingCommentaire } from '@/types/models'
import { usePreferencesStore } from './preferences'
import type { LoadStatus } from './types'

export const BOARD_PAGE_SIZE = 20

interface ListState {
  ids: number[]
  total: number
  page: number
  status: LoadStatus
  error: unknown
}

export interface ColumnState {
  ids: number[]
  total: number
  limit: number
  status: LoadStatus
  error: unknown
}

interface DetailState {
  status: LoadStatus
  error: unknown
}

export type MutationResult =
  | { status: 'saved' }
  /** A newer change to the same candidature made this result irrelevant. */
  | { status: 'superseded' }
  | { status: 'failed'; error: unknown }

/** Bookkeeping for successive status changes on one candidature. */
interface StatusSync {
  version: number // incremented on each change request; the highest one is the wanted status
  inflight: number // changes not settled yet (queued or awaiting the server)
  queue: Promise<unknown> // PATCHes are sent one after the other, in order
}

function createColumn(): ColumnState {
  return { ids: [], total: 0, limit: BOARD_PAGE_SIZE, status: 'idle', error: null }
}

function compareBy(sort: SortOption, a: Candidature, b: Candidature): number {
  switch (sort) {
    case 'date-desc':
      return b.dateCandidature.localeCompare(a.dateCandidature)
    case 'date-asc':
      return a.dateCandidature.localeCompare(b.dateCandidature)
    case 'nom-asc':
      return a.nom.localeCompare(b.nom, 'fr')
    case 'nom-desc':
      return b.nom.localeCompare(a.nom, 'fr')
  }
}

export const useCandidaturesStore = defineStore('candidatures', () => {
  const preferences = usePreferencesStore()

  const entities = ref<Record<number, Candidature>>({})
  const list = reactive<ListState>({ ids: [], total: 0, page: 1, status: 'idle', error: null })
  const columns = reactive<Record<string, ColumnState>>({})
  const details = reactive<Record<number, DetailState>>({})

  /** Candidatures whose status change is awaiting the server. */
  const pendingStatusIds = reactive(new Set<number>())
  /** Comments shown optimistically, not yet saved (or failed). */
  const pendingComments = reactive<Record<number, PendingCommentaire[]>>({})
  /** Bumped after a creation or deletion: views refetch to reflect the new totals and pages. */
  const revision = ref(0)

  // Last state known to be on the server, used as the rollback target. Not reactive on purpose.
  const confirmed = new Map<number, Candidature>()
  const statusSync = new Map<number, StatusSync>()
  const commentQueues = new Map<number, Promise<MutationResult>>()
  /** Columns whose content was adjusted locally: reloaded once status changes are settled. */
  const dirtyColumns = new Set<string>()

  // Logical clock ordering reads and writes: a read that started before a write to the same
  // candidature carries data older than that write, whenever its response arrives.
  let clock = 0
  const lastWrite = new Map<number, number>()
  const markWrite = (id: number) => lastWrite.set(id, ++clock)

  // Nested items get no server id. A timestamp avoids collisions between recruiters; the
  // increment keeps ids unique when several are created within the same millisecond.
  let lastCommentId = 0
  function nextCommentId(): number {
    lastCommentId = Math.max(Date.now(), lastCommentId + 1)
    return lastCommentId
  }

  // One controller per request "slot": a new request cancels the previous one in the same slot,
  // so a slow, outdated response can never overwrite a newer one.
  const controllers = new Map<string, AbortController>()
  function nextSignal(key: string): AbortSignal {
    controllers.get(key)?.abort()
    const controller = new AbortController()
    controllers.set(key, controller)
    return controller.signal
  }

  /**
   * Server data wins, with two exceptions: a status change still in flight stays optimistic,
   * and a read started before our last write to that candidature is outdated, so it is ignored.
   * `readStartedAt` is the clock value when the read was sent; omitted for write responses.
   */
  function applyServer(item: Candidature, readStartedAt?: number) {
    const current = entities.value[item.id]
    const isOutdated = readStartedAt !== undefined && (lastWrite.get(item.id) ?? 0) > readStartedAt
    if (current && isOutdated) return

    confirmed.set(item.id, structuredClone(item))
    entities.value[item.id] =
      pendingStatusIds.has(item.id) && current ? { ...item, statut: current.statut } : item
  }

  function upsert(items: Candidature[], readStartedAt: number) {
    for (const item of items) applyServer(item, readStartedAt)
  }

  function resolve(ids: number[]): Candidature[] {
    return ids.map((id) => entities.value[id]).filter((c): c is Candidature => c !== undefined)
  }

  // --- List (paginated) -----------------------------------------------------------------------

  const listItems = computed(() => resolve(list.ids))
  const pageCount = computed(() => Math.max(1, Math.ceil(list.total / preferences.pageSize)))

  async function fetchList(): Promise<void> {
    const signal = nextSignal('list')
    const startedAt = clock
    list.status = 'loading'
    list.error = null
    try {
      const { items, total } = await candidaturesApi.list(
        {
          filters: preferences.filters,
          sort: preferences.sort,
          page: list.page,
          limit: preferences.pageSize,
        },
        signal,
      )
      // The current page may no longer exist (fewer results than before): go to the last one.
      if (items.length === 0 && total > 0 && list.page > 1) {
        list.page = Math.ceil(total / preferences.pageSize)
        return fetchList()
      }
      upsert(items, startedAt)
      list.ids = items.map((item) => item.id)
      list.total = total
      list.status = 'success'
    } catch (error) {
      if (isAbortError(error)) return
      list.error = error
      list.status = 'error'
    }
  }

  function setPage(page: number): Promise<void> {
    list.page = page
    return fetchList()
  }

  // New criteria mean new results: back to page 1. Done here rather than in the list view,
  // because criteria can also change while the board is displayed.
  watch(
    () => [preferences.filters, preferences.sort, preferences.pageSize],
    () => {
      list.page = 1
    },
    { deep: true },
  )

  // --- Board (one request per status column) --------------------------------------------------

  function column(statut: string): ColumnState {
    if (!columns[statut]) columns[statut] = createColumn()
    return columns[statut]
  }

  function columnItems(statut: string): Candidature[] {
    // The status check guards against a column refetch racing with an optimistic move.
    return resolve(columns[statut]?.ids ?? []).filter((c) => c.statut === statut)
  }

  async function fetchColumn(statut: string, { more = false } = {}): Promise<void> {
    const state = column(statut)
    if (more) state.limit += BOARD_PAGE_SIZE
    const signal = nextSignal(`column:${statut}`)
    const startedAt = clock
    state.status = 'loading'
    state.error = null
    try {
      const { items, total } = await candidaturesApi.list(
        {
          filters: { ...preferences.filters, statuts: [statut] },
          sort: preferences.sort,
          page: 1,
          limit: state.limit,
        },
        signal,
      )
      upsert(items, startedAt)
      const serverIds = items.map((item) => item.id)
      // Status changes still being saved are not in this response yet: keep the cards where
      // the recruiter put them, and reload the column once the changes are settled.
      const isMoving = (id: number) => pendingStatusIds.has(id)
      const movedAway = serverIds.filter(
        (id) => isMoving(id) && entities.value[id]?.statut !== statut,
      )
      const movedHere = state.ids.filter(
        (id) => isMoving(id) && entities.value[id]?.statut === statut && !serverIds.includes(id),
      )
      state.ids = [...serverIds.filter((id) => !movedAway.includes(id)), ...movedHere]
      state.total = total - movedAway.length + movedHere.length
      if (movedAway.length > 0 || movedHere.length > 0) dirtyColumns.add(statut)
      state.status = 'success'
    } catch (error) {
      if (isAbortError(error)) return
      state.error = error
      state.status = 'error'
    }
  }

  function fetchBoard(statuts: string[]): Promise<void[]> {
    return Promise.all(statuts.map((statut) => fetchColumn(statut)))
  }

  /**
   * Moves a card between loaded columns, keeping the current sort order and the counts.
   * In a partially loaded column, a card that sorts after every loaded one is shown at the end
   * (the recruiter must see where the card went); its real position comes with the reload.
   */
  function moveBetweenColumns(id: number, from: string, to: string) {
    const source = columns[from]
    const index = source?.ids.indexOf(id) ?? -1
    if (source && index !== -1) {
      source.ids.splice(index, 1)
      source.total = Math.max(0, source.total - 1)
    }
    const target = columns[to]
    const item = entities.value[id]
    if (!target || !item || target.ids.includes(id)) return
    const position = target.ids.findIndex((otherId) => {
      const other = entities.value[otherId]
      return other !== undefined && compareBy(preferences.sort, item, other) < 0
    })
    if (position === -1 && target.ids.length < target.total) dirtyColumns.add(to)
    target.ids.splice(position === -1 ? target.ids.length : position, 0, id)
    target.total += 1
  }

  function reloadDirtyColumns() {
    const statuts = [...dirtyColumns]
    dirtyColumns.clear()
    for (const statut of statuts) fetchColumn(statut)
  }

  // --- Detail ---------------------------------------------------------------------------------

  function detail(id: number): DetailState {
    if (!details[id]) details[id] = { status: 'idle', error: null }
    return details[id]
  }

  function getById(id: number): Candidature | undefined {
    return entities.value[id]
  }

  async function fetchOne(id: number): Promise<void> {
    const state = detail(id)
    const signal = nextSignal(`detail:${id}`)
    const startedAt = clock
    state.status = 'loading'
    state.error = null
    try {
      applyServer(await candidaturesApi.get(id, signal), startedAt)
      state.status = 'success'
    } catch (error) {
      if (isAbortError(error)) return
      state.error = error
      state.status = 'error'
    }
  }

  // --- Status change (optimistic) -------------------------------------------------------------

  function syncOf(id: number): StatusSync {
    let sync = statusSync.get(id)
    if (!sync) {
      sync = { version: 0, inflight: 0, queue: Promise.resolve() }
      statusSync.set(id, sync)
    }
    return sync
  }

  /** Once no request is in flight, show what the server confirmed (rolls back failures). */
  function settleStatus(id: number) {
    pendingStatusIds.delete(id)
    const entity = entities.value[id]
    const truth = confirmed.get(id)
    if (entity && truth && entity.statut !== truth.statut) {
      moveBetweenColumns(id, entity.statut, truth.statut)
      entity.statut = truth.statut
    }
    if (pendingStatusIds.size === 0) reloadDirtyColumns()
  }

  /**
   * Applies the new status immediately, then PATCHes it. Changes to one candidature are sent
   * one at a time, in order, so the server always ends on the latest choice; a change overtaken
   * by a newer one before being sent is skipped. On failure the status goes back to the last
   * one the server confirmed. Only the latest change reports its outcome (toast).
   */
  async function updateStatus(id: number, statut: string): Promise<MutationResult> {
    const entity = entities.value[id]
    if (!entity || entity.statut === statut) return { status: 'saved' }

    const sync = syncOf(id)
    const version = ++sync.version
    sync.inflight += 1
    moveBetweenColumns(id, entity.statut, statut)
    entity.statut = statut
    pendingStatusIds.add(id)

    const send = async (): Promise<MutationResult> => {
      const isLatest = () => version === sync.version
      if (!isLatest()) return { status: 'superseded' } // a newer change is queued behind
      try {
        markWrite(id)
        const saved = await candidaturesApi.patch(id, { statut })
        markWrite(id)
        confirmed.set(id, structuredClone(saved))
        return isLatest() ? { status: 'saved' } : { status: 'superseded' }
      } catch (error) {
        return isLatest() ? { status: 'failed', error } : { status: 'superseded' }
      }
    }
    const request = sync.queue.then(send)
    sync.queue = request

    const result = await request
    sync.inflight -= 1
    if (sync.inflight === 0) settleStatus(id)

    // A list filtered on statuses may no longer contain this candidature: refresh that page.
    const statutFilter = preferences.filters.statuts
    if (
      result.status === 'saved' &&
      statutFilter.length > 0 &&
      !statutFilter.includes(statut) &&
      list.ids.includes(id)
    ) {
      fetchList()
    }
    return result
  }

  // --- Comments (optimistic, serialized per candidature) --------------------------------------

  function commentsOf(id: number): (Commentaire | PendingCommentaire)[] {
    return [...(entities.value[id]?.commentaires ?? []), ...(pendingComments[id] ?? [])]
  }

  function removePendingComment(id: number, commentId: number) {
    const pending = pendingComments[id]
    if (!pending) return
    const index = pending.findIndex((c) => c.id === commentId)
    if (index !== -1) pending.splice(index, 1)
  }

  /**
   * JSON Server cannot append to a nested array: the whole `commentaires` array is PATCHed.
   * To avoid erasing a colleague's comment posted meanwhile, the latest list is re-read first,
   * and saves are queued per candidature so two of ours never read the same stale list.
   * Re-adding by id makes a retry idempotent (e.g. after a timeout that actually succeeded).
   */
  function syncComment(id: number, commentId: number): Promise<MutationResult> {
    const run = async (): Promise<MutationResult> => {
      const comment = pendingComments[id]?.find((c) => c.id === commentId)
      if (!comment) return { status: 'superseded' } // discarded meanwhile
      comment.syncState = 'pending'
      const plain: Commentaire = {
        id: comment.id,
        auteur: comment.auteur,
        date: comment.date,
        contenu: comment.contenu,
      }
      try {
        const latest = await candidaturesApi.get(id)
        markWrite(id)
        const saved = await candidaturesApi.patch(id, {
          commentaires: [...latest.commentaires.filter((c) => c.id !== commentId), plain],
        })
        markWrite(id)
        removePendingComment(id, commentId)
        applyServer(saved)
        return { status: 'saved' }
      } catch (error) {
        comment.syncState = 'failed'
        return { status: 'failed', error }
      }
    }
    const next = (commentQueues.get(id) ?? Promise.resolve()).then(run)
    commentQueues.set(id, next)
    return next
  }

  function addComment(
    id: number,
    { contenu, auteur }: { contenu: string; auteur: string },
  ): Promise<MutationResult> {
    const comment: PendingCommentaire = {
      id: nextCommentId(),
      auteur,
      contenu,
      date: new Date().toISOString(),
      syncState: 'pending',
    }
    if (!pendingComments[id]) pendingComments[id] = []
    pendingComments[id].push(comment)
    return syncComment(id, comment.id)
  }

  // --- Creation & deletion --------------------------------------------------------------------

  /** Not optimistic: the id is assigned by the server. Throws on failure (handled by the form). */
  async function create(input: NewCandidature): Promise<Candidature> {
    const created = await candidaturesApi.create(input)
    applyServer(created)
    revision.value += 1
    return created
  }

  /** Removes the candidature from the list and board immediately, restores it on failure. */
  async function remove(id: number): Promise<MutationResult> {
    const listIndex = list.ids.indexOf(id)
    const columnIndexes = Object.entries(columns)
      .map(([statut, state]) => [statut, state.ids.indexOf(id)] as const)
      .filter(([, index]) => index !== -1)

    if (listIndex !== -1) {
      list.ids.splice(listIndex, 1)
      list.total -= 1
    }
    for (const [statut] of columnIndexes) {
      const state = columns[statut]!
      state.ids = state.ids.filter((other) => other !== id)
      state.total -= 1
    }

    try {
      await candidaturesApi.remove(id)
    } catch (error) {
      // Already deleted (e.g. by a colleague): the outcome the recruiter wanted.
      if (!(error instanceof ApiError && error.kind === 'not_found')) {
        if (listIndex !== -1 && !list.ids.includes(id)) {
          list.ids.splice(Math.min(listIndex, list.ids.length), 0, id)
          list.total += 1
        }
        for (const [statut, index] of columnIndexes) {
          const state = columns[statut]!
          if (state.ids.includes(id)) continue
          state.ids.splice(Math.min(index, state.ids.length), 0, id)
          state.total += 1
        }
        return { status: 'failed', error }
      }
    }

    delete entities.value[id]
    delete pendingComments[id]
    confirmed.delete(id)
    revision.value += 1
    return { status: 'saved' }
  }

  return {
    entities,
    list,
    listItems,
    pageCount,
    fetchList,
    setPage,
    columns,
    column,
    columnItems,
    fetchColumn,
    fetchBoard,
    details,
    detail,
    getById,
    fetchOne,
    pendingStatusIds,
    updateStatus,
    pendingComments,
    commentsOf,
    addComment,
    retryComment: syncComment,
    discardComment: removePendingComment,
    revision,
    create,
    remove,
  }
})
