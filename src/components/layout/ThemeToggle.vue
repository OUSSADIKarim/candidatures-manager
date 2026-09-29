<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { Monitor, Moon, Sun } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// The storage key is also read by the inline script in index.html to avoid a flash on load.
const mode = useColorMode({ storageKey: 'cm:theme', disableTransition: false })
const preference = mode.store
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" aria-label="Changer le thème">
        <Sun class="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
        <Moon
          class="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup v-model="preference">
        <DropdownMenuRadioItem value="light"><Sun /> Clair</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark"><Moon /> Sombre</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="auto"><Monitor /> Système</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
