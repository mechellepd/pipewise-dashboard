<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import DashboardView from './views/DashboardView.vue'

const activeMenu = ref('Dashboard')
</script>

<template>
  <div class="app-shell">
    <Sidebar
      :active-menu="activeMenu"
      @change-menu="activeMenu = $event"
    />

    <DashboardView :active-menu="activeMenu" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}
</style>