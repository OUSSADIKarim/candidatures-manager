<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { SendHorizontal } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const author = defineModel<string>('author', { required: true })
const emit = defineEmits<{ submit: [payload: { contenu: string; auteur: string }] }>()

const contenu = ref('')
const contentId = useId()
const authorId = useId()

const canSubmit = computed(() => contenu.value.trim() !== '' && author.value.trim() !== '')

function submit() {
  if (!canSubmit.value) return
  emit('submit', { contenu: contenu.value.trim(), auteur: author.value.trim() })
  contenu.value = ''
}
</script>

<template>
  <form class="grid gap-3" @submit.prevent="submit">
    <div class="grid gap-1.5">
      <Label :for="contentId" class="sr-only">Nouveau commentaire</Label>
      <Textarea
        :id="contentId"
        v-model="contenu"
        rows="3"
        placeholder="Ajouter un commentaire pour l'équipe…"
        class="resize-none"
        @keydown.meta.enter.prevent="submit"
        @keydown.ctrl.enter.prevent="submit"
      />
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Label :for="authorId" class="text-muted-foreground text-xs font-normal">Auteur</Label>
      <Input
        :id="authorId"
        v-model="author"
        placeholder="Votre nom"
        autocomplete="name"
        class="h-7 w-40 text-xs"
      />
      <span class="text-muted-foreground ml-auto hidden text-xs sm:inline">
        <Kbd>Ctrl</Kbd> + <Kbd>Entrée</Kbd>
      </span>
      <Button type="submit" size="sm" :disabled="!canSubmit">
        <SendHorizontal />
        Publier
      </Button>
    </div>
  </form>
</template>
