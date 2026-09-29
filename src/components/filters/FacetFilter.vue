<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Check, CirclePlus } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface FacetOption {
  value: string
  label: string
  /** Optional color dot (statuses). */
  color?: string
  /** Optional group heading (skill categories). */
  group?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    options: FacetOption[]
    icon?: Component
    searchable?: boolean
    disabled?: boolean
  }>(),
  { icon: CirclePlus },
)
const selected = defineModel<string[]>({ required: true })

const groups = computed(() => {
  const map = new Map<string, FacetOption[]>()
  for (const option of props.options) {
    const key = option.group ?? ''
    map.set(key, [...(map.get(key) ?? []), option])
  }
  return [...map.entries()].map(([heading, options]) => ({ heading, options }))
})

const selectedLabels = computed(() =>
  props.options.filter((o) => selected.value.includes(o.value)).map((o) => o.label),
)
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="disabled"
        :class="cn('border-dashed', selected.length && 'border-solid')"
      >
        <component :is="icon" />
        {{ title }}
        <template v-if="selected.length">
          <Separator orientation="vertical" class="mx-0.5 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
            {{ selected.length }}
          </Badge>
          <span class="hidden gap-1 lg:flex">
            <Badge
              v-if="selected.length > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selected.length }} sélectionnés
            </Badge>
            <template v-else>
              <Badge
                v-for="label in selectedLabels"
                :key="label"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ label }}
              </Badge>
            </template>
          </span>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-0" align="start">
      <Command v-model="selected" multiple>
        <CommandInput v-if="searchable" :placeholder="`Rechercher : ${title.toLowerCase()}`" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup
            v-for="group in groups"
            :key="group.heading"
            :heading="group.heading || undefined"
          >
            <CommandItem v-for="option in group.options" :key="option.value" :value="option.value">
              <span
                :class="
                  cn(
                    'flex size-4 items-center justify-center rounded-[4px] border',
                    selected.includes(option.value)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'opacity-60 [&_svg]:invisible',
                  )
                "
                aria-hidden="true"
              >
                <Check class="size-3" />
              </span>
              <span
                v-if="option.color"
                class="size-2 rounded-full"
                :style="{ backgroundColor: option.color }"
                aria-hidden="true"
              />
              <span class="truncate">{{ option.label }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <template v-if="$slots.footer || selected.length">
          <CommandSeparator />
          <div class="flex flex-col gap-2 p-2">
            <slot name="footer" />
            <Button
              v-if="selected.length"
              variant="ghost"
              size="sm"
              class="w-full"
              @click="selected = []"
            >
              Effacer la sélection
            </Button>
          </div>
        </template>
      </Command>
    </PopoverContent>
  </Popover>
</template>
