import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'browse',
      component: () => import('@/views/BrowseView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/submissions/:id',
      name: 'submission',
      component: () => import('@/views/AnnotationWorkspace.vue'),
      props: true
    },
    {
      path: '/submit',
      name: 'submit',
      component: () => import('@/views/SubmitView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/topics',
      name: 'topics',
      component: () => import('@/views/TopicsManagementView.vue')
    },
    {
      path: '/topics/:id',
      name: 'topic',
      component: () => import('@/views/TopicView.vue'),
      props: true
    },
    {
      path: '/ontologies',
      name: 'ontologies',
      component: () => import('@/views/OntologiesView.vue')
    },
    {
      path: '/criteria',
      name: 'criteria',
      component: () => import('@/views/RankingsView.vue')
    },
    {
      path: '/rankings',
      name: 'rankings',
      component: () => import('@/views/RankingsView.vue')
    }
  ]
})

// Auth guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router

