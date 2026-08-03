import {
  createRouter,
  createWebHashHistory,
} from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import OperationalPlaceholderView from '../views/OperationalPlaceholderView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      title: 'Dashboard',
    },
  },
  {
    path: '/network-map',
    name: 'network-map',
    component: OperationalPlaceholderView,
    meta: {
      title: 'Network Map',
      description:
        'Explore pipeline routes, sensor locations and network conditions.',
    },
  },
  {
    path: '/pipeline-assets',
    name: 'pipeline-assets',
    component: OperationalPlaceholderView,
    meta: {
      title: 'Pipeline Assets',
      description:
        'Review registered pipelines and their lifecycle information.',
    },
  },
  {
    path: '/sensor-network',
    name: 'sensor-network',
    component: OperationalPlaceholderView,
    meta: {
      title: 'Sensor Network',
      description:
        'Monitor pressure sensors, flow meters and valve stations.',
    },
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: OperationalPlaceholderView,
    meta: {
      title: 'Alerts',
      description:
        'Review active warnings, critical incidents and alert history.',
    },
  },
  {
    path: '/maintenance',
    name: 'maintenance',
    component: OperationalPlaceholderView,
    meta: {
      title: 'Maintenance',
      description:
        'Plan inspections, repairs and preventive maintenance activities.',
    },
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: OperationalPlaceholderView,
    meta: {
      title: 'Analytics',
      description:
        'Analyse pressure, flow, water loss and infrastructure performance.',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router