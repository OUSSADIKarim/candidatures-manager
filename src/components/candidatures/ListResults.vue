<script setup lang="ts">
// List view: paginated fetch (_page/_limit), re-run whenever criteria change.
import { computed, onMounted, watch } from 'vue'
import { RotateCw, SearchX, TriangleAlert } from '@lucide/vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useIsDesktop } from '@/composables/useIsDesktop'
import { describeError } from '@/lib/errors'
import { pluralize } from '@/lib/format'
import { useCandidaturesStore } from '@/stores/candidatures'
import { usePreferencesStore } from '@/stores/preferences'
import { useReferentielsStore } from '@/stores/referentiels'
import { countActiveFilters } from '@/types/filters'
import CandidaturesCards from './CandidaturesCards.vue'
import CandidaturesTable from './CandidaturesTable.vue'
import ListPagination from './ListPagination.vue'

const store = useCandidaturesStore()
const preferences = usePreferencesStore()
const referentiels = useReferentielsStore()
const isDesktop = useIsDesktop()

const status = computed(() => store.list.status)
const hasItems = computed(() => store.listItems.length > 0)
const isFirstLoad = computed(
  () => (status.value === 'loading' || status.value === 'idle') && !hasItems.value,
)
const isRefreshing = computed(() => status.value === 'loading' && hasItems.value)
const hasFilters = computed(
  () => countActiveFilters(preferences.filters) > 0 || preferences.filters.q.trim() !== '',
)

const summary = computed(() => {
  if (status.value !== 'success') return 'Chargement des candidatures…'
  const count = pluralize(store.list.total, 'candidature')
  return hasFilters.value ? `${count} correspondant à vos critères` : `${count} au total`
})

onMounted(() => store.fetchList())

// A candidature was created or deleted: reload the current page (totals and page contents move).
watch(
  () => store.revision,
  () => store.fetchList(),
)

// Any change of criteria restarts from page 1. The search itself is debounced in SearchInput.
watch(
  () => [preferences.filters, preferences.sort, preferences.pageSize],
  () => store.setPage(1),
  { deep: true },
)

function refresh() {
  referentiels.load({ force: true })
  store.fetchList()
}

defineExpose({ refresh, loading: computed(() => status.value === 'loading'), summary })
</script>

<template>
  <section aria-label="Résultats" :aria-busy="status === 'loading'" class="grid grid-cols-1 gap-4">
    <p class="sr-only" aria-live="polite">{{ summary }}</p>

    <ErrorState
      v-if="status === 'error' && !hasItems"
      :error="store.list.error"
      @retry="store.fetchList()"
    />

    <Empty v-else-if="status === 'success' && store.list.total === 0" class="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
        <EmptyTitle>Aucune candidature trouvée</EmptyTitle>
        <EmptyDescription>
          {{
            hasFilters
              ? 'Aucun résultat ne correspond à vos critères. Essayez d’élargir la recherche.'
              : 'Aucune candidature n’a encore été reçue.'
          }}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent v-if="hasFilters">
        <Button variant="outline" @click="preferences.resetFilters()">
          Réinitialiser les filtres
        </Button>
      </EmptyContent>
    </Empty>

    <template v-else>
      <!-- Stale data stays visible when a refresh fails. -->
      <Alert v-if="status === 'error'" variant="destructive">
        <TriangleAlert />
        <AlertTitle>{{ describeError(store.list.error).title }}</AlertTitle>
        <AlertDescription>Les données affichées peuvent ne pas être à jour.</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm" @click="store.fetchList()">
            <RotateCw /> Réessayer
          </Button>
        </AlertAction>
      </Alert>

      <div
        class="relative transition-opacity duration-200"
        :class="isRefreshing && 'pointer-events-none opacity-60'"
      >
        <CandidaturesTable
          v-if="isDesktop"
          :items="store.listItems"
          :loading="isFirstLoad"
          :skeleton-rows="preferences.pageSize"
          :highlight-skills="preferences.filters.competences"
        />
        <CandidaturesCards
          v-else
          :items="store.listItems"
          :loading="isFirstLoad"
          :highlight-skills="preferences.filters.competences"
        />
      </div>

      <ListPagination
        v-if="store.list.total > 0"
        :page="store.list.page"
        :page-size="preferences.pageSize"
        :total="store.list.total"
        @update:page="store.setPage"
        @update:page-size="preferences.pageSize = $event"
      />
    </template>
  </section>
</template>
