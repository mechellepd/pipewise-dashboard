import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'pipewise-alerts-v1'

const initialAlerts = [
  {
    id: 'ALT-001',
    title: 'Critical pressure drop',
    message: 'Pressure at sensor SN-023 has fallen below the critical threshold.',
    assetId: 'PL-023',
    sensorId: 'SN-023',
    severity: 'critical',
    category: 'Leak detection',
    status: 'active',
    time: '2 minutes ago',
    createdAt: 'Today, 09:42',
    isRead: false,
    assignedTo: 'Operations Control',
    timeline: [
      { time: '09:42', event: 'Critical alert generated automatically.' },
      { time: '09:43', event: 'Operations notification dispatched.' },
    ],
  },
  {
    id: 'ALT-002',
    title: 'Pipeline pressure warning',
    message: 'Berakas Supply Line is operating below its expected pressure range.',
    assetId: 'PL-041',
    sensorId: 'SN-041',
    severity: 'warning',
    category: 'Pressure monitoring',
    status: 'acknowledged',
    time: '14 minutes ago',
    createdAt: 'Today, 09:30',
    isRead: false,
    assignedTo: 'Network Operations',
    acknowledgedBy: 'Duty Operator',
    acknowledgedAt: 'Today, 09:34',
    timeline: [
      { time: '09:30', event: 'Pressure warning generated.' },
      { time: '09:34', event: 'Acknowledged by Duty Operator.' },
    ],
  },
  {
    id: 'ALT-003',
    title: 'Sensor signal intermittent',
    message: 'Sensor SN-018 has reported intermittent connectivity.',
    assetId: 'PL-018',
    sensorId: 'SN-018',
    severity: 'warning',
    category: 'Sensor network',
    status: 'active',
    time: '31 minutes ago',
    createdAt: 'Today, 09:13',
    isRead: false,
    assignedTo: 'Instrumentation Team',
    timeline: [
      { time: '09:13', event: 'Connectivity alert generated.' },
    ],
  },
  {
    id: 'ALT-004',
    title: 'Jerudong inspection completed',
    message: 'Scheduled inspection of Jerudong Connector was completed with no defects found.',
    assetId: 'PL-065',
    sensorId: null,
    severity: 'information',
    category: 'Maintenance',
    status: 'resolved',
    time: 'Yesterday',
    createdAt: 'Yesterday, 15:10',
    isRead: true,
    assignedTo: 'Maintenance Team',
    resolvedBy: 'Maintenance Supervisor',
    resolvedAt: 'Yesterday, 16:05',
    resolutionNote: 'Inspection completed. No corrective work required.',
    timeline: [
      { time: '15:10', event: 'Inspection reminder generated.' },
      { time: '16:05', event: 'Resolved by Maintenance Supervisor.' },
    ],
  },
]

function cloneAlert(alert) {
  return {
    ...alert,
    timeline: (alert.timeline ?? []).map((entry) => ({ ...entry })),
  }
}

