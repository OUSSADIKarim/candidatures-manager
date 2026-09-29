<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  Briefcase,
  CalendarClock,
  CalendarDays,
  Check,
  Euro,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Trash2,
  X,
} from '@lucide/vue'
import CandidateAvatar from '@/components/common/CandidateAvatar.vue'
import SkillBadges from '@/components/common/SkillBadges.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency, formatDate } from '@/lib/format'
import { safeHttpUrl } from '@/lib/url'
import { cn } from '@/lib/utils'
import { usePreferencesStore } from '@/stores/preferences'
import { useReferentielsStore } from '@/stores/referentiels'
import type { Candidature, Commentaire, PendingCommentaire } from '@/types/models'
import CommentForm from './CommentForm.vue'
import CommentThread from './CommentThread.vue'
import StatusSelect from './StatusSelect.vue'

const props = defineProps<{
  candidature: Candidature
  comments: (Commentaire | PendingCommentaire)[]
  /** Background refresh in progress (cached data is shown meanwhile). */
  refreshing?: boolean
  statusPending?: boolean
}>()

const emit = defineEmits<{
  changeStatus: [statut: string]
  addComment: [payload: { contenu: string; auteur: string }]
  retryComment: [id: number]
  discardComment: [id: number]
  delete: []
}>()

const preferences = usePreferencesStore()
const referentiels = useReferentielsStore()
const statusId = useId()

// Links come from the API, i.e. from anyone who can write to it: never trust their scheme.
const cvUrl = computed(() => safeHttpUrl(props.candidature.cv))
const phoneHref = computed(() => `tel:${props.candidature.telephone.replace(/[^\d+]/g, '')}`)

const facts = computed(() => [
  { icon: Briefcase, label: 'Expérience', value: props.candidature.experience },
  { icon: CalendarClock, label: 'Disponibilité', value: props.candidature.disponibilite },
  {
    icon: Euro,
    label: 'Salaire souhaité',
    value: formatCurrency(props.candidature.salaireSouhaite),
  },
  {
    icon: CalendarDays,
    label: 'Candidature reçue le',
    value: formatDate(props.candidature.dateCandidature),
  },
])

// Requirements of the targeted job, and whether the candidate meets each of them. A requirement
// is either a skill ("Vue.js") or a skill category ("Base de données", met by MongoDB).
const requiredSkills = computed(() => {
  const poste = referentiels.postes.find((p) => p.titre === props.candidature.poste)
  const categories = new Set(
    referentiels.competences
      .filter((c) => props.candidature.competences.includes(c.nom))
      .map((c) => c.categorie),
  )
  return (poste?.competencesRequises ?? []).map((skill) => ({
    skill,
    matched: props.candidature.competences.includes(skill) || categories.has(skill),
  }))
})
const matchedCount = computed(() => requiredSkills.value.filter((s) => s.matched).length)
</script>

