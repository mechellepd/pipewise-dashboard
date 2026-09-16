<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import L from 'leaflet'

import { useAssetStore } from '../stores/assetStore'
import { useSensorStore } from '../stores/sensorStore'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  pipelineId: { type: String, default: '' },
  sensor: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])
const assetStore = useAssetStore()
const sensorStore = useSensorStore()

const mapContainer = ref(null)
const formError = ref('')
const connectionState = ref('untested')
const isTestingConnection = ref(false)
const selectedPosition = ref(null)
const distanceKm = ref(0)

let placementMap = null
let pipelineLine = null
let sensorMarker = null

const form = reactive({
  id: '',
  pipelineId: '',
  type: 'Pressure sensor',
  manufacturer: '',
  model: '',
  serialNumber: '',
  communication: 'LoRaWAN',
  reportingFrequency: 5,
  installationDate: new Date().toISOString().slice(0, 10),
  calibrationDate: new Date().toISOString().slice(0, 10),
  warningBelow: 38,
  criticalBelow: 25,
  pressure: 45,
  flowRate: 1100,
  batteryLevel: 100,
})

const isEditing = computed(() => Boolean(props.sensor))
const selectedPipeline = computed(() =>
  assetStore.pipelines.find((pipeline) => pipeline.id === form.pipelineId) ?? null,
)

function toRadians(value) {
  return (value * Math.PI) / 180
}

function distanceBetween(first, second) {
  const radius = 6371
  const latitudeDelta = toRadians(second[0] - first[0])
  const longitudeDelta = toRadians(second[1] - first[1])
  const firstLatitude = toRadians(first[0])
  const secondLatitude = toRadians(second[0])
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) *
    Math.sin(longitudeDelta / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function closestPointOnSegment(point, start, end) {
  const x = point[1]
  const y = point[0]
  const startX = start[1]
  const startY = start[0]
  const deltaX = end[1] - startX
  const deltaY = end[0] - startY
  const lengthSquared = deltaX ** 2 + deltaY ** 2
  const ratio = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - startX) * deltaX + (y - startY) * deltaY) / lengthSquared))

  return [startY + ratio * deltaY, startX + ratio * deltaX]
}

function snapToPipeline(position) {
  const coordinates = selectedPipeline.value?.coordinates ?? []
  let nearest = coordinates[0] ?? position
  let nearestDistance = Number.POSITIVE_INFINITY
  let travelledDistance = 0
  let nearestChainage = 0

  for (let index = 1; index < coordinates.length; index += 1) {
    const candidate = closestPointOnSegment(position, coordinates[index - 1], coordinates[index])
    const candidateDistance = distanceBetween(position, candidate)
    const segmentStartDistance = travelledDistance

    if (candidateDistance < nearestDistance) {
      nearest = candidate
      nearestDistance = candidateDistance
      nearestChainage = segmentStartDistance + distanceBetween(coordinates[index - 1], candidate)
    }

    travelledDistance += distanceBetween(coordinates[index - 1], coordinates[index])
  }

  return { position: nearest, distanceKm: Number(nearestChainage.toFixed(2)) }
}

function updateMarker(position, shouldPan = false) {
  if (!placementMap || !selectedPipeline.value) return
  const snapped = snapToPipeline(position)
  selectedPosition.value = snapped.position
  distanceKm.value = snapped.distanceKm

  if (!sensorMarker) {
    sensorMarker = L.marker(snapped.position, { draggable: true }).addTo(placementMap)
    sensorMarker.on('dragend', (event) => {
      const location = event.target.getLatLng()
      updateMarker([location.lat, location.lng])
    })
  } else {
    sensorMarker.setLatLng(snapped.position)
  }

  if (shouldPan) placementMap.panTo(snapped.position)
}

function drawSelectedPipeline() {
  if (!placementMap) return
  pipelineLine?.remove()
  pipelineLine = null
  sensorMarker?.remove()
  sensorMarker = null

  if (!selectedPipeline.value) return
  pipelineLine = L.polyline(selectedPipeline.value.coordinates, {
    color: '#00addf', weight: 6, opacity: 0.9,
  }).addTo(placementMap)
  placementMap.fitBounds(selectedPipeline.value.coordinates, { padding: [30, 30] })

  if (selectedPosition.value) updateMarker(selectedPosition.value)
}

