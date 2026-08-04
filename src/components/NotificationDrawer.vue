<script setup>
import { useRouter } from 'vue-router'

import { useNotificationStore } from '../stores/notificationStore'

defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close'])

const router = useRouter()
const notificationStore = useNotificationStore()

function closeDrawer() {
  emit('close')
}

function openNotification(notification) {
  notificationStore.markAsRead(notification.id)

  if (!notification.assetId) {
    return
  }

  closeDrawer()

  router.push({
    name: 'network-map',
    query: {
      pipeline: notification.assetId,
    },
  })
}

function severitySymbol(severity) {
  const symbols = {
    critical: '!',
    warning: '▲',
    information: 'i',
  }

  return symbols[severity] ?? '•'
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="drawer-backdrop"
      @click.self="closeDrawer"
    >
      <aside
        class="notification-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-drawer-title"
      >
        <header class="drawer-header">
          <div>
            <p class="drawer-eyebrow">
              OPERATIONS CENTRE
            </p>

            <h3 id="notification-drawer-title">
              Notifications
            </h3>

            <p>
              {{ notificationStore.unreadCount }}
              unread notification<span
                v-if="notificationStore.unreadCount !== 1"
              >s</span>
            </p>
          </div>

          <button
            class="close-button"
            type="button"
            aria-label="Close notifications"
            @click="closeDrawer"
          >
            ×
          </button>
        </header>

        <div class="drawer-toolbar">
          <span>
            {{ notificationStore.notifications.length }}
            total notifications
          </span>

          <button
            type="button"
            :disabled="notificationStore.unreadCount === 0"
            @click="notificationStore.markAllAsRead"
          >
            Mark all as read
          </button>
        </div>

        <div class="notification-list">
          <article
            v-for="notification in notificationStore.notifications"
            :key="notification.id"
            class="notification-item"
            :class="[
              notification.severity,
              { unread: !notification.isRead },
            ]"
          >
            <button
              class="notification-main"
              type="button"
              @click="openNotification(notification)"
            >
              <span
                class="notification-symbol"
                :class="notification.severity"
              >
                {{ severitySymbol(notification.severity) }}
              </span>

              <span class="notification-content">
                <span class="notification-title-row">
                  <strong>{{ notification.title }}</strong>

                  <i
                    v-if="!notification.isRead"
                    class="unread-dot"
                    aria-label="Unread"
                  ></i>
                </span>

                <span class="notification-message">
                  {{ notification.message }}
                </span>

                <span class="notification-meta">
                  <span>{{ notification.category }}</span>

                  <span v-if="notification.assetId">
                    {{ notification.assetId }}
                  </span>

                  <span>{{ notification.time }}</span>
                </span>
              </span>
            </button>

            <button
              class="remove-button"
              type="button"
              aria-label="Remove notification"
              @click="
                notificationStore.removeNotification(
                  notification.id,
                )
              "
            >
              ×
            </button>
          </article>

          <div
            v-if="notificationStore.notifications.length === 0"
            class="empty-state"
          >
            <span>✓</span>
            <strong>No notifications</strong>
            <p>The pipeline network currently has no notifications.</p>
          </div>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(1, 9, 14, 0.58);
  backdrop-filter: blur(4px);
}

.notification-drawer {
  position: absolute;
  top: 0;
  right: 0;
  width: min(100%, 430px);
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid #294555;
  background:
    radial-gradient(
      circle at top right,
      rgba(0, 194, 255, 0.08),
      transparent 20rem
    ),
    #091821;
  box-shadow: -24px 0 60px rgba(0, 0, 0, 0.45);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px;
  border-bottom: 1px solid #1b303e;
}

.drawer-eyebrow {
  margin: 0 0 5px;
  color: #4a829d;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.drawer-header h3 {
  margin: 0;
  color: #f4fbff;
  font-size: 1.15rem;
}

.drawer-header p:not(.drawer-eyebrow) {
  margin: 6px 0 0;
  color: #698191;
  font-size: 0.68rem;
}

.close-button {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid #284354;
  border-radius: 8px;
  background: #10232f;
  color: #89a5b5;
  font-size: 1.25rem;
}

.drawer-toolbar {
  display: flex;
  min-height: 53px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px;
  border-bottom: 1px solid #1b303e;
}

.drawer-toolbar span {
  color: #607887;
  font-size: 0.65rem;
}

.drawer-toolbar button {
  border: 0;
  background: transparent;
  color: #61d8f5;
  font-size: 0.65rem;
  font-weight: 800;
}

.drawer-toolbar button:disabled {
  color: #435d6c;
  cursor: not-allowed;
}

.notification-list {
  padding: 8px 14px 20px;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: stretch;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid #19303d;
  border-radius: 11px;
  background: rgba(12, 29, 39, 0.82);
}

.notification-item.unread {
  background: rgba(15, 36, 47, 0.98);
}

.notification-item.critical.unread {
  border-color: rgba(255, 82, 103, 0.35);
}

.notification-item.warning.unread {
  border-color: rgba(255, 200, 87, 0.28);
}

.notification-main {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 12px;
  padding: 15px 12px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}

.notification-symbol {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 9px;
  font-style: normal;
  font-weight: 900;
}

.notification-symbol.critical {
  background: rgba(255, 82, 103, 0.13);
  color: #ff7182;
}

.notification-symbol.warning {
  background: rgba(255, 200, 87, 0.12);
  color: #ffc857;
}

.notification-symbol.information {
  background: rgba(0, 194, 255, 0.12);
  color: #61dffb;
}

.notification-content {
  display: block;
  min-width: 0;
  flex: 1;
}

.notification-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.notification-title-row strong {
  overflow: hidden;
  color: #e9f4fb;
  font-size: 0.73rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #00c2ff;
  box-shadow: 0 0 9px rgba(0, 194, 255, 0.8);
}

.notification-message {
  display: -webkit-box;
  margin-top: 6px;
  overflow: hidden;
  color: #77909f;
  font-size: 0.66rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.notification-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 8px;
  color: #506b7b;
  font-size: 0.59rem;
}

.remove-button {
  width: 34px;
  flex-shrink: 0;
  border: 0;
  border-left: 1px solid #19303d;
  background: transparent;
  color: #516d7c;
}

.remove-button:hover {
  background: rgba(255, 82, 103, 0.08);
  color: #ff7182;
}

.empty-state {
  display: grid;
  min-height: 340px;
  place-items: center;
  align-content: center;
  padding: 30px;
  text-align: center;
}

.empty-state span {
  display: grid;
  width: 48px;
  height: 48px;
  margin-bottom: 14px;
  place-items: center;
  border-radius: 50%;
  background: rgba(32, 219, 155, 0.1);
  color: #4ce4af;
  font-size: 1.2rem;
}

.empty-state strong {
  color: #dff7ff;
  font-size: 0.8rem;
}

.empty-state p {
  max-width: 250px;
  margin: 8px 0 0;
  color: #607887;
  font-size: 0.67rem;
  line-height: 1.5;
}

@media (max-width: 580px) {
  .notification-drawer {
    width: 100%;
  }
}
</style>