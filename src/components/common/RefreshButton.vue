<script setup lang="ts">
import { RotateCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

defineProps<{ loading?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <Button variant="outline" :aria-busy="loading" @click="$emit('click')">
    <RotateCw :class="cn(loading && 'animate-spin')" />
    <span>Actualiser</span>
  </Button>
</template>
