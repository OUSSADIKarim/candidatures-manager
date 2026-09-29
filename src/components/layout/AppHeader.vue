<script setup lang="ts">
import { BriefcaseBusiness } from '@lucide/vue'
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <header
    class="bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 border-b backdrop-blur"
  >
    <div class="flex h-14 items-center gap-4 px-4 sm:px-6 lg:px-8">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold">
        <span
          class="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md"
          aria-hidden="true"
        >
          <BriefcaseBusiness class="size-4" />
        </span>
        <span class="hidden sm:inline">Recrutement</span>
        <span class="sr-only sm:hidden">Recrutement — accueil</span>
      </RouterLink>
      <!-- Wrapper: ThemeToggle's root (DropdownMenu) renders no element to carry a class. -->
      <div class="ml-auto">
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
