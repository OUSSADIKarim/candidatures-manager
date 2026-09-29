<script setup lang="ts">
import { CircleAlert, RotateCw, Trash2 } from '@lucide/vue'
import CandidateAvatar from '@/components/common/CandidateAvatar.vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Commentaire, PendingCommentaire } from '@/types/models'

defineProps<{ comments: (Commentaire & { syncState?: PendingCommentaire['syncState'] })[] }>()
defineEmits<{ retry: [id: number]; discard: [id: number] }>()
</script>

<template>
  <p v-if="comments.length === 0" class="text-muted-foreground text-sm">
    Aucun commentaire pour l'instant. Partagez votre avis avec l'équipe ci-dessous.
  </p>
  <TransitionGroup
    v-else
    tag="ol"
    class="grid grid-cols-1 gap-4"
    enter-from-class="opacity-0 translate-y-1"
    enter-active-class="transition duration-200"
    leave-to-class="opacity-0"
    leave-active-class="transition duration-150"
  >
    <li
      v-for="comment in comments"
      :key="comment.id"
      :class="cn('flex gap-3', comment.syncState === 'pending' && 'opacity-60')"
      :aria-busy="comment.syncState === 'pending'"
    >
      <CandidateAvatar :nom="comment.auteur" size="sm" />
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span class="font-medium">{{ comment.auteur }}</span>
          <time :datetime="comment.date" class="text-muted-foreground text-xs">
            {{ formatDateTime(comment.date) }}
          </time>
          <span
            v-if="comment.syncState === 'pending'"
            class="text-muted-foreground flex items-center gap-1 text-xs"
          >
            <Spinner class="size-3" /> Envoi…
          </span>
        </p>
        <p class="mt-1 text-sm whitespace-pre-line">{{ comment.contenu }}</p>
        <div
          v-if="comment.syncState === 'failed'"
          role="alert"
          class="text-destructive mt-1.5 flex flex-wrap items-center gap-2 text-xs"
        >
          <CircleAlert class="size-3.5" aria-hidden="true" />
          Échec de l'envoi
          <Button variant="ghost" size="xs" @click="$emit('retry', comment.id)">
            <RotateCw /> Réessayer
          </Button>
          <Button variant="ghost" size="xs" @click="$emit('discard', comment.id)">
            <Trash2 /> Supprimer
          </Button>
        </div>
      </div>
    </li>
  </TransitionGroup>
</template>
