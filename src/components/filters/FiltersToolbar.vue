<script setup lang="ts">
import { computed } from 'vue'
import { Briefcase, CircleDot, Sparkles, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePreferencesStore } from '@/stores/preferences'
import { useReferentielsStore } from '@/stores/referentiels'
import { countActiveFilters, type SkillMatchMode } from '@/types/filters'
import DateRangeFilter from './DateRangeFilter.vue'
import FacetFilter, { type FacetOption } from './FacetFilter.vue'
import SearchInput from './SearchInput.vue'

defineProps<{ searching?: boolean }>()

const preferences = usePreferencesStore()
const referentiels = useReferentielsStore()

const statutOptions = computed<FacetOption[]>(() =>
  referentiels.statuts.map((s) => ({ value: s.nom, label: s.nom, color: s.couleur })),
)
const posteOptions = computed<FacetOption[]>(() =>
  referentiels.postes.map((p) => ({ value: p.titre, label: p.titre })),
)
const competenceOptions = computed<FacetOption[]>(() =>
  referentiels.competences.map((c) => ({ value: c.nom, label: c.nom, group: c.categorie })),
)

const referentielsReady = computed(() => referentiels.status === 'success')
const hasActiveFilters = computed(
  () => countActiveFilters(preferences.filters) > 0 || preferences.filters.q !== '',
)
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center" role="search">
    <SearchInput v-model="preferences.filters.q" :loading="searching" class="lg:w-80" />

    <div class="flex flex-wrap items-center gap-2">
      <FacetFilter
        v-model="preferences.filters.statuts"
        title="Statut"
        :icon="CircleDot"
        :options="statutOptions"
        :disabled="!referentielsReady"
      />
      <FacetFilter
        v-model="preferences.filters.postes"
        title="Poste"
        :icon="Briefcase"
        :options="posteOptions"
        :disabled="!referentielsReady"
      />
      <FacetFilter
        v-model="preferences.filters.competences"
        title="Compétences"
        :icon="Sparkles"
        :options="competenceOptions"
        :disabled="!referentielsReady"
        searchable
      >
        <template #footer>
          <div class="grid gap-1.5">
            <Label class="text-muted-foreground text-xs">Correspondance</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              class="w-full"
              :model-value="preferences.filters.competencesMode"
              @update:model-value="
                (mode) => mode && (preferences.filters.competencesMode = mode as SkillMatchMode)
              "
            >
              <ToggleGroupItem value="all" class="flex-1 text-xs">Toutes</ToggleGroupItem>
              <ToggleGroupItem value="any" class="flex-1 text-xs">Au moins une</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </template>
      </FacetFilter>
      <DateRangeFilter
        v-model:from="preferences.filters.dateFrom"
        v-model:to="preferences.filters.dateTo"
      />
      <Button v-if="hasActiveFilters" variant="ghost" @click="preferences.resetFilters()">
        Réinitialiser
        <X />
      </Button>
    </div>

    <div v-if="$slots.end" class="lg:ml-auto">
      <slot name="end" />
    </div>
  </div>
</template>
