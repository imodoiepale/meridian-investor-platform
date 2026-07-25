import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import InvestorOnboarding from '../views/InvestorOnboarding.vue'
import RoadmapView from '../views/RoadmapView.vue'
import SimulationDashboard from '../views/SimulationDashboard.vue'
import MeridianGraphs from '../views/MiroFishGraphs.vue'
import ConciergeView from '../views/ConciergeView.vue'
import ProfileWizard from '../views/ProfileWizard.vue'
import InvestorDashboard from '../views/InvestorDashboard.vue'
import LoginView from '../views/LoginView.vue'
import { supabase, supabaseEnabled, getSession } from '../lib/supabase'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/concierge', name: 'Concierge', component: ConciergeView },
  { path: '/invest', name: 'KenyaInvest', component: InvestorOnboarding },
  { path: '/invest/roadmap', name: 'KenyaRoadmap', component: RoadmapView },
  { path: '/invest/dashboard', name: 'KenyaDashboard', component: SimulationDashboard },
  { path: '/invest/graphs', name: 'KenyaGraphs', component: MeridianGraphs },
  { path: '/profile', name: 'Profile', component: ProfileWizard, meta: { requiresAuth: true } },
  { path: '/dashboard', name: 'Dashboard', component: InvestorDashboard, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  if (!to.meta?.requiresAuth) return true
  // If Supabase auth isn't configured, allow through (guest mode) — banner
  // in views prompts the user to configure. This keeps local dev unblocked.
  if (!supabaseEnabled) return true
  const session = await getSession()
  if (session) return true
  return { name: 'Login', query: { next: to.fullPath } }
})

router.afterEach((to) => {
  const titles = {
    Home: 'Meridian — Kenya Invest',
    Login: 'Meridian — Sign in',
    Concierge: 'Meridian — Investor Concierge',
    KenyaInvest: 'Meridian — Investor Onboarding',
    KenyaRoadmap: 'Meridian — Kenya Roadmap',
    KenyaDashboard: 'Meridian — Simulation Dashboard',
    KenyaGraphs: 'Meridian — Agent Graphs',
    Profile: 'Meridian — Investor Profile',
    Dashboard: 'Meridian — My Dashboard',
  }
  document.title = titles[to.name] || 'Meridian — Kenya Invest'
})

if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') router.push({ name: 'Home' })
  })
}

export default router
