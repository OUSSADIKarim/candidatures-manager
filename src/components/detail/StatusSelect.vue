<script setup lang="ts">
import StatusDot from '@/components/common/StatusDot.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReferentielsStore } from '@/stores/referentiels'

defineProps<{ id?: string; disabled?: boolean }>()
const model = defineModel<string>({ required: true })

const referentiels = useReferentielsStore()
</script>

<template>
  <Select v-model="model" :disabled="disabled">
    <SelectTrigger :id="id" class="w-full sm:w-56">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="statut in referentiels.statuts" :key="statut.id" :value="statut.nom">
        <StatusDot :statut="statut.nom" />
        {{ statut.nom }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
