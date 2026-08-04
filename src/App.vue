<script setup>
import {
  onBeforeUnmount,
  onMounted,
} from 'vue'

import Sidebar from './components/Sidebar.vue'
import { useSensorStore } from './stores/sensorStore'

const sensorStore = useSensorStore()

onMounted(() => {
  sensorStore.startSimulation()
})

onBeforeUnmount(() => {
  sensorStore.stopSimulation()
})
</script>

<template>
  <div class="app-shell">
    <Sidebar />

    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}
</style>