<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
</script>

<template>
  <TooltipProvider>
    <a
      href="#main"
      class="bg-background sr-only z-50 rounded-md border px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Aller au contenu
    </a>
    <div class="flex min-h-dvh flex-col">
      <AppHeader />
      <main id="main" class="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <RouterView />
      </main>
    </div>
    <Toaster position="bottom-right" close-button />
  </TooltipProvider>
</template>
