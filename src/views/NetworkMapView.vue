<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import Topbar from '../components/Topbar.vue'
import PipelineMap from '../components/PipelineMap.vue'

const route = useRoute()

const selectedPipelineId = computed(() => {
  const pipelineId = route.query.pipeline

  return typeof pipelineId === 'string'
    ? pipelineId
    : null
})
</script>

<template>
  <main class="main-content">
    <Topbar />

    <section class="page-content">
      <div class="page-heading">
        <div>
          <p class="eyebrow">
            GEOSPATIAL OPERATIONS
          </p>

          <h3>Pipeline Network Map</h3>

          <p>
            Explore pipeline routes, sensor locations and current
            infrastructure conditions across the monitored network.
          </p>
        </div>

        <div
          v-if="selectedPipelineId"
          class="selected-asset"
        >
          Focused asset:
          <strong>{{ selectedPipelineId }}</strong>
        </div>
      </div>

      <PipelineMap
        :focus-pipeline-id="selectedPipelineId"
        expanded
      />
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
  padding: 26px 28px 40px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #4a829d;
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.page-heading h3 {
  margin: 0;
  color: #f4fbff;
  font-size: 1.35rem;
}

.page-heading p:not(.eyebrow) {
  max-width: 680px;
  margin: 8px 0 0;
  color: #78909f;
  font-size: 0.8rem;
  line-height: 1.6;
}

.selected-asset {
  flex-shrink: 0;
  padding: 9px 12px;
  border: 1px solid rgba(0, 194, 255, 0.22);
  border-radius: 999px;
  background: rgba(0, 194, 255, 0.07);
  color: #78909f;
  font-size: 0.68rem;
}

.selected-asset strong {
  margin-left: 4px;
  color: #61e4ff;
}

@media (max-width: 820px) {
  .main-content {
    width: calc(100% - 82px);
    margin-left: 0;
  }

  .page-content {
    padding-inline: 16px;
  }
}

@media (max-width: 580px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>