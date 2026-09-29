<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import CandidateAvatar from '@/components/common/CandidateAvatar.vue'
import SkillBadges from '@/components/common/SkillBadges.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import type { Candidature } from '@/types/models'

withDefaults(
  defineProps<{
    items: Candidature[]
    /** Show skeleton rows instead of items (first load). */
    loading?: boolean
    skeletonRows?: number
    highlightSkills?: string[]
  }>(),
  { skeletonRows: 8, highlightSkills: () => [] },
)

const route = useRoute()
</script>

<template>
  <div class="overflow-hidden rounded-lg border">
    <Table>
      <TableHeader class="bg-muted/50">
        <TableRow>
          <TableHead class="pl-4">Candidat</TableHead>
          <TableHead>Poste</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead class="hidden lg:table-cell">Compétences</TableHead>
          <TableHead class="hidden xl:table-cell">Expérience</TableHead>
          <TableHead>Candidature</TableHead>
          <TableHead class="w-10"><span class="sr-only">Ouvrir</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="loading">
          <TableRow v-for="n in skeletonRows" :key="n">
            <TableCell class="pl-4">
              <div class="flex items-center gap-3">
                <Skeleton class="size-8 rounded-full" />
                <div class="grid gap-1.5">
                  <Skeleton class="h-4 w-32" />
                  <Skeleton class="h-3 w-40" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton class="h-4 w-36" /></TableCell>
            <TableCell><Skeleton class="h-5 w-24 rounded-full" /></TableCell>
            <TableCell class="hidden lg:table-cell"><Skeleton class="h-5 w-40" /></TableCell>
            <TableCell class="hidden xl:table-cell"><Skeleton class="h-4 w-12" /></TableCell>
            <TableCell><Skeleton class="h-4 w-20" /></TableCell>
            <TableCell />
          </TableRow>
        </template>
        <TableRow
          v-for="candidature in items"
          v-else
          :key="candidature.id"
          class="group relative cursor-pointer"
        >
          <TableCell class="pl-4">
            <div class="flex items-center gap-3">
              <CandidateAvatar :nom="candidature.nom" />
              <div class="min-w-0">
                <!-- Stretched link: the whole row is clickable while staying a real, focusable link. -->
                <RouterLink
                  :to="{
                    name: 'candidature-detail',
                    params: { id: candidature.id },
                    query: route.query,
                  }"
                  class="font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                >
                  {{ candidature.nom }}
                </RouterLink>
                <p class="text-muted-foreground truncate text-xs">{{ candidature.email }}</p>
              </div>
            </div>
          </TableCell>
          <TableCell class="text-muted-foreground">{{ candidature.poste }}</TableCell>
          <TableCell><StatusBadge :statut="candidature.statut" /></TableCell>
          <TableCell class="hidden lg:table-cell">
            <SkillBadges :skills="candidature.competences" :max="3" :highlight="highlightSkills" />
          </TableCell>
          <TableCell class="text-muted-foreground hidden xl:table-cell">
            {{ candidature.experience }}
          </TableCell>
          <TableCell class="text-muted-foreground whitespace-nowrap">
            <time :datetime="candidature.dateCandidature">
              {{ formatDate(candidature.dateCandidature) }}
            </time>
          </TableCell>
          <TableCell>
            <ChevronRight
              class="text-muted-foreground pointer-events-none size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