function loadAlerts() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved.map(cloneAlert) : initialAlerts.map(cloneAlert)
  } catch {
    return initialAlerts.map(cloneAlert)
  }
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref(loadAlerts())

  const unreadCount = computed(() =>
    notifications.value.filter((notification) => !notification.isRead).length,
  )

  const unreadNotifications = computed(() =>
    notifications.value.filter((notification) => !notification.isRead),
  )

  const activeCount = computed(() =>
    notifications.value.filter((alert) => alert.status !== 'resolved').length,
  )

  const criticalActiveCount = computed(() =>
    notifications.value.filter(
      (alert) => alert.status !== 'resolved' && alert.severity === 'critical',
    ).length,
  )

  const acknowledgedCount = computed(() =>
    notifications.value.filter((alert) => alert.status === 'acknowledged').length,
  )

  const resolvedCount = computed(() =>
    notifications.value.filter((alert) => alert.status === 'resolved').length,
  )

  function getPipelineIncidentStatus(assetId) {
    const openAlerts = notifications.value.filter(
      (alert) => alert.assetId === assetId && alert.status !== 'resolved',
    )

    if (openAlerts.length === 0) {
      return null
    }

    if (
      openAlerts.some(
        (alert) => alert.status === 'active' && alert.severity === 'critical',
      )
    ) {
      return 'critical'
    }

    return 'warning'
  }

  function persistAlerts() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.value))
  }

  function nowLabel() {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
  }

  function addNotification(notification) {
    const alert = cloneAlert({
      id: `ALT-${Date.now()}`,
      time: 'Just now',
      createdAt: `Today, ${nowLabel()}`,
      status: 'active',
      isRead: false,
      assignedTo: 'Operations Control',
      timeline: [
        { time: nowLabel(), event: 'Alert generated automatically.' },
      ],
      ...notification,
    })

    notifications.value.unshift(alert)
    persistAlerts()
    return alert
  }

  function upsertSensorAlert(notification) {
    const existing = notifications.value.find(
      (alert) =>
        alert.sensorId === notification.sensorId &&
        alert.category === notification.category &&
        alert.status !== 'resolved',
    )

    if (!existing) {
      return addNotification(notification)
    }

    const severityChanged = existing.severity !== notification.severity
    Object.assign(existing, notification, {
      time: 'Just now',
      isRead: false,
    })

    if (severityChanged) {
      existing.timeline.push({
        time: nowLabel(),
        event: `Severity escalated to ${notification.severity}.`,
      })
    }

    persistAlerts()
    return existing
  }

  function markAsRead(notificationId) {
    const notification = notifications.value.find((item) => item.id === notificationId)
    if (notification) {
      notification.isRead = true
      persistAlerts()
    }
  }

  function markAllAsRead() {
    notifications.value.forEach((notification) => {
      notification.isRead = true
    })
    persistAlerts()
  }

  function acknowledgeAlert(alertId, operator = 'Duty Operator') {
    const alert = notifications.value.find((item) => item.id === alertId)
    if (!alert || alert.status === 'resolved') return null

    alert.status = 'acknowledged'
    alert.isRead = true
    alert.acknowledgedBy = operator
    alert.acknowledgedAt = `Today, ${nowLabel()}`
    alert.timeline.push({ time: nowLabel(), event: `Acknowledged by ${operator}.` })
    persistAlerts()
    return alert
  }

  function resolveAlert(alertId, note = '', operator = 'Duty Operator') {
    const alert = notifications.value.find((item) => item.id === alertId)
    if (!alert) return null

    alert.status = 'resolved'
    alert.isRead = true
    alert.resolvedBy = operator
    alert.resolvedAt = `Today, ${nowLabel()}`
    alert.resolutionNote = note.trim() || 'Condition reviewed and returned to normal.'
    alert.timeline.push({ time: nowLabel(), event: `Resolved by ${operator}.` })
    persistAlerts()
    return alert
  }

  function reopenAlert(alertId) {
    const alert = notifications.value.find((item) => item.id === alertId)
    if (!alert) return null

    alert.status = 'active'
    alert.isRead = false
    alert.timeline.push({ time: nowLabel(), event: 'Alert reopened for further investigation.' })
    delete alert.resolvedBy
    delete alert.resolvedAt
    delete alert.resolutionNote
    persistAlerts()
    return alert
  }

  function resolveSensorAlert(sensorId, note) {
    const alert = notifications.value.find(
      (item) => item.sensorId === sensorId && item.status !== 'resolved',
    )
    return alert ? resolveAlert(alert.id, note, 'PIPEWISE Demo') : null
  }

  function removeNotification(notificationId) {
    notifications.value = notifications.value.filter(
      (notification) => notification.id !== notificationId,
    )
    persistAlerts()
  }

  return {
    notifications,
    unreadCount,
    unreadNotifications,
    activeCount,
    criticalActiveCount,
    acknowledgedCount,
    resolvedCount,
    getPipelineIncidentStatus,
    addNotification,
    upsertSensorAlert,
    markAsRead,
    markAllAsRead,
    acknowledgeAlert,
    resolveAlert,
    reopenAlert,
    resolveSensorAlert,
    removeNotification,
  }
})
