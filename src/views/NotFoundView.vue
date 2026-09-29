<script setup lang="ts">
import { MapPinOff } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
</script>

<template>
  <Empty class="mt-12">
    <EmptyHeader>
      <EmptyMedia variant="icon"><MapPinOff /></EmptyMedia>
      <EmptyTitle>Page introuvable</EmptyTitle>
      <EmptyDescription>L'adresse demandée n'existe pas.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child>
        <RouterLink to="/">Retour aux candidatures</RouterLink>
      </Button>
    </EmptyContent>
  </Empty>
</template>
