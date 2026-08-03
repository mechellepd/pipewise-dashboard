<script setup>
import Sidebar from './components/Sidebar.vue'
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