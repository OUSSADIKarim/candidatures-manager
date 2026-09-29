<script setup lang="ts">
import { useRoute } from 'vue-router'
import { CalendarDays, MessageSquare } from '@lucide/vue'
import SkillBadges from '@/components/common/SkillBadges.vue'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Candidature } from '@/types/models'
import MoveToMenu from './MoveToMenu.vue'

defineProps<{
  candidature: Candidature
  /** A status change for this card is in flight. */
  pending?: boolean
  highlightSkills?: string[]
}>()
defineEmits<{ move: [statut: string] }>()

const route = useRoute()
</script>

<template>
  <li
    :data-id="candidature.id"
    :aria-busy="pending"
    :class="
      cn(
        'bg-card group relative cursor-grab rounded-lg border p-3 shadow-xs transition-[opacity,border-color]',
        'hover:border-foreground/20 focus-within:ring-ring/50 focus-within:ring-2 active:cursor-grabbing',
        pending && 'opacity-60',
      )
    "
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <RouterLink
          :to="{ name: 'candidature-detail', params: { id: candidature.id }, query: route.query }"
          class="block truncate text-sm font-medium outline-none after:absolute after:inset-0"
          draggable="false"
        >
          {{ candidature.nom }}
        </RouterLink>
        <p class="text-muted-foreground truncate text-xs">{{ candidature.poste }}</p>
      </div>
      <Spinner v-if="pending" class="text-muted-foreground mt-1" />
      <!-- Wrapper, not a class on MoveToMenu: its root (DropdownMenu) renders no element.
           z-10 lifts the button above the card's stretched link. -->
      <div v-else class="relative z-10 -mt-1 -mr-1">
        <MoveToMenu
          :nom="candidature.nom"
          :statut="candidature.statut"
          @move="$emit('move', $event)"
        />
      </div>
    </div>

    <SkillBadges
      class="mt-2"
      :skills="candidature.competences"
      :max="3"
      :highlight="highlightSkills"
    />

    <div class="text-muted-foreground mt-3 flex items-center justify-between text-xs">
      <span class="flex items-center gap-1">
        <CalendarDays class="size-3.5" aria-hidden="true" />
        <time :datetime="candidature.dateCandidature">
          {{ formatDate(candidature.dateCandidature) }}
        </time>
      </span>
      <span v-if="candidature.commentaires.length" class="flex items-center gap-1">
        <MessageSquare class="size-3.5" aria-hidden="true" />
        {{ candidature.commentaires.length }}
        <span class="sr-only">commentaire(s)</span>
      </span>
    </div>
  </li>
</template>
