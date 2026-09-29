<script setup lang="ts">
import { computed } from 'vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGE_SIZES } from '@/stores/preferences'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [size: number]
}>()

const range = computed(() => {
  const start = (props.page - 1) * props.pageSize + 1
  const end = Math.min(props.page * props.pageSize, props.total)
  return { start, end }
})
</script>

<template>
  <div class="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
    <p class="text-muted-foreground text-sm" aria-live="polite">
      {{ range.start }}–{{ range.end }} sur {{ total }}
      {{ total > 1 ? 'candidatures' : 'candidature' }}
    </p>

    <div class="flex flex-wrap items-center justify-center gap-3">
      <div class="flex items-center gap-2">
        <span id="page-size-label" class="text-muted-foreground text-sm">Par page</span>
        <Select
          :model-value="String(pageSize)"
          @update:model-value="emit('update:pageSize', Number($event))"
        >
          <SelectTrigger size="sm" class="w-18" aria-labelledby="page-size-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in PAGE_SIZES" :key="size" :value="String(size)">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Pagination
        v-slot="{ page: current }"
        :page="page"
        :total="total"
        :items-per-page="pageSize"
        :sibling-count="1"
        show-edges
        class="mx-0 w-auto"
        aria-label="Pagination"
        @update:page="emit('update:page', $event)"
      >
        <PaginationContent v-slot="{ items }">
          <PaginationPrevious />
          <template v-for="(item, index) in items" :key="index">
            <PaginationItem
              v-if="item.type === 'page'"
              :value="item.value"
              :is-active="item.value === current"
              :aria-current="item.value === current ? 'page' : undefined"
            >
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :index="index" />
          </template>
          <PaginationNext />
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
