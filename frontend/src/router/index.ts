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
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue')
    },
    {
      path: '/reset-password/:token',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
      props: true
    }
  ]
})

// Auth guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated()) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !authStore.hasRole('admin')) {
    // Redirect non-admins away from admin pages
    next({ name: 'browse' })
  } else {
    next()
  }
})

export default router

