import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { sensors as initialSensors } from '../data/sensors'

export const useSensorStore = defineStore(
  'sensorStore',
  () => {
    const sensors = ref(
      initialSensors.map((sensor) => ({
        ...sensor,
      })),
    )

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

      Object.assign(sensor, updates)

      if ('pressure' in updates) {
        sensor.status =
          getStatusFromPressure(sensor.pressure)
      }
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
        getStatusFromPressure(sensor.pressure)
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
      })

      startSimulation()
    }

    function resetSensors() {
      sensors.value =
        initialSensors.map(
          (sensor) => ({
            ...sensor,
          }),
        )
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

      updateSensor,

      startSimulation,
      stopSimulation,

      startLeakDemo,
      resetLeakDemo,

      resetSensors,
    }
  },
)