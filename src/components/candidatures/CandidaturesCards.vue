<script setup lang="ts">
import { useRoute } from 'vue-router'
import { CalendarDays } from '@lucide/vue'
import CandidateAvatar from '@/components/common/CandidateAvatar.vue'
import SkillBadges from '@/components/common/SkillBadges.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import type { Candidature } from '@/types/models'

withDefaults(
  defineProps<{
    items: Candidature[]
    loading?: boolean
    skeletonRows?: number
    highlightSkills?: string[]
  }>(),
  { skeletonRows: 5, highlightSkills: () => [] },
)

const route = useRoute()
</script>

<template>
  <ul class="grid grid-cols-1 gap-2">
    <template v-if="loading">
      <li v-for="n in skeletonRows" :key="n" class="rounded-lg border p-4">
        <div class="flex items-center gap-3">
          <Skeleton class="size-8 rounded-full" />
          <div class="grid flex-1 gap-1.5">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-3 w-24" />
          </div>
          <Skeleton class="h-5 w-20 rounded-full" />
        </div>
        <Skeleton class="mt-3 h-5 w-48" />
      </li>
    </template>
    <li
      v-for="candidature in items"
      v-else
      :key="candidature.id"
      class="bg-card hover:bg-muted/40 relative rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring/50"
    >
      <div class="flex items-start gap-3">
        <CandidateAvatar :nom="candidature.nom" />
        <div class="min-w-0 flex-1">
          <RouterLink
            :to="{ name: 'candidature-detail', params: { id: candidature.id }, query: route.query }"
            class="block truncate font-medium outline-none after:absolute after:inset-0"
          >
            {{ candidature.nom }}
          </RouterLink>
          <p class="text-muted-foreground truncate text-sm">{{ candidature.poste }}</p>
        </div>
        <StatusBadge :statut="candidature.statut" />
      </div>
      <SkillBadges
        class="mt-3"
        :skills="candidature.competences"
        :max="3"
        :highlight="highlightSkills"
      />
      <p class="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
        <CalendarDays class="size-3.5" aria-hidden="true" />
        Candidature du
        <time :datetime="candidature.dateCandidature">
          {{ formatDate(candidature.dateCandidature) }}
        </time>
        · {{ candidature.experience }} d'expérience
      </p>
    </li>
  </ul>
</template>
