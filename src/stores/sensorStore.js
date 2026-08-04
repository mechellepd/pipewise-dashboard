import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { sensors as initialSensors } from '../data/sensors'
import { useNotificationStore } from './notificationStore'

export const useSensorStore = defineStore(
  'sensorStore',
  () => {
    const notificationStore = useNotificationStore()

    const sensors = ref(
      initialSensors.map((sensor) => ({
        ...sensor,
      })),
    )

    const isSimulationRunning = ref(false)

    let simulationTimer = null

    const normalSensorCount = computed(() => {
      return sensors.value.filter(
        (sensor) => sensor.status === 'normal',
      ).length
    })

    const warningSensorCount = computed(() => {
      return sensors.value.filter(
        (sensor) => sensor.status === 'warning',
      ).length
    })

    const criticalSensorCount = computed(() => {
      return sensors.value.filter(
        (sensor) => sensor.status === 'critical',
      ).length
    })

    const onlineSensorCount = computed(() => {
      return sensors.value.filter(
        (sensor) => sensor.connectionStatus !== 'offline',
      ).length
    })

    function getStatusFromPressure(pressure) {
      if (pressure < 25) {
        return 'critical'
      }

      if (pressure < 38) {
        return 'warning'
      }

      return 'normal'
    }

    function getSensorById(sensorId) {
      return sensors.value.find(
        (sensor) => sensor.id === sensorId,
      )
    }

    function getSensorsByPipeline(pipelineId) {
      return sensors.value.filter(
        (sensor) =>
          sensor.pipelineId === pipelineId,
      )
    }

    function updateSensor(sensorId, updates) {
      const sensor = getSensorById(sensorId)

      if (!sensor) {
        console.warn(
          `Sensor ${sensorId} was not found.`,
        )
        return
      }

      const previousStatus = sensor.status

      Object.assign(sensor, updates)

      if ('pressure' in updates) {
        sensor.status =
          getStatusFromPressure(sensor.pressure)
      }

      handleStatusTransition(
        sensor,
        previousStatus,
      )
    }

    function createStatusNotification(
      sensor,
      previousStatus,
    ) {
      if (sensor.status === 'critical') {
        notificationStore.addNotification({
          title: 'Critical pressure detected',
          message:
            `${sensor.id} has entered a critical state ` +
            `at ${sensor.pressure} PSI.`,
          assetId: sensor.pipelineId,
          sensorId: sensor.id,
          severity: 'critical',
          category: 'Leak detection',
        })

        return
      }

      if (sensor.status === 'warning') {
        notificationStore.addNotification({
          title: 'Pipeline pressure warning',
          message:
            `${sensor.id} has fallen below the normal ` +
            `pressure range at ${sensor.pressure} PSI.`,
          assetId: sensor.pipelineId,
          sensorId: sensor.id,
          severity: 'warning',
          category: 'Pressure monitoring',
        })

        return
      }

      if (
        sensor.status === 'normal' &&
        previousStatus !== 'normal'
      ) {
        notificationStore.addNotification({
          title: 'Sensor pressure recovered',
          message:
            `${sensor.id} has returned to its normal ` +
            `operating range at ${sensor.pressure} PSI.`,
          assetId: sensor.pipelineId,
          sensorId: sensor.id,
          severity: 'information',
          category: 'System recovery',
        })
      }
    }

    function handleStatusTransition(
      sensor,
      previousStatus,
    ) {
      if (sensor.status === previousStatus) {
        return
      }

      createStatusNotification(
        sensor,
        previousStatus,
      )
    }

    function generateReading(sensor) {
      const previousStatus = sensor.status

      const pressureChange =
        (Math.random() - 0.5) * 1.2

      const flowChange =
        (Math.random() - 0.5) * 20

      sensor.pressure = Number(
        Math.max(
          0,
          sensor.pressure + pressureChange,
        ).toFixed(1),
      )

      sensor.flowRate = Math.max(
        0,
        Math.round(
          sensor.flowRate + flowChange,
        ),
      )

      sensor.lastUpdated = 'Just now'

      sensor.status =
        getStatusFromPressure(sensor.pressure)

      handleStatusTransition(
        sensor,
        previousStatus,
      )
    }

    function startSimulation() {
      if (simulationTimer) {
        return
      }

      isSimulationRunning.value = true

      simulationTimer = window.setInterval(
        () => {
          sensors.value.forEach((sensor) => {
            generateReading(sensor)
          })
        },
        3000,
      )
    }

    function stopSimulation() {
      if (!simulationTimer) {
        return
      }

      window.clearInterval(simulationTimer)

      simulationTimer = null
      isSimulationRunning.value = false
    }

    function resetSensors() {
      sensors.value = initialSensors.map(
        (sensor) => ({
          ...sensor,
        }),
      )
    }

    return {
      sensors,
      isSimulationRunning,

      normalSensorCount,
      warningSensorCount,
      criticalSensorCount,
      onlineSensorCount,

      getSensorById,
      getSensorsByPipeline,
      updateSensor,
      startSimulation,
      stopSimulation,
      resetSensors,
    }
  },
)