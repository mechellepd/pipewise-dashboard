<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import NotificationDrawer from './NotificationDrawer.vue'
import RegisterAssetModal from './RegisterAssetModal.vue'
import RegisterSensorModal from './RegisterSensorModal.vue'

import { useNotificationStore } from '../stores/notificationStore'
import { useSensorStore } from '../stores/sensorStore'

const props = defineProps({
  activeMenu: {
    type: String,
    default: '',
  },
})

const route = useRoute()
const pageTitle = computed(
  () => props.activeMenu || route.meta.title || 'PIPEWISE',
)

const notificationStore =
  useNotificationStore()

const sensorStore =
  useSensorStore()

const isNotificationDrawerOpen =
  ref(false)

/*
|--------------------------------------------------------------------------
| Notification Centre
|--------------------------------------------------------------------------
*/

function openNotificationDrawer() {
  isNotificationDrawerOpen.value = true
}

function closeNotificationDrawer() {
  isNotificationDrawerOpen.value = false
}

/*
|--------------------------------------------------------------------------
| Asset Registration
|--------------------------------------------------------------------------
*/

const isRegisterModalOpen = ref(false)
const isSensorModalOpen = ref(false)
const sensorPipelineId = ref('')
const recentlyRegisteredAsset = ref(null)

function openRegisterAsset() {
  isRegisterModalOpen.value = true
}

function closeRegisterAsset() {
  isRegisterModalOpen.value = false
}

function handleAssetRegistered(asset) {
  recentlyRegisteredAsset.value = asset
}

function addSensorsToNewAsset() {
  sensorPipelineId.value = recentlyRegisteredAsset.value?.id ?? ''
  recentlyRegisteredAsset.value = null
  isSensorModalOpen.value = true
}
</script>

<template>
  <header class="topbar">

    <!-- Page information -->
    <div class="topbar-heading">

      <p class="eyebrow">
        SMART INFRASTRUCTURE MONITORING
      </p>

      <h2>
        {{ pageTitle }}
      </h2>

    </div>

    <!-- Topbar actions -->
    <div class="topbar-actions">

      <!-- Live monitoring -->
      <div class="live-indicator">
        <span></span>

        LIVE MONITORING
      </div>


      <!-- Demo Mode: Start -->
      <button
        v-if="!sensorStore.isDemoRunning"
        class="demo-button"
        type="button"
        @click="sensorStore.startLeakDemo"
      >
        ▶ Demo Leak Scenario
      </button>


      <!-- Demo Mode: Running -->
      <button
        v-else
        class="demo-button active"
        type="button"
        disabled
      >
        ● Demo Running
      </button>


      <!-- Demo Mode: Reset -->
      <button
        v-if="
          sensorStore.demoStage !== 'idle'
        "
        class="reset-demo-button"
        type="button"
        @click="sensorStore.resetLeakDemo"
      >
        Reset
      </button>


      <!-- Notification Centre -->
      <button
        class="
          icon-button
          notification-button
        "
        type="button"
        aria-label="Open notifications"
        @click="openNotificationDrawer"
      >
        <span aria-hidden="true">
          🔔
        </span>

        <span
          v-if="
            notificationStore.unreadCount > 0
          "
          class="notification-badge"
        >
          {{
            notificationStore.unreadCount > 9
              ? '9+'
              : notificationStore.unreadCount
          }}
        </span>
      </button>


      <!-- Register Asset -->
      <button
        class="primary-button"
        type="button"
        @click="openRegisterAsset"
      >
        + Register Asset
      </button>

    </div>

  </header>


  <!-- Notification Drawer -->
  <NotificationDrawer
    :is-open="
      isNotificationDrawerOpen
    "
    @close="
      closeNotificationDrawer
    "
  />


  <RegisterAssetModal
    :is-open="isRegisterModalOpen"
    @close="closeRegisterAsset"
    @registered="handleAssetRegistered"
  />

  <RegisterSensorModal
    :is-open="isSensorModalOpen"
    :pipeline-id="sensorPipelineId"
    @close="isSensorModalOpen = false"
  />

  <Teleport to="body">
    <div
      v-if="recentlyRegisteredAsset"
      class="asset-success-backdrop"
      @click.self="recentlyRegisteredAsset = null"
    >
      <section class="asset-success-modal" role="dialog" aria-modal="true">
        <span class="success-icon">✓</span>
        <p class="modal-eyebrow">PIPELINE REGISTERED</p>
        <h3>{{ recentlyRegisteredAsset.id }} is ready</h3>
        <p>Add IoT sensors now, or finish and configure them later from the Sensor Network module.</p>
        <div>
          <button type="button" @click="recentlyRegisteredAsset = null">Finish</button>
          <button class="add-sensor-button" type="button" @click="addSensorsToNewAsset">Add sensors now</button>
        </div>
      </section>
    </div>
  </Teleport>

