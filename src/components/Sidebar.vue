<script setup>
import pipewiseLogo from '../assets/pipewise-logo.png'

defineProps({
  activeMenu: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['change-menu'])

const menuItems = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Network Map', icon: '⌖' },
  { name: 'Pipeline Assets', icon: '⌁' },
  { name: 'Sensor Network', icon: '◉' },
  { name: 'Alerts', icon: '!' },
  { name: 'Maintenance', icon: '⚙' },
  { name: 'Analytics', icon: '↗' },
]

function selectMenu(menuName) {
  emit('change-menu', menuName)
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <img
        :src="pipewiseLogo"
        alt="PIPEWISE logo"
        class="brand-logo"
      />
    </div>

    <nav class="navigation">
      <p class="navigation-label">
        MONITORING
      </p>

      <button
        v-for="item in menuItems"
        :key="item.name"
        type="button"
        class="navigation-item"
        :class="{ active: activeMenu === item.name }"
        @click="selectMenu(item.name)"
      >
        <span class="navigation-icon">
          {{ item.icon }}
        </span>

        <span class="navigation-text">
          {{ item.name }}
        </span>

        <span
          v-if="item.name === 'Alerts'"
          class="notification-count"
        >
          3
        </span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="connection-status">
        <span class="connection-dot"></span>

        <div>
          <strong>System connected</strong>
          <small>Last sync: Just now</small>
        </div>
      </div>

      <div class="user-profile">
        <div class="user-avatar">
          MO
        </div>

        <div>
          <strong>Muazz Osman</strong>
          <small>System Administrator</small>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  display: flex;
  width: 252px;
  height: 100vh;
  flex-direction: column;
  border-right: 1px solid #1b2d3a;
  background: rgba(7, 16, 25, 0.98);
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  padding: 18px 16px;
  border-bottom: 1px solid #1b2d3a;
}

.brand-logo {
  display: block;
  width: 100%;
  max-width: 205px;
  height: auto;
  object-fit: contain;
}

.navigation {
  flex: 1;
  padding: 24px 14px;
  overflow-y: auto;
}

.navigation-label {
  margin: 0 10px 10px;
  color: #536b7c;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.navigation-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
  padding: 12px 13px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #87a0b0;
  text-align: left;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.navigation-item:hover {
  border-color: #1f3746;
  background: #0d1b25;
  color: #dff7ff;
}

.navigation-item.active {
  border-color: rgba(0, 194, 255, 0.22);
  background:
    linear-gradient(
      90deg,
      rgba(0, 194, 255, 0.17),
      rgba(0, 194, 255, 0.04)
    );
  color: #61e4ff;
}

.navigation-icon {
  display: grid;
  width: 23px;
  flex-shrink: 0;
  place-items: center;
  font-size: 1rem;
}

.navigation-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-count {
  display: grid;
  width: 22px;
  height: 22px;
  margin-left: auto;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  background: #ff5267;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #1b2d3a;
}

.connection-status,
.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.connection-status {
  margin-bottom: 16px;
  padding: 11px;
  border: 1px solid #1b2d3a;
  border-radius: 10px;
  background: #0a1720;
}

.connection-dot {
  width: 9px;
  height: 9px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #20db9b;
  box-shadow: 0 0 13px #20db9b;
}

.connection-status strong,
.user-profile strong {
  display: block;
  color: #e9f4fb;
  font-size: 0.74rem;
}

.connection-status small,
.user-profile small {
  display: block;
  margin-top: 3px;
  color: #698191;
  font-size: 0.65rem;
}

.user-avatar {
  display: grid;
  width: 35px;
  height: 35px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9px;
  background: #163245;
  color: #6ce6ff;
  font-size: 0.72rem;
  font-weight: 800;
}

@media (max-width: 820px) {
  .sidebar {
    position: static;
    width: 82px;
    min-height: 100vh;
  }

  .brand {
    min-height: 86px;
    padding-inline: 10px;
  }

  .brand-logo {
    max-width: 58px;
  }

  .navigation-label,
  .navigation-text,
  .notification-count,
  .sidebar-footer {
    display: none;
  }

  .navigation-item {
    justify-content: center;
    padding-inline: 10px;
  }
}
</style>