function initialiseMap() {
  if (!mapContainer.value || placementMap) return
  placementMap = L.map(mapContainer.value, { center: [4.915, 114.945], zoom: 13 })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(placementMap)
  placementMap.on('click', (event) => {
    if (selectedPipeline.value) updateMarker([event.latlng.lat, event.latlng.lng])
  })
  drawSelectedPipeline()
}

function destroyMap() {
  placementMap?.remove()
  placementMap = null
  pipelineLine = null
  sensorMarker = null
}

function resetForm() {
  Object.assign(form, {
    id: '', pipelineId: props.pipelineId || '', type: 'Pressure sensor',
    manufacturer: '', model: '', serialNumber: '', communication: 'LoRaWAN',
    reportingFrequency: 5, installationDate: new Date().toISOString().slice(0, 10),
    calibrationDate: new Date().toISOString().slice(0, 10), warningBelow: 38,
    criticalBelow: 25, pressure: 45, flowRate: 1100, batteryLevel: 100,
  })
  selectedPosition.value = null
  distanceKm.value = 0
  connectionState.value = 'untested'
  formError.value = ''
}

function populateFromSensor(sensor) {
  Object.assign(form, {
    id: sensor.id, pipelineId: sensor.pipelineId, type: sensor.type,
    manufacturer: sensor.manufacturer, model: sensor.model,
    serialNumber: sensor.serialNumber, communication: sensor.communication,
    reportingFrequency: sensor.reportingFrequency,
    installationDate: sensor.installationDate,
    calibrationDate: sensor.calibrationDate,
    warningBelow: sensor.thresholds.warningBelow,
    criticalBelow: sensor.thresholds.criticalBelow,
    pressure: sensor.pressure, flowRate: sensor.flowRate,
    batteryLevel: sensor.batteryLevel,
  })
  selectedPosition.value = [...sensor.position]
  distanceKm.value = sensor.distanceKm ?? 0
  connectionState.value = sensor.connectionStatus === 'online' ? 'success' : 'untested'
}

async function runConnectionTest() {
  formError.value = ''
  if (!form.id.trim() || !form.serialNumber.trim()) {
    formError.value = 'Enter the Sensor ID and serial number before testing connectivity.'
    return
  }
  isTestingConnection.value = true
  connectionState.value = 'testing'
  await new Promise((resolve) => window.setTimeout(resolve, 900))
  connectionState.value = 'success'
  isTestingConnection.value = false
}

function sensorPayload(commissioningStatus) {
  return {
    id: form.id,
    pipelineId: form.pipelineId,
    type: form.type,
    manufacturer: form.manufacturer,
    model: form.model,
    serialNumber: form.serialNumber,
    communication: form.communication,
    reportingFrequency: Number(form.reportingFrequency),
    installationDate: form.installationDate,
    calibrationDate: form.calibrationDate,
    thresholds: {
      warningBelow: Number(form.warningBelow),
      criticalBelow: Number(form.criticalBelow),
    },
    pressure: Number(form.pressure),
    flowRate: Number(form.flowRate),
    batteryLevel: Number(form.batteryLevel),
    position: selectedPosition.value,
    distanceKm: distanceKm.value,
    commissioningStatus,
    connectionStatus: commissioningStatus === 'commissioned' ? 'online' : 'offline',
  }
}

function saveSensor(commissioningStatus) {
  formError.value = ''
  if (sensorStore.sensorIdExists(form.id, props.sensor?.id ?? '')) {
    formError.value = 'That Sensor ID is already registered.'
    return
  }
  if (!selectedPipeline.value || !selectedPosition.value) {
    formError.value = 'Select a pipeline and place the sensor on its route.'
    return
  }
  if (Number(form.criticalBelow) >= Number(form.warningBelow)) {
    formError.value = 'The critical threshold must be lower than the warning threshold.'
    return
  }
  if (commissioningStatus === 'commissioned' && connectionState.value !== 'success') {
    formError.value = 'Run a successful connection test before commissioning the sensor.'
    return
  }

  const payload = sensorPayload(commissioningStatus)
  const saved = isEditing.value
    ? sensorStore.updateSensorDetails(props.sensor.id, payload)
    : sensorStore.registerSensor(payload)
  emit('saved', saved)
  emit('close')
}

