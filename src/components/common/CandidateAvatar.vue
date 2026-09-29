<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { initials } from '@/lib/format'

defineProps<{
  nom: string
  size?: 'sm' | 'default' | 'lg'
}>()
</script>

<template>
  <Avatar :size="size" aria-hidden="true">
    <AvatarFallback class="text-xs font-medium">{{ initials(nom) }}</AvatarFallback>
  </Avatar>
</template>
