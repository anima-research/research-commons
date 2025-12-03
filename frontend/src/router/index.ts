import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingPage.vue')
    },
    {
      path: '/browse',
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
    },
    {
      path: '/models',
      name: 'models',
      component: () => import('@/views/ModelsView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/screening',
      name: 'screening',
      component: () => import('@/views/ScreeningView.vue'),
      meta: { requiresAuth: true, requiresRole: ['researcher', 'admin'] }
    }
  ]
})

// Auth and role guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Check auth requirement
  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // Check role requirement (if specified)
  const requiredRoles = to.meta.requiresRole as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => authStore.hasRole(role as any))
    if (!hasRequiredRole) {
      // Redirect to browse if authenticated but unauthorized
      console.warn('[Router] User lacks required role for', to.path, '- required:', requiredRoles)
      next({ name: 'browse' })
      return
    }
  }
  
  next()
})

export default router

