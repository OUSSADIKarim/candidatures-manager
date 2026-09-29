<script setup lang="ts">
// Board view (desktop only): one request per status column, each paginated with "Voir plus".
// This keeps working with thousands of candidatures, unlike fetching everything and grouping.
import { computed, onMounted, watch } from 'vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useCandidatureActions } from '@/composables/useCandidatureActions'
import { pluralize } from '@/lib/format'
import { useCandidaturesStore } from '@/stores/candidatures'
import { usePreferencesStore } from '@/stores/preferences'
import { useReferentielsStore } from '@/stores/referentiels'
import BoardColumn from './BoardColumn.vue'

const store = useCandidaturesStore()
const preferences = usePreferencesStore()
const referentiels = useReferentielsStore()
const actions = useCandidatureActions()

// Selecting statuses in the filter narrows the board to those columns.
const visibleStatuts = computed(() => {
  const selected = preferences.filters.statuts
  return selected.length
    ? referentiels.statuts.filter((s) => selected.includes(s.nom))
    : referentiels.statuts
})

const loading = computed(
  () =>
    referentiels.status === 'loading' ||
    visibleStatuts.value.some((s) => store.columns[s.nom]?.status === 'loading'),
)

const summary = computed(() => {
  const states = visibleStatuts.value.map((s) => store.columns[s.nom])
  if (referentiels.status !== 'success' || states.some((s) => !s || s.status === 'idle')) {
    return 'Chargement du tableau…'
  }
  const total = states.reduce((sum, state) => sum + (state?.total ?? 0), 0)
  return `${pluralize(total, 'candidature')} · glissez une carte pour changer son statut`
})

async function loadBoard({ force = false } = {}) {
  await referentiels.load({ force })
  if (referentiels.status === 'success') {
    store.fetchBoard(visibleStatuts.value.map((s) => s.nom))
  }
}

onMounted(() => loadBoard())

// Criteria changed, or a candidature was created/deleted.
watch(
  () => [preferences.filters, preferences.sort, store.revision],
  () => loadBoard(),
  { deep: true },
)

defineExpose({ refresh: () => loadBoard({ force: true }), loading, summary })
</script>

<template>
  <ErrorState
    v-if="referentiels.status === 'error'"
    :error="referentiels.error"
    @retry="loadBoard({ force: true })"
  />

  <div
    v-else-if="referentiels.status !== 'success'"
    class="flex gap-4 overflow-hidden"
    aria-hidden="true"
  >
    <Skeleton v-for="n in 5" :key="n" class="h-96 min-w-64 flex-1 rounded-xl" />
  </div>

  <div v-else class="relative -mx-6 flex gap-4 overflow-x-auto px-6 pb-4 lg:-mx-8 lg:px-8">
    <!-- relative: keeps absolutely positioned descendants (sr-only text) inside the scroll area. -->
    <BoardColumn
      v-for="statut in visibleStatuts"
      :key="statut.id"
      :statut="statut"
      :items="store.columnItems(statut.nom)"
      :state="store.column(statut.nom)"
      :pending-ids="store.pendingStatusIds"
      :highlight-skills="preferences.filters.competences"
      @move="actions.changeStatus"
      @load-more="store.fetchColumn(statut.nom, { more: true })"
      @retry="store.fetchColumn(statut.nom)"
    />
  </div>
</template>