</template>

<style scoped>

.asset-success-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1340;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(1, 9, 14, 0.78);
  backdrop-filter: blur(7px);
}

.asset-success-modal {
  width: min(100%, 470px);
  padding: 28px;
  border: 1px solid rgba(32, 219, 155, 0.3);
  border-radius: 15px;
  background: #091821;
  text-align: center;
}

.success-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin: 0 auto 15px;
  place-items: center;
  border-radius: 50%;
  background: rgba(32, 219, 155, 0.12);
  color: #4ce4af;
  font-size: 1.25rem;
}

.asset-success-modal h3 {
  margin: 0;
  color: #f4fbff;
}

.asset-success-modal > p:not(.modal-eyebrow) {
  margin: 10px 0 22px;
  color: #78909f;
  font-size: 0.72rem;
  line-height: 1.55;
}

.asset-success-modal > div {
  display: flex;
  justify-content: center;
  gap: 9px;
}

.asset-success-modal button {
  min-height: 40px;
  padding: 0 15px;
  border: 1px solid #294353;
  border-radius: 8px;
  background: #10232f;
  color: #9ab0bc;
  font-weight: 800;
}

.asset-success-modal .add-sensor-button {
  border: 0;
  background: #00addf;
  color: #00131c;
}

/*
|--------------------------------------------------------------------------
| Topbar
|--------------------------------------------------------------------------
*/

.topbar {
  position: sticky;
  top: 0;
  z-index: 15;

  display: flex;
  align-items: center;
  justify-content: space-between;

  min-height: 86px;

  padding: 16px 28px;

  border-bottom:
    1px solid #1b2d3a;

  background:
    rgba(7, 16, 25, 0.88);

  backdrop-filter:
    blur(18px);
}


/*
|--------------------------------------------------------------------------
| Heading
|--------------------------------------------------------------------------
*/

.topbar-heading {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 4px;

  color: #4a829d;

  font-size: 0.63rem;
  font-weight: 800;

  letter-spacing: 0.15em;
}

.topbar h2 {
  margin: 0;

  color: #f4fbff;

  font-size: 1.42rem;
}


/*
|--------------------------------------------------------------------------
| Actions
|--------------------------------------------------------------------------
*/

.topbar-actions {
  display: flex;
  align-items: center;

  gap: 11px;

  flex-shrink: 0;
}


/*
|--------------------------------------------------------------------------
| Live Monitoring
|--------------------------------------------------------------------------
*/

.live-indicator {
  display: flex;
  align-items: center;

  gap: 7px;

  padding: 8px 11px;

  border:
    1px solid
    rgba(32, 219, 155, 0.25);

  border-radius: 999px;

  background:
    rgba(32, 219, 155, 0.07);

  color: #58e6b2;

  font-size: 0.66rem;
  font-weight: 800;

  letter-spacing: 0.07em;
}

.live-indicator span {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: #20db9b;

  box-shadow:
    0 0 9px #20db9b;
}


/*
|--------------------------------------------------------------------------
| Demo Mode
|--------------------------------------------------------------------------
*/

.demo-button,
.reset-demo-button {
  min-height: 39px;

  padding: 0 13px;

  border-radius: 9px;

  cursor: pointer;

  font-size: 0.67rem;
  font-weight: 800;

  white-space: nowrap;
}


/* Start Demo */

