<script setup lang="ts">
import { computed, useId } from 'vue'
import { CalendarDays } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const from = defineModel<string | null>('from', { required: true })
const to = defineModel<string | null>('to', { required: true })

const fromId = useId()
const toId = useId()

const short = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const format = (date: string) => short.format(new Date(`${date}T00:00:00`))

const summary = computed(() => {
  if (from.value && to.value) return `${format(from.value)} → ${format(to.value)}`
  if (from.value) return `Depuis le ${format(from.value)}`
  if (to.value) return `Jusqu'au ${format(to.value)}`
  return null
})

const isActive = computed(() => Boolean(from.value || to.value))
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" :class="cn('border-dashed', isActive && 'border-solid')">
        <CalendarDays />
        Date
        <template v-if="summary">
          <Separator orientation="vertical" class="mx-0.5 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal">{{ summary }}</Badge>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-72" align="start">
      <fieldset class="grid gap-3">
        <legend class="mb-3 text-sm font-medium">Date de candidature</legend>
        <div class="grid gap-1.5">
          <Label :for="fromId">Du</Label>
          <Input
            :id="fromId"
            type="date"
            :model-value="from ?? ''"
            :max="to ?? undefined"
            @update:model-value="from = $event ? String($event) : null"
          />
        </div>
        <div class="grid gap-1.5">
          <Label :for="toId">Au</Label>
          <Input
            :id="toId"
            type="date"
            :model-value="to ?? ''"
            :min="from ?? undefined"
            @update:model-value="to = $event ? String($event) : null"
          />
        </div>
        <Button
          v-if="isActive"
          variant="ghost"
          size="sm"
          @click="
            () => {
              from = null
              to = null
            }
          "
        >
          Effacer les dates
        </Button>
      </fieldset>
    </PopoverContent>
  </Popover>
</template>
