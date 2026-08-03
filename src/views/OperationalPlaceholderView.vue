<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import Topbar from '../components/Topbar.vue'

const route = useRoute()

const title = computed(() => {
  return route.meta.title ?? 'PIPEWISE'
})

const description = computed(() => {
  return route.meta.description ?? ''
})
</script>

<template>
  <main class="main-content">
    <Topbar />

    <section class="page-content">
      <article class="placeholder-panel">
        <div class="placeholder-icon">
          ◈
        </div>

        <p class="eyebrow">
          PIPEWISE MODULE
        </p>

        <h3>{{ title }}</h3>

        <p class="description">
          {{ description }}
        </p>

        <span class="development-badge">
          Module under development
        </span>
      </article>
    </section>
  </main>
</template>

<style scoped>
.main-content {
  width: calc(100% - 252px);
  min-width: 0;
  margin-left: 252px;
}

.page-content {
  display: grid;
  min-height: calc(100vh - 86px);
  place-items: center;
  padding: 28px;
}

.placeholder-panel {
  width: min(100%, 620px);
  padding: 64px 36px;
  border: 1px solid #1b303e;
  border-radius: 16px;
  background:
    radial-gradient(
      circle at top,
      rgba(0, 194, 255, 0.09),
      transparent 18rem
    ),
    rgba(11, 25, 34, 0.96);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.placeholder-icon {
  display: grid;
  width: 58px;
  height: 58px;
  margin: 0 auto 22px;
  place-items: center;
  border: 1px solid rgba(0, 194, 255, 0.3);
  border-radius: 15px;
  background: rgba(0, 194, 255, 0.09);
  color: #61e4ff;
  font-size: 1.5rem;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4a829d;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

h3 {
  margin: 0;
  color: #f4fbff;
  font-size: 1.7rem;
}

.description {
  max-width: 470px;
  margin: 14px auto 24px;
  color: #78909f;
  font-size: 0.86rem;
  line-height: 1.7;
}

.development-badge {
  display: inline-flex;
  padding: 8px 12px;
  border: 1px solid rgba(255, 200, 87, 0.22);
  border-radius: 999px;
  background: rgba(255, 200, 87, 0.07);
  color: #ffc857;
  font-size: 0.68rem;
  font-weight: 800;
}

@media (max-width: 820px) {
  .main-content {
    width: calc(100% - 82px);
    margin-left: 0;
  }

  .page-content {
    padding: 16px;
  }

  .placeholder-panel {
    padding: 48px 22px;
  }
}
</style>