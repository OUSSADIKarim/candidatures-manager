<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRightLeft } from '@lucide/vue'
import StatusDot from '@/components/common/StatusDot.vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useReferentielsStore } from '@/stores/referentiels'

// Keyboard/touch alternative to drag & drop: drag must never be the only way to change a status.
const props = defineProps<{ nom: string; statut: string }>()
const emit = defineEmits<{ move: [statut: string] }>()

const referentiels = useReferentielsStore()
const targets = computed(() => referentiels.statuts.filter((s) => s.nom !== props.statut))
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon-sm" :aria-label="`Déplacer ${nom} vers…`">
        <ArrowRightLeft />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-52">
      <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="target in targets"
        :key="target.id"
        @select="emit('move', target.nom)"
      >
        <StatusDot :statut="target.nom" />
        {{ target.nom }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