.demo-button {
  border:
    1px solid
    rgba(255, 200, 87, 0.32);

  background:
    rgba(255, 200, 87, 0.08);

  color: #ffc857;

  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.demo-button:hover:not(:disabled) {
  border-color:
    rgba(255, 200, 87, 0.5);

  background:
    rgba(255, 200, 87, 0.15);
}


/* Demo currently running */

.demo-button.active {
  border-color:
    rgba(255, 82, 103, 0.32);

  background:
    rgba(255, 82, 103, 0.09);

  color: #ff7182;

  cursor: default;
}


/* Reset Demo */

.reset-demo-button {
  border:
    1px solid #294353;

  background: #10232f;

  color: #8fa6b4;

  transition:
    color 0.2s ease,
    background 0.2s ease;
}

.reset-demo-button:hover {
  background: #142a37;

  color: #ffffff;
}


/*
|--------------------------------------------------------------------------
| Notification Button
|--------------------------------------------------------------------------
*/

.icon-button {
  position: relative;

  display: grid;

  width: 39px;
  height: 39px;

  flex-shrink: 0;

  place-items: center;

  border:
    1px solid #213747;

  border-radius: 9px;

  background: #0e1c26;

  cursor: pointer;
}

.icon-button:hover {
  border-color: #315166;

  background: #132632;
}


/*
|--------------------------------------------------------------------------
| Notification Badge
|--------------------------------------------------------------------------
*/

.notification-badge {
  position: absolute;

  top: -5px;
  right: -5px;

  display: grid;

  min-width: 18px;
  height: 18px;

  padding: 0 5px;

  place-items: center;

  border:
    2px solid #071019;

  border-radius: 999px;

  background: #ff5267;

  color: #ffffff;

  font-size: 0.56rem;
  font-weight: 900;

  line-height: 1;
}


/*
|--------------------------------------------------------------------------
| Register Asset
|--------------------------------------------------------------------------
*/

.primary-button {
  padding: 11px 15px;

  border: none;

  border-radius: 9px;

  background: #00addf;

  color: #00131c;

  cursor: pointer;

  font-size: 0.78rem;
  font-weight: 800;

  white-space: nowrap;

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.primary-button:hover {
  background: #25c6ed;
}

.primary-button:active {
  transform: translateY(1px);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(1, 9, 14, 0.78);
  backdrop-filter: blur(8px);
}

.asset-modal {
  width: min(100%, 760px);
  overflow: hidden;
  border: 1px solid #294555;
  border-radius: 16px;
  background: #0a1821;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-bottom: 1px solid #1b303e;
}

.modal-eyebrow {
  margin: 0 0 5px;
  color: #4a829d;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.modal-header h3 {
  margin: 0;
  color: #f4fbff;
  font-size: 1.15rem;
}

.modal-close {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #284354;
  border-radius: 8px;
  background: #10232f;
  color: #89a5b5;
  cursor: pointer;
  font-size: 1.25rem;
}

.asset-form {
  display: grid;
  gap: 17px;
  padding: 24px;
}

.asset-form label {
  display: grid;
  gap: 7px;
}

.asset-form label span {
  color: #8fa6b4;
  font-size: 0.7rem;
  font-weight: 700;
}

.asset-form input,
.asset-form select {
  width: 100%;
  min-height: 43px;
  padding: 10px 12px;
  border: 1px solid #294353;
  border-radius: 9px;
  outline: none;
  background: #0c1d27;
  color: #e9f4fb;
}

.asset-form input:focus,
.asset-form select:focus {
  border-color: #00addf;
  box-shadow: 0 0 0 3px rgba(0, 173, 223, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.form-row.three-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-error,
.form-note {
  margin: 0;
  font-size: 0.7rem;
}

.form-error {
  color: #ff7b8b;
}

.form-note {
  color: #6f8795;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button,
.save-button {
  min-height: 41px;
  padding: 0 16px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 800;
}

.cancel-button {
  border: 1px solid #294353;
  background: #10232f;
  color: #9ab0bc;
}

.save-button {
  border: 0;
  background: #00addf;
  color: #00131c;
}


/*
|--------------------------------------------------------------------------
| Responsive
|--------------------------------------------------------------------------
*/

@media (max-width: 1100px) {

  .live-indicator {
    display: none;
  }

}


@media (max-width: 820px) {

  .topbar {
    align-items: flex-start;

    padding-inline: 16px;
  }

  .live-indicator,
  .demo-button,
  .reset-demo-button,
  .primary-button {
    display: none;
  }

}

@media (max-width: 680px) {
  .modal-backdrop {
    padding: 12px;
  }

  .form-row,
  .form-row.three-columns {
    grid-template-columns: 1fr;
  }

  .asset-form,
  .modal-header {
    padding: 18px;
  }
}

</style>
