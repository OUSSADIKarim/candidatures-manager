<script setup lang="ts">
import { ArrowDownUp } from '@lucide/vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortOption } from '@/types/filters'

const model = defineModel<SortOption>({ required: true })

const options: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Plus récentes' },
  { value: 'date-asc', label: 'Plus anciennes' },
  { value: 'nom-asc', label: 'Nom (A → Z)' },
  { value: 'nom-desc', label: 'Nom (Z → A)' },
]
</script>

<template>
  <Select v-model="model">
    <SelectTrigger class="w-44" aria-label="Trier par">
      <ArrowDownUp class="text-muted-foreground" />
      <SelectValue />
    </SelectTrigger>
    <SelectContent align="end">
      <SelectItem v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
