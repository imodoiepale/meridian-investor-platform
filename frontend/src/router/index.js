import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import InvestorOnboarding from '../views/InvestorOnboarding.vue'
import RoadmapView from '../views/RoadmapView.vue'
import SimulationDashboard from '../views/SimulationDashboard.vue'
import MeridianGraphs from '../views/MiroFishGraphs.vue'
import ConciergeView from '../views/ConciergeView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/concierge',
    name: 'Concierge',
    component: ConciergeView
  },
  {
    path: '/invest',
    name: 'KenyaInvest',
    component: InvestorOnboarding
  },
  {
    path: '/invest/roadmap',
    name: 'KenyaRoadmap',
    component: RoadmapView
  },
  {
    path: '/invest/dashboard',
    name: 'KenyaDashboard',
    component: SimulationDashboard
  },
  {
    path: '/invest/graphs',
    name: 'KenyaGraphs',
    component: MeridianGraphs
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  const titles = {
    Home: 'Meridian — Kenya Invest',
    Concierge: 'Meridian — Investor Concierge',
    KenyaInvest: 'Meridian — Investor Onboarding',
    KenyaRoadmap: 'Meridian — Kenya Roadmap',
    KenyaDashboard: 'Meridian — Simulation Dashboard',
    KenyaGraphs: 'Meridian — Agent Graphs',
  }
  document.title = titles[to.name] || 'Meridian — Kenya Invest'
})

export default router
