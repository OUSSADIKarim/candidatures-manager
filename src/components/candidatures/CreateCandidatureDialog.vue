<script setup lang="ts">
// POST /candidatures. Not optimistic: the server assigns the id, and a failed creation must keep
// the form open with everything the recruiter typed.
import { computed, reactive, ref, useId, watch } from 'vue'
import { Plus, TriangleAlert } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCandidatureActions } from '@/composables/useCandidatureActions'
import { describeError } from '@/lib/errors'
import { useReferentielsStore } from '@/stores/referentiels'

const referentiels = useReferentielsStore()
const actions = useCandidatureActions()

const open = ref(false)
const submitting = ref(false)
const submitted = ref(false) // show errors only after a first submit attempt
const serverError = ref<unknown>(null)

function emptyForm() {
  return {
    nom: '',
    email: '',
    telephone: '',
    localisation: '',
    poste: '',
    statut: referentiels.statuts[0]?.nom ?? '',
    competences: [] as string[],
    experience: '',
    disponibilite: '',
    salaireSouhaite: '',
    cv: '',
    lettreMotivation: '',
  }
}
const form = reactive(emptyForm())

// Fresh form each time the dialog opens (statuses may have loaded since).
watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(form, emptyForm())
  submitted.value = false
  serverError.value = null
})

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const errors = computed(() => {
  const result: Partial<Record<keyof typeof form, string>> = {}
  if (!form.nom.trim()) result.nom = 'Le nom est obligatoire.'
  if (!EMAIL.test(form.email.trim())) result.email = 'Adresse e-mail invalide.'
  if (!form.poste) result.poste = 'Choisissez un poste.'
  const salary = Number(form.salaireSouhaite)
  if (form.salaireSouhaite !== '' && (!Number.isFinite(salary) || salary < 0)) {
    result.salaireSouhaite = 'Montant invalide.'
  }
  if (form.cv.trim() && !URL.canParse(form.cv.trim())) result.cv = 'URL invalide (https://…).'
  return result
})

const visibleErrors = computed(() => (submitted.value ? errors.value : {}))

const ids = Object.fromEntries(Object.keys(emptyForm()).map((key) => [key, useId()])) as Record<
  keyof ReturnType<typeof emptyForm>,
  string
>

