<script setup lang="ts">
import { computed } from 'vue'
import { FileQuestion, RotateCw, ServerCrash, TriangleAlert, WifiOff } from '@lucide/vue'
import { ApiError } from '@/api/http'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { describeError } from '@/lib/errors'

const props = defineProps<{
  error: unknown
  /** Hide the retry button (e.g. for a 404 where retrying is pointless). */
  hideRetry?: boolean
}>()

defineEmits<{ retry: [] }>()

const display = computed(() => describeError(props.error))

const icon = computed(() => {
  if (!(props.error instanceof ApiError)) return TriangleAlert
  switch (props.error.kind) {
    case 'network':
    case 'timeout':
      return WifiOff
    case 'server':
      return ServerCrash
    case 'not_found':
      return FileQuestion
    default:
      return TriangleAlert
  }
})
</script>

<template>
  <Empty role="alert" class="border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon" class="bg-destructive/10 text-destructive">
        <component :is="icon" />
      </EmptyMedia>
      <EmptyTitle>{{ display.title }}</EmptyTitle>
      <EmptyDescription>{{ display.description }}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <div class="flex flex-wrap justify-center gap-2">
        <Button v-if="!hideRetry" variant="outline" @click="$emit('retry')">
          <RotateCw />
          Réessayer
        </Button>
        <slot />
      </div>
    </EmptyContent>
  </Empty>
</template>
