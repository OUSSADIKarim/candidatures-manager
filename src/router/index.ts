import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import CandidaturesPage from '@/views/CandidaturesPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'candidatures' } },
    {
      // Single page for both views (list/board, chosen in preferences).
      path: '/candidatures',
      name: 'candidatures',
      component: CandidaturesPage,
      meta: { title: 'Candidatures' },
      children: [
        {
          // Detail panel over the current view, so a candidature can be shared by URL.
          path: ':id(\\d+)',
          name: 'candidature-detail',
          component: () => import('@/components/detail/CandidatureDetailSheet.vue'),
          props: (route: RouteLocationNormalized) => ({ id: Number(route.params.id) }),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Page introuvable' },
    },
  ],
})

router.afterEach((to) => {
  const title = [...to.matched].reverse().find((record) => record.meta.title)?.meta.title
  document.title = title ? `${title} · Recrutement` : 'Recrutement'
})

export default router
