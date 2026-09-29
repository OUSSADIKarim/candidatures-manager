<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import StatusDot from './StatusDot.vue'

const props = defineProps<{
  statut: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        props.class,
      )
    "
  >
    <StatusDot :statut="statut" />
    {{ statut }}
  </span>
</template>
