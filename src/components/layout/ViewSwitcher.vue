<script setup lang="ts">
import { Columns3, List } from '@lucide/vue'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ViewMode } from '@/stores/preferences'

const model = defineModel<ViewMode>({ required: true })

function select(value: unknown) {
  // A single-choice ToggleGroup emits undefined when the active item is clicked again.
  if (value === 'liste' || value === 'tableau') model.value = value
}
</script>

<template>
  <ToggleGroup
    type="single"
    variant="outline"
    :model-value="model"
    aria-label="Affichage"
    @update:model-value="select"
  >
    <ToggleGroupItem value="liste" aria-label="Vue liste">
      <List />
      <span class="hidden xl:inline">Liste</span>
    </ToggleGroupItem>
    <ToggleGroupItem value="tableau" aria-label="Vue tableau">
      <Columns3 />
      <span class="hidden xl:inline">Tableau</span>
    </ToggleGroupItem>
  </ToggleGroup>
</template>
