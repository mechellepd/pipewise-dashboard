import {
  createRouter,
  createWebHashHistory,
} from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import OperationalPlaceholderView from '../views/OperationalPlaceholderView.vue'
import PipelineAssetsView from '../views/PipelineAssetsView.vue'
import NetworkMapView from '../views/NetworkMapView.vue'

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
  component: NetworkMapView,
  meta: {
    title: 'Network Map',
    },
  },
  {
    path: '/pipeline-assets',
  name: 'pipeline-assets',
  component: PipelineAssetsView,
  meta: {
    title: 'Pipeline Assets',
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