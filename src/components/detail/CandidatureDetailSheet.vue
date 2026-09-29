<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorState from '@/components/common/ErrorState.vue'
import { ApiError } from '@/api/http'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCandidatureActions } from '@/composables/useCandidatureActions'
import { useCandidaturesStore } from '@/stores/candidatures'
import type { Candidature } from '@/types/models'
import CandidatureDetail from './CandidatureDetail.vue'

// Route-driven panel (/candidatures/:id), so a candidature can be shared by URL.
const props = defineProps<{ id: number }>()

const store = useCandidaturesStore()
const actions = useCandidatureActions()
const route = useRoute()
const router = useRouter()

const open = ref(true)
let closeTimer: ReturnType<typeof setTimeout> | undefined

// While the panel slides out after a deletion, keep showing the candidature it displayed
// instead of falling back to the loading skeleton.
const lastShown = shallowRef<Candidature>()
const candidature = computed(
  () => store.getById(props.id) ?? (open.value ? undefined : lastShown.value),
)
watch(
  () => store.getById(props.id),
  (current) => {
    if (current) lastShown.value = current
  },
  { immediate: true },
)
const state = computed(() => store.details[props.id])
const isNotFound = computed(
  () => state.value?.error instanceof ApiError && state.value.error.kind === 'not_found',
)

// Cached data (from the list or board) is shown immediately while fresh data loads.
// Another candidature opened while this panel was closing: cancel the close and show it.
watch(
  () => props.id,
  (id) => {
    clearTimeout(closeTimer)
    open.value = true
    store.fetchOne(id)
  },
  { immediate: true },
)

const CLOSE_ANIMATION_MS = 200

// The route changes once the panel has slid out. If the recruiter navigated elsewhere in the
// meantime (another candidature, a toast link), that navigation wins.
function close() {
  const closingId = props.id
  open.value = false
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    const stillHere =
      route.name === 'candidature-detail' && Number(route.params.id) === closingId && !open.value
    if (stillHere) router.push({ name: 'candidatures', query: route.query })
  }, CLOSE_ANIMATION_MS)
}

onBeforeUnmount(() => clearTimeout(closeTimer))

// Optimistic: the panel closes right away, the candidature is restored if the DELETE fails.
function deleteCandidature() {
  close()
  actions.remove(props.id)
}
</script>

<template>
  <Sheet :open="open" @update:open="(value) => !value && close()">
    <SheetContent class="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
      <CandidatureDetail
        v-if="candidature && !isNotFound"
        :candidature="candidature"
        :comments="store.commentsOf(id)"
        :refreshing="state?.status === 'loading'"
        :status-pending="store.pendingStatusIds.has(id)"
        @change-status="actions.changeStatus(id, $event)"
        @add-comment="actions.addComment(id, $event)"
        @retry-comment="actions.retryComment(id, $event)"
        @discard-comment="actions.discardComment(id, $event)"
        @delete="deleteCandidature"
      />

      <template v-else-if="state?.status === 'error'">
        <SheetHeader class="sr-only">
          <SheetTitle>Erreur de chargement</SheetTitle>
          <SheetDescription>La candidature n'a pas pu être chargée.</SheetDescription>
        </SheetHeader>
        <div class="flex flex-1 items-center p-6">
          <ErrorState :error="state.error" :hide-retry="isNotFound" @retry="store.fetchOne(id)">
            <Button v-if="isNotFound" variant="outline" @click="close">Retour</Button>
          </ErrorState>
        </div>
      </template>

      <template v-else>
        <SheetHeader class="gap-4 border-b p-6">
          <SheetTitle class="sr-only">Chargement de la candidature</SheetTitle>
          <SheetDescription class="sr-only">Veuillez patienter.</SheetDescription>
          <div class="flex items-center gap-3" aria-hidden="true">
            <Skeleton class="size-10 rounded-full" />
            <div class="grid gap-1.5">
              <Skeleton class="h-5 w-40" />
              <Skeleton class="h-4 w-56" />
            </div>
          </div>
          <Skeleton class="h-9 w-56" />
        </SheetHeader>
        <div class="grid gap-6 p-6" aria-hidden="true">
          <div class="grid grid-cols-2 gap-4">
            <Skeleton v-for="n in 4" :key="n" class="h-10" />
          </div>
          <Skeleton class="h-16" />
          <Skeleton class="h-24" />
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