watch(() => props.isOpen, async (isOpen) => {
  if (!isOpen) {
    destroyMap()
    return
  }
  if (props.sensor) populateFromSensor(props.sensor)
  else resetForm()
  await nextTick()
  initialiseMap()
  window.setTimeout(() => placementMap?.invalidateSize(), 50)
})

watch(() => form.pipelineId, () => {
  if (!props.sensor || form.pipelineId !== props.sensor.pipelineId) {
    selectedPosition.value = null
    distanceKm.value = 0
  }
  drawSelectedPipeline()
})

onBeforeUnmount(destroyMap)
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="sensor-backdrop" @click.self="emit('close')">
      <section class="sensor-modal" role="dialog" aria-modal="true" aria-labelledby="sensor-modal-title">
        <header><div><p>SENSOR NETWORK</p><h3 id="sensor-modal-title">{{ isEditing ? 'Edit IoT Sensor' : 'Register IoT Sensor' }}</h3><span>Link, position, configure and commission a field device.</span></div><button type="button" aria-label="Close sensor form" @click="emit('close')">×</button></header>

        <form @submit.prevent="saveSensor('commissioned')">
          <section class="form-section">
            <h4>Device identity</h4>
            <div class="field-grid">
              <label><span>Sensor ID *</span><input v-model.trim="form.id" required pattern="[A-Za-z]{2}-[0-9]{3,}" placeholder="SN-072" /></label>
              <label><span>Sensor type *</span><select v-model="form.type" required><option>Pressure sensor</option><option>Flow meter</option><option>Acoustic leak sensor</option><option>Water-quality sensor</option><option>Valve controller</option><option>Gateway</option></select></label>
              <label><span>Serial number *</span><input v-model.trim="form.serialNumber" required placeholder="Manufacturer serial number" /></label>
              <label><span>Manufacturer *</span><input v-model.trim="form.manufacturer" required /></label>
              <label><span>Model *</span><input v-model.trim="form.model" required /></label>
              <label><span>Pipeline *</span><select v-model="form.pipelineId" required><option value="" disabled>Select pipeline</option><option v-for="pipeline in assetStore.pipelines" :key="pipeline.id" :value="pipeline.id">{{ pipeline.id }} — {{ pipeline.name }}</option></select></label>
            </div>
          </section>

          <section class="placement-section">
            <div><h4>Sensor placement</h4><p>Click near the selected pipeline. PIPEWISE will snap the sensor to the closest route segment.</p></div>
            <div ref="mapContainer" class="placement-map"></div>
            <div class="placement-result"><span v-if="selectedPosition">Position: {{ selectedPosition[0].toFixed(5) }}, {{ selectedPosition[1].toFixed(5) }}</span><span v-else>Select a pipeline and click the map</span><strong>{{ distanceKm.toFixed(2) }} km from pipeline start</strong></div>
          </section>

          <section class="form-section split-section">
            <div><h4>Connectivity</h4><div class="field-grid two"><label><span>Communication *</span><select v-model="form.communication"><option>LoRaWAN</option><option>NB-IoT</option><option>Cellular</option><option>Ethernet</option><option>Other</option></select></label><label><span>Reporting interval (minutes)</span><input v-model.number="form.reportingFrequency" type="number" min="1" /></label><label><span>Installation date</span><input v-model="form.installationDate" type="date" /></label><label><span>Calibration date</span><input v-model="form.calibrationDate" type="date" /></label></div></div>
            <div><h4>Telemetry & thresholds</h4><div class="field-grid two"><label><span>Initial pressure (PSI)</span><input v-model.number="form.pressure" type="number" min="0" step="0.1" /></label><label><span>Initial flow (L/min)</span><input v-model.number="form.flowRate" type="number" min="0" /></label><label><span>Warning below (PSI)</span><input v-model.number="form.warningBelow" type="number" min="0" step="0.1" /></label><label><span>Critical below (PSI)</span><input v-model.number="form.criticalBelow" type="number" min="0" step="0.1" /></label><label><span>Battery level (%)</span><input v-model.number="form.batteryLevel" type="number" min="0" max="100" /></label></div></div>
          </section>

          <section class="connection-test" :class="connectionState"><div><strong>Device connection test</strong><span v-if="connectionState === 'untested'">Required before commissioning</span><span v-else-if="connectionState === 'testing'">Contacting device gateway…</span><span v-else>Connection successful — device is ready</span></div><button type="button" :disabled="isTestingConnection" @click="runConnectionTest">{{ isTestingConnection ? 'Testing…' : 'Test connection' }}</button></section>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <footer><button class="draft-button" type="button" @click="saveSensor('draft')">Save as draft</button><span></span><button type="button" @click="emit('close')">Cancel</button><button class="commission-button" type="submit">{{ isEditing ? 'Save & commission' : 'Commission sensor' }}</button></footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.sensor-backdrop{position:fixed;inset:0;z-index:1350;display:grid;place-items:center;padding:18px;background:rgba(1,9,14,.82);backdrop-filter:blur(8px)}.sensor-modal{width:min(1100px,100%);max-height:calc(100vh - 36px);overflow:auto;border:1px solid #294555;border-radius:16px;background:#081720;box-shadow:0 30px 90px rgba(0,0,0,.62)}.sensor-modal>header{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #1b303e;background:rgba(8,23,32,.97)}header p{margin:0 0 5px;color:#4a829d;font-size:.62rem;font-weight:800;letter-spacing:.15em}header h3{margin:0;color:#f4fbff}header span{display:block;margin-top:5px;color:#718a99;font-size:.68rem}header button{display:grid;width:34px;height:34px;place-items:center;border:1px solid #284354;border-radius:8px;background:#10232f;color:#89a5b5;font-size:1.25rem}.sensor-modal form{display:grid;gap:16px;padding:20px 24px}.form-section,.placement-section{padding:16px;border:1px solid #1b303e;border-radius:11px;background:#0a1b25}.form-section h4,.placement-section h4{margin:0 0 12px;color:#e9f4fb;font-size:.78rem}.placement-section>div:first-child p{margin:-7px 0 12px;color:#718a99;font-size:.65rem}.field-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.field-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.field-grid label{display:grid;gap:6px}.field-grid label span{color:#8fa6b4;font-size:.64rem;font-weight:700}input,select{width:100%;min-height:40px;padding:8px 10px;border:1px solid #294353;border-radius:8px;background:#0c1d27;color:#e9f4fb}.placement-map{height:330px;border:1px solid #294353;border-radius:9px;background:#10232f}.placement-result{display:flex;justify-content:space-between;gap:15px;margin-top:10px;color:#718a99;font-size:.64rem}.placement-result strong{color:#58e6b2}.split-section{display:grid;grid-template-columns:1fr 1fr;gap:22px}.connection-test{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:13px 15px;border:1px solid #294353;border-radius:10px;background:#0a1b25}.connection-test div{display:grid;gap:3px}.connection-test strong{color:#dcebf3;font-size:.7rem}.connection-test span{color:#718a99;font-size:.62rem}.connection-test.success{border-color:rgba(32,219,155,.3);background:rgba(32,219,155,.05)}.connection-test.success strong,.connection-test.success span{color:#4ce4af}.connection-test button{padding:8px 12px;border:1px solid #2b596c;border-radius:7px;background:#102c39;color:#8fe6f8;font-weight:800}.form-error{margin:0;padding:10px;border:1px solid rgba(255,82,103,.28);border-radius:8px;background:rgba(255,82,103,.07);color:#ff8391;font-size:.68rem}footer{display:grid;grid-template-columns:auto 1fr auto auto;gap:9px}footer button{min-height:41px;padding:0 15px;border:1px solid #294353;border-radius:8px;background:#10232f;color:#9ab0bc;font-weight:800}.draft-button{color:#ffc857!important}.commission-button{border:0!important;background:#00addf!important;color:#00131c!important}button{cursor:pointer}button:disabled{opacity:.5}@media(max-width:800px){.field-grid,.split-section{grid-template-columns:1fr 1fr}}@media(max-width:580px){.sensor-backdrop{padding:0}.sensor-modal{max-height:100vh;border-radius:0}.sensor-modal form,.sensor-modal>header{padding:16px}.field-grid,.field-grid.two,.split-section{grid-template-columns:1fr}.placement-result{flex-direction:column}footer{grid-template-columns:1fr 1fr}footer span{display:none}}
</style>
