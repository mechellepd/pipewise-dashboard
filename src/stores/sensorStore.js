import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { sensors as initialSensors } from '../data/sensors'
import { useAssetStore } from './assetStore'
import { useNotificationStore } from './notificationStore'

const STORAGE_KEY = 'pipewise-sensors-v1'

function normalizeSensor(sensor) {
  return {
    manufacturer: 'PIPEWISE Technologies',
    model: 'PW Industrial',
    serialNumber: sensor.id,
    communication: 'LoRaWAN',
    reportingFrequency: 5,
    installationDate: '2026-01-15',
    calibrationDate: '2026-01-15',
    connectionStatus: 'online',
    commissioningStatus: 'commissioned',
    distanceKm: 0,
    ...sensor,
    thresholds: {
      warningBelow: 38,
      criticalBelow: 25,
      ...(sensor.thresholds ?? {}),
    },
    position: [...sensor.position],
  }
}

function loadSensors() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved)
      ? saved.map(normalizeSensor)
      : initialSensors.map(normalizeSensor)
  } catch {
    return initialSensors.map(normalizeSensor)
  }
}

export const useSensorStore = defineStore(
  'sensorStore',
  () => {
    const notificationStore = useNotificationStore()
    const assetStore = useAssetStore()

    const sensors = ref(loadSensors())

    const isSimulationRunning = ref(false)

    const isDemoRunning = ref(false)

    const demoStage = ref('idle')

    let simulationTimer = null
    let demoTimer = null

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

    function persistSensors() {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sensors.value))
    }

    function getStatusFromPressure(pressure, sensor = null) {
      const criticalThreshold = sensor?.thresholds?.criticalBelow ?? 25
      const warningThreshold = sensor?.thresholds?.warningBelow ?? 38

      if (pressure < criticalThreshold) {
        return 'critical'
      }

      if (pressure < warningThreshold) {
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

    function updateSensor(sensorId, updates, shouldPersist = false) {
      const sensor = getSensorById(sensorId)

      if (!sensor) {
        console.warn(
          `Sensor ${sensorId} was not found.`,
        )

        return
      }

      Object.assign(sensor, updates)

      if ('pressure' in updates) {
        sensor.status =
          getStatusFromPressure(sensor.pressure, sensor)
      }

      if (shouldPersist) {
        persistSensors()
      }
    }

    function sensorIdExists(sensorId, excludedId = '') {
      const normalizedId = sensorId.trim().toUpperCase()
      const normalizedExcludedId = excludedId.trim().toUpperCase()

      return sensors.value.some(
        (sensor) =>
          sensor.id.toUpperCase() === normalizedId &&
          sensor.id.toUpperCase() !== normalizedExcludedId,
      )
    }

    function registerSensor(sensor) {
      const registeredSensor = normalizeSensor({
        ...sensor,
        id: sensor.id.trim().toUpperCase(),
        serialNumber: sensor.serialNumber?.trim() || sensor.id.trim().toUpperCase(),
        status: getStatusFromPressure(Number(sensor.pressure), sensor),
        lastUpdated: 'Just now',
      })

      sensors.value.push(registeredSensor)
      persistSensors()
      return registeredSensor
    }

    function updateSensorDetails(currentId, updates) {
      const index = sensors.value.findIndex((sensor) => sensor.id === currentId)
      if (index === -1) return null

      const updatedSensor = normalizeSensor({
        ...sensors.value[index],
        ...updates,
        thresholds: {
          ...sensors.value[index].thresholds,
          ...(updates.thresholds ?? {}),
        },
        id: updates.id.trim().toUpperCase(),
      })
      updatedSensor.status = getStatusFromPressure(updatedSensor.pressure, updatedSensor)
      sensors.value[index] = updatedSensor
      persistSensors()
      return updatedSensor
    }

    function deleteSensor(sensorId) {
      const index = sensors.value.findIndex((sensor) => sensor.id === sensorId)
      if (index === -1) return false
      sensors.value.splice(index, 1)
      persistSensors()
      return true
    }

    async function testSensorConnection(sensorId) {
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      const sensor = getSensorById(sensorId)
      if (!sensor) return false

      sensor.connectionStatus = 'online'
      sensor.lastConnectionTest = 'Just now'
      if (sensor.commissioningStatus === 'offline') {
        sensor.commissioningStatus = 'commissioned'
      }
      persistSensors()
      return true
    }

    function setCommissioningStatus(sensorId, status) {
      const sensor = getSensorById(sensorId)
      if (!sensor) return null
      sensor.commissioningStatus = status
      sensor.connectionStatus = status === 'offline' ? 'offline' : sensor.connectionStatus
      persistSensors()
      return sensor
    }

    function generateReading(sensor) {
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
        getStatusFromPressure(sensor.pressure, sensor)
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

    function stopDemoTimer() {
      if (!demoTimer) {
        return
      }

      window.clearInterval(demoTimer)

      demoTimer = null
    }

    function startLeakDemo() {
      if (isDemoRunning.value) {
        return
      }

      const demoSensor =
        getSensorById('SN-023')

      if (!demoSensor) {
        console.warn(
          'Demo sensor SN-023 was not found.',
        )

        return
      }

      stopSimulation()
      stopDemoTimer()

      notificationStore.resolveSensorAlert(
        'SN-023',
        'Previous condition cleared before starting a new leak demonstration.',
      )

      isDemoRunning.value = true
      demoStage.value = 'normal'

      updateSensor('SN-023', {
        pressure: 46,
        flowRate: 1180,
        lastUpdated: 'Just now',
      })

      let step = 0

      const demoReadings = [
        {
          pressure: 45,
          flowRate: 1168,
          stage: 'normal',
        },
        {
          pressure: 42,
          flowRate: 1145,
          stage: 'normal',
        },
        {
          pressure: 39,
          flowRate: 1108,
          stage: 'declining',
        },
        {
          pressure: 36,
          flowRate: 1065,
          stage: 'warning',
        },
        {
          pressure: 33,
          flowRate: 1010,
          stage: 'warning',
        },
        {
          pressure: 29,
          flowRate: 950,
          stage: 'warning',
        },
        {
          pressure: 24,
          flowRate: 885,
          stage: 'critical',
        },
        {
          pressure: 21,
          flowRate: 832,
          stage: 'critical',
        },
      ]

      demoTimer = window.setInterval(
        () => {
          if (
            step >= demoReadings.length
          ) {
            stopDemoTimer()

            demoStage.value = 'complete'

            isDemoRunning.value = false

            return
          }

          const reading =
            demoReadings[step]

            demoStage.value =
            reading.stage

          updateSensor('SN-023', {
            pressure: reading.pressure,
            flowRate: reading.flowRate,
            lastUpdated: 'Just now',
          })

          if (['warning', 'critical'].includes(reading.stage)) {
            notificationStore.upsertSensorAlert({
              title:
                reading.stage === 'critical'
                  ? 'Critical pressure drop'
                  : 'Pipeline pressure warning',
              message:
                `Sensor SN-023 is reporting ${reading.pressure} PSI ` +
                `and a flow rate of ${reading.flowRate} L/min.`,
              assetId: 'PL-023',
              sensorId: 'SN-023',
              severity: reading.stage,
              category: 'Leak detection',
              assignedTo: 'Operations Control',
            })
          }

          step += 1
        },
        3500,
      )
    }

    function resetLeakDemo() {
      stopDemoTimer()

      isDemoRunning.value = false

      demoStage.value = 'idle'

      updateSensor('SN-023', {
        pressure: 46.2,
        flowRate: 1194,
        lastUpdated: 'Just now',
      }, true)

      notificationStore.resolveSensorAlert(
        'SN-023',
        'Demo reset completed and sensor pressure returned to normal.',
      )

      assetStore.setAssetStatus('PL-023', 'normal')

      startSimulation()
    }

    function resetSensors() {
      sensors.value = initialSensors.map(normalizeSensor)
      persistSensors()
    }

    return {
      sensors,

      isSimulationRunning,

      isDemoRunning,
      demoStage,

      normalSensorCount,
      warningSensorCount,
      criticalSensorCount,
      onlineSensorCount,

      getSensorById,
      getSensorsByPipeline,
      sensorIdExists,

      updateSensor,
      registerSensor,
      updateSensorDetails,
      deleteSensor,
      testSensorConnection,
      setCommissioningStatus,

      startSimulation,
      stopSimulation,

      startLeakDemo,
      resetLeakDemo,

      resetSensors,
    }
  },
)
