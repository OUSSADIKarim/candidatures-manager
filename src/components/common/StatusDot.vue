<script setup lang="ts">
import { useReferentielsStore } from '@/stores/referentiels'

defineProps<{ statut: string }>()

const referentiels = useReferentielsStore()
</script>

<template>
  <span
    class="size-2 shrink-0 rounded-full"
    :style="{ backgroundColor: referentiels.colorOf(statut) }"
    aria-hidden="true"
  />
</template>
