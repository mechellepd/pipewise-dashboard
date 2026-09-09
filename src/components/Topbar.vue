<script setup>
import { ref } from 'vue'

import NotificationDrawer from './NotificationDrawer.vue'

import { useNotificationStore } from '../stores/notificationStore'
import { useSensorStore } from '../stores/sensorStore'

defineProps({
  activeMenu: {
    type: String,
    required: true,
  },
})

const emit = defineEmits([
  'register-asset',
])

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

function openRegisterAsset() {
  emit('register-asset')
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
        {{ activeMenu }}
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


  <!--
    IMPORTANT:

    If your existing Topbar.vue contains your
    Register Asset modal here, KEEP IT HERE.

    Do not delete the modal code we previously
    built.
  -->

</template>

<style scoped>

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

</style>