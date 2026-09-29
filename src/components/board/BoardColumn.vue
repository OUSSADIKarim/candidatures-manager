<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable, type SortableEvent } from 'vue-draggable-plus'
import { ChevronDown, RotateCw } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { describeError } from '@/lib/errors'
import type { ColumnState } from '@/stores/candidatures'
import type { Candidature, Statut } from '@/types/models'
import BoardCard from './BoardCard.vue'

const props = defineProps<{
  statut: Statut
  items: Candidature[]
  state: ColumnState
  pendingIds?: ReadonlySet<number>
  highlightSkills?: string[]
}>()

const emit = defineEmits<{
  move: [id: number, statut: string]
  loadMore: []
  retry: []
}>()

const headingId = computed(() => `column-${props.statut.id}`)
const isFirstLoad = computed(() => props.state.status === 'loading' && props.items.length === 0)
const remaining = computed(() => Math.max(0, props.state.total - props.items.length))

// SortableJS moves DOM nodes itself; vue-draggable-plus puts them back and we only read which
// card landed in this column. The store then re-renders the board from state.
function onAdd(event: SortableEvent) {
  const id = Number((event.item as HTMLElement).dataset.id)
  if (Number.isFinite(id)) emit('move', id, props.statut.nom)
}
</script>

<template>
  <section
    :aria-labelledby="headingId"
    class="bg-muted/40 flex max-w-96 min-w-64 flex-1 basis-0 flex-col rounded-xl border"
  >
    <header
      class="flex items-center gap-2 border-b px-3 py-2.5"
      :style="{ boxShadow: `inset 0 3px 0 0 ${statut.couleur}` }"
    >
      <span
        class="size-2.5 rounded-full"
        :style="{ backgroundColor: statut.couleur }"
        aria-hidden="true"
      />
      <h2 :id="headingId" class="text-sm font-semibold">{{ statut.nom }}</h2>
      <Badge variant="secondary" class="ml-auto tabular-nums">
        {{ state.total }}
        <span class="sr-only">candidature(s)</span>
      </Badge>
      <Spinner v-if="state.status === 'loading' && items.length" class="text-muted-foreground" />
    </header>

    <div class="flex min-h-40 flex-1 flex-col gap-2 p-2">
      <ul v-if="isFirstLoad" class="grid grid-cols-1 gap-2" aria-hidden="true">
        <li v-for="n in 3" :key="n" class="bg-card rounded-lg border p-3">
          <Skeleton class="h-4 w-32" />
          <Skeleton class="mt-1.5 h-3 w-24" />
          <Skeleton class="mt-3 h-5 w-40" />
        </li>
      </ul>

      <div
        v-else-if="state.status === 'error' && items.length === 0"
        role="alert"
        class="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-sm"
      >
        <p>{{ describeError(state.error).title }}</p>
        <Button variant="outline" size="sm" @click="emit('retry')">
          <RotateCw />
          Réessayer
        </Button>
      </div>

      <template v-else>
        <VueDraggable
          :model-value="items"
          tag="ul"
          :group="{ name: 'board', pull: true, put: true }"
          :sort="false"
          :animation="150"
          :delay="150"
          :delay-on-touch-only="true"
          :force-fallback="true"
          :fallback-tolerance="4"
          ghost-class="board-ghost"
          chosen-class="board-chosen"
          drag-class="board-drag"
          draggable="[data-id]"
          :data-statut="statut.nom"
          :aria-label="`Candidatures : ${statut.nom}`"
          class="board-dropzone grid min-h-24 flex-1 grid-cols-1 content-start gap-2 rounded-lg"
          @add="onAdd"
        >
          <BoardCard
            v-for="candidature in items"
            :key="candidature.id"
            :candidature="candidature"
            :pending="pendingIds?.has(candidature.id)"
            :highlight-skills="highlightSkills"
            @move="emit('move', candidature.id, $event)"
          />
          <li
            v-if="items.length === 0"
            class="board-placeholder text-muted-foreground flex h-24 items-center justify-center rounded-lg border border-dashed text-xs"
          >
            Aucune candidature
          </li>
        </VueDraggable>

        <Button
          v-if="remaining > 0"
          variant="ghost"
          size="sm"
          class="text-muted-foreground w-full"
          :disabled="state.status === 'loading'"
          @click="emit('loadMore')"
        >
          <ChevronDown />
          Voir plus ({{ remaining }})
        </Button>
      </template>
    </div>
  </section>
</template>

<style scoped>
@reference "@/assets/main.css";

/* Hide the empty placeholder while a card hovers the column. */
.board-dropzone:has(.board-ghost) .board-placeholder {
  display: none;
}

:deep(.board-ghost) {
  @apply border-primary/40 bg-primary/5 opacity-60;
}
:deep(.board-drag) {
  @apply rotate-2 shadow-lg;
}
</style>
