import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore(
  'notifications',
  () => {
    const notifications = ref([
      {
        id: 'NTF-001',
        title: 'Critical pressure drop',
        message:
          'Pressure at sensor SN-023 has fallen below the critical threshold.',
        assetId: 'PL-023',
        sensorId: 'SN-023',
        severity: 'critical',
        category: 'Leak detection',
        time: '2 minutes ago',
        isRead: false,
      },
      {
        id: 'NTF-002',
        title: 'Pipeline pressure warning',
        message:
          'Berakas Supply Line is operating below its expected pressure range.',
        assetId: 'PL-041',
        sensorId: 'SN-041',
        severity: 'warning',
        category: 'Pressure monitoring',
        time: '14 minutes ago',
        isRead: false,
      },
      {
        id: 'NTF-003',
        title: 'Sensor signal intermittent',
        message:
          'Sensor SN-018 has reported intermittent connectivity.',
        assetId: 'PL-018',
        sensorId: 'SN-018',
        severity: 'warning',
        category: 'Sensor network',
        time: '31 minutes ago',
        isRead: false,
      },
      {
        id: 'NTF-004',
        title: 'Maintenance reminder',
        message:
          'Jerudong Connector is scheduled for inspection tomorrow.',
        assetId: 'PL-065',
        sensorId: null,
        severity: 'information',
        category: 'Maintenance',
        time: '1 hour ago',
        isRead: true,
      },
    ])

    const unreadCount = computed(() => {
      return notifications.value.filter(
        (notification) => !notification.isRead,
      ).length
    })

    const unreadNotifications = computed(() => {
      return notifications.value.filter(
        (notification) => !notification.isRead,
      )
    })

    function addNotification(notification) {
      notifications.value.unshift({
        id: `NTF-${Date.now()}`,
        time: 'Just now',
        isRead: false,
        ...notification,
      })
    }

    function markAsRead(notificationId) {
      const notification = notifications.value.find(
        (item) => item.id === notificationId,
      )

      if (notification) {
        notification.isRead = true
      }
    }

    function markAllAsRead() {
      notifications.value.forEach((notification) => {
        notification.isRead = true
      })
    }

    function removeNotification(notificationId) {
      notifications.value =
        notifications.value.filter(
          (notification) =>
            notification.id !== notificationId,
        )
    }

    return {
      notifications,
      unreadCount,
      unreadNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
    }
  },
)