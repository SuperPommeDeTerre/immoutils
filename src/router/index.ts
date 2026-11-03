/**
 * router/index.ts
 *
 * Manual routes for ./src/pages/*.vue
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'
export enum Pages {
  HOME = 'home',
  SEARCH_BY_DPE = 'search-by-dpe',
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: Pages.HOME,
      component: Index,
    },
    {
      path: '/rechercher-par-dpe',
      name: Pages.SEARCH_BY_DPE,
      component: () => import('@/pages/SearchByDPE.vue'),
    },
  ],
})

export default router