function fieldAttrs(key: keyof typeof form) {
  const error = visibleErrors.value[key]
  return {
    id: ids[key],
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${ids[key]}-error` : undefined,
  }
}

async function submit() {
  submitted.value = true
  if (Object.keys(errors.value).length > 0) {
    // Move focus to the first invalid field.
    const first = Object.keys(errors.value)[0] as keyof typeof form
    document.getElementById(ids[first])?.focus()
    return
  }
  submitting.value = true
  serverError.value = null
  try {
    await actions.create({
      nom: form.nom.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim(),
      localisation: form.localisation.trim(),
      poste: form.poste,
      statut: form.statut,
      competences: form.competences,
      experience: form.experience.trim(),
      disponibilite: form.disponibilite.trim(),
      salaireSouhaite: Number(form.salaireSouhaite) || 0,
      cv: form.cv.trim(),
      lettreMotivation: form.lettreMotivation.trim(),
      dateCandidature: new Date().toISOString(),
      commentaires: [],
    })
    open.value = false
  } catch (error) {
    serverError.value = error
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button :disabled="referentiels.status !== 'success'">
        <Plus />
        <span class="hidden sm:inline">Nouvelle candidature</span>
        <span class="sr-only sm:hidden">Nouvelle candidature</span>
      </Button>
    </DialogTrigger>
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Nouvelle candidature</DialogTitle>
        <DialogDescription>Les champs marqués * sont obligatoires.</DialogDescription>
      </DialogHeader>

      <form
        id="create-candidature"
        class="grid gap-4 sm:grid-cols-2"
        novalidate
        @submit.prevent="submit"
      >
        <Alert v-if="serverError" variant="destructive" class="sm:col-span-2">
          <TriangleAlert />
          <AlertTitle>{{ describeError(serverError).title }}</AlertTitle>
          <AlertDescription>
            La candidature n'a pas été enregistrée. {{ describeError(serverError).description }}
          </AlertDescription>
        </Alert>

        <div class="grid content-start gap-1.5">
          <Label :for="ids.nom">Nom complet *</Label>
          <Input v-model="form.nom" v-bind="fieldAttrs('nom')" autocomplete="off" />
          <p v-if="visibleErrors.nom" :id="`${ids.nom}-error`" class="text-destructive text-xs">
            {{ visibleErrors.nom }}
          </p>
        </div>
        <div class="grid content-start gap-1.5">
          <Label :for="ids.email">E-mail *</Label>
          <Input
            v-model="form.email"
            v-bind="fieldAttrs('email')"
            type="email"
            autocomplete="off"
          />
          <p v-if="visibleErrors.email" :id="`${ids.email}-error`" class="text-destructive text-xs">
            {{ visibleErrors.email }}
          </p>
        </div>
        <div class="grid content-start gap-1.5">
          <Label :for="ids.telephone">Téléphone</Label>
          <Input v-model="form.telephone" v-bind="fieldAttrs('telephone')" type="tel" />
        </div>
        <div class="grid content-start gap-1.5">
          <Label :for="ids.localisation">Localisation</Label>
          <Input
            v-model="form.localisation"
            v-bind="fieldAttrs('localisation')"
            placeholder="Paris, France"
          />
        </div>

        <div class="grid content-start gap-1.5">
          <Label :for="ids.poste">Poste *</Label>
          <Select v-model="form.poste">
            <SelectTrigger v-bind="fieldAttrs('poste')" class="w-full">
              <SelectValue placeholder="Choisir un poste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="poste in referentiels.postes" :key="poste.id" :value="poste.titre">
                {{ poste.titre }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="visibleErrors.poste" :id="`${ids.poste}-error`" class="text-destructive text-xs">
            {{ visibleErrors.poste }}
          </p>
        </div>
        <div class="grid content-start gap-1.5">
          <Label :for="ids.statut">Statut</Label>
          <Select v-model="form.statut">
            <SelectTrigger :id="ids.statut" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="statut in referentiels.statuts"
                :key="statut.id"
                :value="statut.nom"
              >
                {{ statut.nom }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <fieldset class="grid gap-1.5 sm:col-span-2">
          <legend class="mb-1.5 text-sm font-medium">Compétences</legend>
          <ToggleGroup
            v-model="form.competences"
            type="multiple"
            variant="outline"
            size="sm"
            :spacing="1"
            class="flex-wrap justify-start"
          >
            <ToggleGroupItem
              v-for="competence in referentiels.competences"
              :key="competence.id"
              :value="competence.nom"
              class="text-xs"
            >
              {{ competence.nom }}
            </ToggleGroupItem>
          </ToggleGroup>
        </fieldset>

        <div class="grid content-start gap-1.5">
          <Label :for="ids.experience">Expérience</Label>
          <Input v-model="form.experience" v-bind="fieldAttrs('experience')" placeholder="3 ans" />
        </div>
        <div class="grid content-start gap-1.5">
          <Label :for="ids.disponibilite">Disponibilité</Label>
          <Input
            v-model="form.disponibilite"
            v-bind="fieldAttrs('disponibilite')"
            placeholder="Immédiate, 1 mois…"
          />
        </div>
        <div class="grid content-start gap-1.5">
          <Label :for="ids.salaireSouhaite">Salaire souhaité (€ / an)</Label>
          <Input
            v-model="form.salaireSouhaite"
            v-bind="fieldAttrs('salaireSouhaite')"
            type="number"
            min="0"
            step="1000"
            inputmode="numeric"
          />
          <p
            v-if="visibleErrors.salaireSouhaite"
            :id="`${ids.salaireSouhaite}-error`"
            class="text-destructive text-xs"
          >
            {{ visibleErrors.salaireSouhaite }}
          </p>
        </div>
        <div class="grid content-start gap-1.5">
          <Label :for="ids.cv">Lien du CV</Label>
          <Input v-model="form.cv" v-bind="fieldAttrs('cv')" type="url" placeholder="https://…" />
          <p v-if="visibleErrors.cv" :id="`${ids.cv}-error`" class="text-destructive text-xs">
            {{ visibleErrors.cv }}
          </p>
        </div>
        <div class="grid content-start gap-1.5 sm:col-span-2">
          <Label :for="ids.lettreMotivation">Lettre de motivation</Label>
          <Textarea
            v-model="form.lettreMotivation"
            v-bind="fieldAttrs('lettreMotivation')"
            rows="3"
            class="resize-none"
          />
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" :disabled="submitting" @click="open = false">Annuler</Button>
        <Button type="submit" form="create-candidature" :disabled="submitting">
          <Spinner v-if="submitting" />
          {{ submitting ? 'Enregistrement…' : 'Ajouter la candidature' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
