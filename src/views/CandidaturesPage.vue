<script setup lang="ts">
// Single page for both views: header, filters and detail panel are shared; the active view
// component owns its own data fetching (paginated list vs. one request per status column).
import { computed, defineAsyncComponent, onMounted, useTemplateRef } from 'vue'
import { TriangleAlert } from '@lucide/vue'
import CreateCandidatureDialog from '@/components/candidatures/CreateCandidatureDialog.vue'
import ListResults from '@/components/candidatures/ListResults.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import RefreshButton from '@/components/common/RefreshButton.vue'
import FiltersToolbar from '@/components/filters/FiltersToolbar.vue'
import SortSelect from '@/components/filters/SortSelect.vue'
import ViewSwitcher from '@/components/layout/ViewSwitcher.vue'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useIsDesktop } from '@/composables/useIsDesktop'
import { describeError } from '@/lib/errors'
import { usePreferencesStore } from '@/stores/preferences'
import { useReferentielsStore } from '@/stores/referentiels'
import type { ResultsViewHandle } from '@/types/views'

// Loaded on demand: the drag & drop code is only downloaded when the board is opened.
const BoardResults = defineAsyncComponent(() => import('@/components/board/BoardResults.vue'))

const preferences = usePreferencesStore()
const referentiels = useReferentielsStore()
const isDesktop = useIsDesktop()

// The board is desktop-only: a kanban loses its point when one column fills a phone screen.
const activeView = computed(() => (isDesktop.value ? preferences.view : 'liste'))

const results = useTemplateRef<ResultsViewHandle>('results')

onMounted(() => referentiels.load())
</script>

<template>
  <div class="grid grid-cols-1 gap-6">
    <!-- grid-cols-1 = minmax(0, 1fr): wide children (board, table) scroll instead of stretching the page. -->
    <PageHeader title="Candidatures" :description="results?.summary ?? 'Chargement…'">
      <template #actions>
        <RefreshButton :loading="results?.loading" @click="results?.refresh()" />
        <CreateCandidatureDialog />
      </template>
    </PageHeader>

    <FiltersToolbar :searching="results?.loading">
      <template #end>
        <div class="flex items-center gap-2">
          <SortSelect v-model="preferences.sort" />
          <ViewSwitcher v-if="isDesktop" v-model="preferences.view" />
        </div>
      </template>
    </FiltersToolbar>

    <!-- The board shows its own full error state, as it cannot render columns without statuses. -->
    <Alert v-if="referentiels.status === 'error' && activeView === 'liste'" variant="destructive">
      <TriangleAlert />
      <AlertTitle>Filtres indisponibles</AlertTitle>
      <AlertDescription>{{ describeError(referentiels.error).description }}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" @click="referentiels.load({ force: true })">
          Réessayer
        </Button>
      </AlertAction>
    </Alert>

    <Transition
      mode="out-in"
      enter-from-class="opacity-0"
      enter-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
    >
      <BoardResults v-if="activeView === 'tableau'" ref="results" />
      <ListResults v-else ref="results" />
    </Transition>

    <RouterView />
  </div>
</template>
