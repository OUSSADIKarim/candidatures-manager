<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'

const props = withDefaults(
  defineProps<{
    skills: string[]
    /** Maximum number of badges before collapsing into "+n". */
    max?: number
    /** Skills to emphasize (e.g. those matching the active filter). */
    highlight?: string[]
  }>(),
  { max: Infinity, highlight: () => [] },
)

const visible = computed(() => props.skills.slice(0, props.max))
const hidden = computed(() => props.skills.slice(props.max))
</script>

<template>
  <ul class="flex flex-wrap gap-1" aria-label="Compétences">
    <li v-for="skill in visible" :key="skill">
      <Badge :variant="highlight.includes(skill) ? 'default' : 'secondary'" class="font-normal">
        {{ skill }}
      </Badge>
    </li>
    <li v-if="hidden.length">
      <Badge variant="outline" class="font-normal" :title="hidden.join(', ')">
        +{{ hidden.length }}
        <span class="sr-only">: {{ hidden.join(', ') }}</span>
      </Badge>
    </li>
  </ul>
</template>
