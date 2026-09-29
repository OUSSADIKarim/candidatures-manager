<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { onKeyStroke, watchDebounced } from '@vueuse/core'
import { Search, X } from '@lucide/vue'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Kbd } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'

const props = withDefaults(defineProps<{ loading?: boolean; debounceMs?: number }>(), {
  debounceMs: 300,
})
const model = defineModel<string>({ required: true })

// Local value updates on every keystroke; the model (and thus the API call) is debounced.
const local = ref(model.value)
watchDebounced(local, (value) => (model.value = value), { debounce: props.debounceMs })
watch(model, (value) => {
  if (value !== local.value) local.value = value
})

const root = useTemplateRef<HTMLElement>('root')
const input = () => root.value?.querySelector('input')

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

// "/" focuses the search from anywhere, like on GitHub or Gmail.
onKeyStroke('/', (event) => {
  if (isTypingTarget(event.target)) return
  event.preventDefault()
  input()?.focus()
})

function clear() {
  local.value = ''
  model.value = ''
  input()?.focus()
}
</script>

<template>
  <div ref="root">
    <InputGroup>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        v-model="local"
        type="search"
        placeholder="Nom, compétence, ville…"
        aria-label="Rechercher des candidatures"
        @keydown.esc="clear"
      />
      <InputGroupAddon align="inline-end">
        <Spinner v-if="loading" />
        <InputGroupButton
          v-if="local"
          size="icon-xs"
          aria-label="Effacer la recherche"
          @click="clear"
        >
          <X />
        </InputGroupButton>
        <Kbd v-else class="hidden sm:inline-flex">/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  </div>
</template>