<template>
  <SheetHeader class="gap-4 border-b p-6 pr-12">
    <div class="flex items-center gap-3">
      <CandidateAvatar :nom="candidature.nom" size="lg" />
      <div class="min-w-0 flex-1">
        <SheetTitle class="flex items-center gap-2 text-lg">
          {{ candidature.nom }}
          <Spinner v-if="refreshing" class="text-muted-foreground size-3.5" />
        </SheetTitle>
        <SheetDescription class="flex flex-wrap items-center gap-x-1">
          {{ candidature.poste }}
          <span aria-hidden="true">·</span>
          <MapPin class="size-3.5" aria-hidden="true" />
          {{ candidature.localisation }}
        </SheetDescription>
      </div>
    </div>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div class="grid gap-1.5">
        <Label :for="statusId" class="text-muted-foreground flex items-center gap-1.5 text-xs">
          Statut
          <Spinner v-if="statusPending" class="size-3" />
        </Label>
        <!-- Not disabled while saving: quick successive changes are handled by the store. -->
        <StatusSelect
          :id="statusId"
          :model-value="candidature.statut"
          @update:model-value="emit('changeStatus', $event)"
        />
      </div>
      <div class="flex gap-2 sm:ml-auto">
        <Button v-if="cvUrl" variant="outline" as-child class="flex-1 sm:flex-none">
          <a :href="cvUrl" target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            Voir le CV
            <span class="sr-only">(nouvel onglet)</span>
          </a>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive" size="icon" aria-label="Supprimer la candidature">
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la candidature ?</AlertDialogTitle>
              <AlertDialogDescription>
                La candidature de {{ candidature.nom }} et ses commentaires seront définitivement
                supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                :class="buttonVariants({ variant: 'destructive' })"
                @click="emit('delete')"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </SheetHeader>

  <div class="flex-1 overflow-y-auto">
    <div class="grid grid-cols-1 gap-6 p-6">
      <dl class="grid grid-cols-2 gap-4">
        <div v-for="fact in facts" :key="fact.label" class="grid gap-1">
          <dt class="text-muted-foreground flex items-center gap-1.5 text-xs">
            <component :is="fact.icon" class="size-3.5" aria-hidden="true" />
            {{ fact.label }}
          </dt>
          <dd class="text-sm font-medium">{{ fact.value }}</dd>
        </div>
      </dl>

      <section aria-labelledby="contact-heading" class="grid gap-2">
        <h3 id="contact-heading" class="text-sm font-semibold">Contact</h3>
        <a
          v-if="candidature.email"
          :href="`mailto:${candidature.email}`"
          class="hover:text-foreground text-muted-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline"
        >
          <Mail class="size-4" aria-hidden="true" />
          {{ candidature.email }}
        </a>
        <a
          v-if="candidature.telephone"
          :href="phoneHref"
          class="hover:text-foreground text-muted-foreground flex items-center gap-2 text-sm underline-offset-4 hover:underline"
        >
          <Phone class="size-4" aria-hidden="true" />
          {{ candidature.telephone }}
        </a>
        <p
          v-if="!candidature.email && !candidature.telephone"
          class="text-muted-foreground text-sm"
        >
          Aucune coordonnée renseignée.
        </p>
      </section>

      <Separator />

      <section aria-labelledby="skills-heading" class="grid gap-3">
        <h3 id="skills-heading" class="text-sm font-semibold">Compétences</h3>
        <SkillBadges
          :skills="candidature.competences"
          :highlight="preferences.filters.competences"
        />
        <div v-if="requiredSkills.length" class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs font-medium">
            Adéquation au poste : {{ matchedCount }}/{{ requiredSkills.length }} compétences
            requises
          </p>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <li
              v-for="{ skill, matched } in requiredSkills"
              :key="skill"
              :class="
                cn(
                  'flex items-center gap-1 text-xs',
                  matched ? 'text-foreground' : 'text-muted-foreground line-through',
                )
              "
            >
              <Check v-if="matched" class="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <X v-else class="size-3.5" />
              {{ skill }}
              <span class="sr-only">{{ matched ? '(acquise)' : '(manquante)' }}</span>
            </li>
          </ul>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="letter-heading" class="grid gap-2">
        <h3 id="letter-heading" class="text-sm font-semibold">Lettre de motivation</h3>
        <blockquote class="text-muted-foreground border-l-2 pl-4 text-sm leading-relaxed italic">
          {{ candidature.lettreMotivation }}
        </blockquote>
      </section>

      <Separator />

      <section aria-labelledby="comments-heading" class="grid gap-4">
        <h3 id="comments-heading" class="text-sm font-semibold">
          Commentaires
          <span class="text-muted-foreground font-normal">({{ comments.length }})</span>
        </h3>
        <CommentThread
          :comments="comments"
          @retry="emit('retryComment', $event)"
          @discard="emit('discardComment', $event)"
        />
        <CommentForm v-model:author="preferences.authorName" @submit="emit('addComment', $event)" />
      </section>
    </div>
  </div>
</template>
