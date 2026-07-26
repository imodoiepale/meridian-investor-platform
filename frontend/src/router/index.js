import { createRouter, createWebHistory } from 'vue-router'
import PublicLayout from '../layouts/PublicLayout.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Landing from '../views/Landing.vue'
import LoginView from '../views/LoginView.vue'
import { supabase, supabaseEnabled, getSession } from '../lib/supabase'

// Marketing + app views are lazy-loaded so the landing page ships the smallest
// possible first paint.
const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'Landing', component: Landing, meta: { heroNav: true, title: 'Global Investor OS' } },
      { path: 'about', name: 'About', component: () => import('../views/marketing/AboutView.vue'), meta: { title: 'About' } },
      { path: 'pricing', name: 'Pricing', component: () => import('../views/marketing/PricingView.vue'), meta: { title: 'Pricing' } },
      { path: 'help', name: 'Help', component: () => import('../views/marketing/HelpView.vue'), meta: { title: 'Help center' } },
    ],
  },

  { path: '/login', name: 'Login', component: LoginView, meta: { title: 'Sign in' } },

  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/InvestorDashboard.vue'), meta: { title: 'Market entry command center' } },
      { path: 'profile', name: 'Profile', component: () => import('../views/ProfileWizard.vue'), meta: { title: 'My profile' } },
      { path: 'concierge', name: 'Concierge', component: () => import('../views/ConciergeView.vue'), meta: { title: 'Investor concierge' } },
      { path: 'licences', name: 'Licences', component: () => import('../views/LicenceExplorer.vue'), meta: { title: 'Licence explorer' } },
      { path: 'automations', name: 'Automations', component: () => import('../views/AutomationsView.vue'), meta: { title: 'Live automations' } },
      { path: 'applications', name: 'Applications', component: () => import('../views/ApplicationsView.vue'), meta: { title: 'Applications' } },
      { path: 'experts', name: 'Experts', component: () => import('../views/ExpertsView.vue'), meta: { title: 'Trusted local experts' } },
      { path: 'documents', name: 'Documents', component: () => import('../views/DocumentsView.vue'), meta: { title: 'Documents' } },
      { path: 'invest/roadmap', name: 'Roadmap', component: () => import('../views/RoadmapView.vue'), meta: { title: 'Your roadmap' } },
      { path: 'invest/graphs', name: 'MarketInsights', component: () => import('../views/MiroFishGraphs.vue'), meta: { title: 'Market insights' } },
      { path: 'invest', name: 'Onboarding', component: () => import('../views/InvestorOnboarding.vue'), meta: { title: 'Simulation studio' } },
      { path: 'invest/dashboard', name: 'Simulation', component: () => import('../views/SimulationDashboard.vue'), meta: { title: 'Simulation report' } },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  if (!to.matched.some((r) => r.meta?.requiresAuth)) return true
  // Guest mode: when Supabase isn't configured we let everything through so
  // local dev and the demo walkthrough stay unblocked.
  if (!supabaseEnabled) return true
  const session = await getSession()
  if (session) return true
  return { name: 'Login', query: { next: to.fullPath } }
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `Meridian — ${title}` : 'Meridian — Global Investor OS'
})

if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') router.push({ name: 'Landing' })
  })
}

export default router
