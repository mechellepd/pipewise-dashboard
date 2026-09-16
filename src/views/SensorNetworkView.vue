<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import RegisterSensorModal from '../components/RegisterSensorModal.vue'
import Topbar from '../components/Topbar.vue'
import { useAssetStore } from '../stores/assetStore'
import { useSensorStore } from '../stores/sensorStore'

const route = useRoute()
const router = useRouter()
const sensorStore = useSensorStore()
const assetStore = useAssetStore()

const searchQuery = ref('')
const pipelineFilter = ref(typeof route.query.pipeline === 'string' ? route.query.pipeline : 'all')
const typeFilter = ref('all')
const stateFilter = ref('all')
const selectedSensorId = ref('')
const sensorToEdit = ref(null)
const isSensorModalOpen = ref(false)
const preselectedPipelineId = ref('')
const sensorPendingDeletion = ref(null)
const importMessage = ref('')
const importError = ref('')

const sensorTypes = computed(() =>
  [...new Set(sensorStore.sensors.map((sensor) => sensor.type))].sort(),
)

const filteredSensors = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return sensorStore.sensors.filter((sensor) => {
    const matchesSearch =
      !query ||
      [sensor.id, sensor.serialNumber, sensor.manufacturer, sensor.model]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    const matchesPipeline = pipelineFilter.value === 'all' || sensor.pipelineId === pipelineFilter.value
    const matchesType = typeFilter.value === 'all' || sensor.type === typeFilter.value
    const matchesState = stateFilter.value === 'all' || sensor.commissioningStatus === stateFilter.value
    return matchesSearch && matchesPipeline && matchesType && matchesState
  })
})

const selectedSensor = computed(() =>
  sensorStore.sensors.find((sensor) => sensor.id === selectedSensorId.value) ?? null,
)

const selectedPipeline = computed(() =>
  assetStore.pipelines.find((pipeline) => pipeline.id === selectedSensor.value?.pipelineId) ?? null,
)

const summary = computed(() => ({
  total: sensorStore.sensors.length,
  commissioned: sensorStore.sensors.filter((sensor) => sensor.commissioningStatus === 'commissioned').length,
  draft: sensorStore.sensors.filter((sensor) => sensor.commissioningStatus === 'draft').length,
  offline: sensorStore.sensors.filter((sensor) => sensor.commissioningStatus === 'offline' || sensor.connectionStatus === 'offline').length,
}))

function openRegisterSensor(pipelineId = '') {
  sensorToEdit.value = null
  preselectedPipelineId.value = pipelineId || (pipelineFilter.value !== 'all' ? pipelineFilter.value : '')
  isSensorModalOpen.value = true
}

function openEditSensor(sensor) {
  sensorToEdit.value = sensor
  preselectedPipelineId.value = sensor.pipelineId
  isSensorModalOpen.value = true
}

function closeSensorModal() {
  isSensorModalOpen.value = false
  sensorToEdit.value = null
}

function handleSensorSaved(sensor) {
  selectedSensorId.value = sensor.id
}

function selectSensor(sensor) {
  selectedSensorId.value = sensor.id
}

function viewSensorOnMap(sensor) {
  router.push({ name: 'network-map', query: { pipeline: sensor.pipelineId } })
}

async function retestSensor(sensor) {
  await sensorStore.testSensorConnection(sensor.id)
}

function toggleOffline(sensor) {
  sensorStore.setCommissioningStatus(
    sensor.id,
    sensor.commissioningStatus === 'offline' ? 'commissioned' : 'offline',
  )
}

function confirmDeleteSensor() {
  if (!sensorPendingDeletion.value) return
  sensorStore.deleteSensor(sensorPendingDeletion.value.id)
  if (selectedSensorId.value === sensorPendingDeletion.value.id) selectedSensorId.value = ''
  sensorPendingDeletion.value = null
}

function clearFilters() {
  searchQuery.value = ''
  pipelineFilter.value = 'all'
  typeFilter.value = 'all'
  stateFilter.value = 'all'
}

async function importSensors(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importError.value = ''
  importMessage.value = ''

  try {
    const rows = (await file.text()).trim().split(/\r?\n/).filter(Boolean)
    const headers = rows[0].split(',').map((header) => header.trim())
    const required = ['pipelineId', 'type', 'latitude', 'longitude']
    if (required.some((header) => !headers.includes(header))) {
      throw new Error('CSV must include pipelineId, type, latitude and longitude headers.')
    }

    let imported = 0
    const skipped = []
    rows.slice(1).forEach((row) => {
      const values = row.split(',').map((value) => value.trim())
      const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
      const pipeline = assetStore.pipelines.find((item) => item.id === record.pipelineId)

      if (
        !pipeline ||
        (record.id && sensorStore.sensorIdExists(record.id))
      ) {
        skipped.push(record.id || 'Unnamed row')
        return
      }

      const sensorId =
        record.id || sensorStore.generateSensorId(record.type)

      sensorStore.registerSensor({
        id: sensorId,
        pipelineId: record.pipelineId,
        type: record.type,
        serialNumber: record.serialNumber || sensorId,
        manufacturer: record.manufacturer || 'Unspecified',
        model: record.model || 'Unspecified',
        communication: record.communication || 'LoRaWAN',
        reportingFrequency: Number(record.reportingFrequency || 5),
        installationDate: record.installationDate || new Date().toISOString().slice(0, 10),
        calibrationDate: record.calibrationDate || new Date().toISOString().slice(0, 10),
        pressure: Number(record.pressure || 45),
        flowRate: Number(record.flowRate || 1100),
        batteryLevel: Number(record.batteryLevel || 100),
        thresholds: {
          warningBelow: Number(record.warningBelow || 38),
          criticalBelow: Number(record.criticalBelow || 25),
        },
        position: [Number(record.latitude), Number(record.longitude)],
        distanceKm: Number(record.distanceKm || 0),
        commissioningStatus: record.commissioningStatus || 'draft',
        connectionStatus: record.commissioningStatus === 'commissioned' ? 'online' : 'offline',
      })
      imported += 1
    })

    importMessage.value = `${imported} sensor${imported === 1 ? '' : 's'} imported${skipped.length ? `; ${skipped.length} skipped` : ''}.`
  } catch (error) {
    importError.value = error.message
  } finally {
    event.target.value = ''
  }
}

watch(() => route.query.pipeline, (pipelineId) => {
  pipelineFilter.value = typeof pipelineId === 'string' ? pipelineId : 'all'
})
</script>

<template>
  <main class="main-content">
    <Topbar />
    <section class="page-content">
      <div class="page-heading"><div><p class="eyebrow">IOT DEVICE MANAGEMENT</p><h3>Sensor Network Registry</h3><p>Register, position, configure and commission monitoring devices across the pipeline network.</p></div><div class="heading-actions"><label class="import-button">Import CSV<input type="file" accept=".csv" @change="importSensors" /></label><button type="button" @click="openRegisterSensor()">+ Register Sensor</button></div></div>

      <p v-if="importMessage" class="import-message success">{{ importMessage }}</p><p v-if="importError" class="import-message error">{{ importError }}</p>

      <section class="summary-grid"><article><span>Total sensors</span><strong>{{ summary.total }}</strong><small>Registered IoT devices</small></article><article class="healthy"><span>Commissioned</span><strong>{{ summary.commissioned }}</strong><small>Connected and operational</small></article><article class="draft"><span>Draft</span><strong>{{ summary.draft }}</strong><small>Awaiting commissioning</small></article><article class="offline"><span>Offline</span><strong>{{ summary.offline }}</strong><small>Requires connectivity review</small></article></section>

      <section class="registry-layout">
        <div class="registry-panel">
          <div class="filters"><label class="search"><span>Search devices</span><input v-model="searchQuery" type="search" placeholder="Sensor ID, serial or model" /></label><label><span>Pipeline</span><select v-model="pipelineFilter"><option value="all">All pipelines</option><option v-for="pipeline in assetStore.pipelines" :key="pipeline.id" :value="pipeline.id">{{ pipeline.id }}</option></select></label><label><span>Type</span><select v-model="typeFilter"><option value="all">All types</option><option v-for="type in sensorTypes" :key="type">{{ type }}</option></select></label><label><span>State</span><select v-model="stateFilter"><option value="all">All states</option><option value="commissioned">Commissioned</option><option value="draft">Draft</option><option value="offline">Offline</option></select></label><button type="button" @click="clearFilters">Clear</button></div>
          <div class="result-count">Showing {{ filteredSensors.length }} of {{ sensorStore.sensors.length }} sensors</div>
          <div class="table-wrap"><table><thead><tr><th>Sensor</th><th>Pipeline</th><th>Type</th><th>Telemetry</th><th>Battery</th><th>State</th><th>Actions</th></tr></thead><tbody><tr v-for="sensor in filteredSensors" :key="sensor.id" :class="{ selected: selectedSensorId === sensor.id }" @click="selectSensor(sensor)"><td><strong>{{ sensor.id }}</strong><small>{{ sensor.manufacturer }} {{ sensor.model }}</small></td><td>{{ sensor.pipelineId }}</td><td>{{ sensor.type }}</td><td><span :class="['health-dot', sensor.status]"></span>{{ sensor.pressure.toFixed(1) }} PSI</td><td>{{ sensor.batteryLevel }}%</td><td><span :class="['state-badge', sensor.commissioningStatus]">{{ sensor.commissioningStatus }}</span></td><td><div class="row-actions"><button type="button" @click.stop="openEditSensor(sensor)">Edit</button><button type="button" @click.stop="viewSensorOnMap(sensor)">Map</button><button class="delete" type="button" @click.stop="sensorPendingDeletion = sensor">Delete</button></div></td></tr><tr v-if="filteredSensors.length === 0"><td colspan="7" class="empty-row">No sensors match the selected filters.</td></tr></tbody></table></div>
        </div>

        <aside class="detail-panel">
          <template v-if="selectedSensor"><header><div><p class="eyebrow">{{ selectedSensor.id }}</p><h4>{{ selectedSensor.type }}</h4></div><span :class="['state-badge', selectedSensor.commissioningStatus]">{{ selectedSensor.commissioningStatus }}</span></header><div class="detail-content"><dl><div><dt>Pipeline</dt><dd>{{ selectedSensor.pipelineId }} — {{ selectedPipeline?.name }}</dd></div><div><dt>Serial number</dt><dd>{{ selectedSensor.serialNumber }}</dd></div><div><dt>Communication</dt><dd>{{ selectedSensor.communication }}</dd></div><div><dt>Reporting interval</dt><dd>{{ selectedSensor.reportingFrequency }} minutes</dd></div><div><dt>Route position</dt><dd>{{ selectedSensor.distanceKm.toFixed(2) }} km</dd></div><div><dt>Last updated</dt><dd>{{ selectedSensor.lastUpdated }}</dd></div></dl><section class="telemetry"><div><span>Pressure</span><strong>{{ selectedSensor.pressure.toFixed(1) }} PSI</strong></div><div><span>Flow</span><strong>{{ selectedSensor.flowRate }} L/min</strong></div><div><span>Battery</span><strong>{{ selectedSensor.batteryLevel }}%</strong></div></section><section class="thresholds"><h5>Pressure thresholds</h5><div><span>Warning below</span><strong>{{ selectedSensor.thresholds.warningBelow }} PSI</strong></div><div><span>Critical below</span><strong>{{ selectedSensor.thresholds.criticalBelow }} PSI</strong></div></section></div><footer><button type="button" @click="retestSensor(selectedSensor)">Test connection</button><button type="button" @click="toggleOffline(selectedSensor)">{{ selectedSensor.commissioningStatus === 'offline' ? 'Return online' : 'Mark offline' }}</button><button type="button" @click="openEditSensor(selectedSensor)">Edit sensor</button></footer></template>
          <div v-else class="empty-detail"><span>◉</span><strong>Select a sensor</strong><p>Review device configuration, telemetry and commissioning information.</p></div>
        </aside>
      </section>
    </section>

    <RegisterSensorModal :is-open="isSensorModalOpen" :pipeline-id="preselectedPipelineId" :sensor="sensorToEdit" @close="closeSensorModal" @saved="handleSensorSaved" />

    <Teleport to="body"><div v-if="sensorPendingDeletion" class="confirm-backdrop" @click.self="sensorPendingDeletion = null"><section role="alertdialog" aria-modal="true"><p class="eyebrow">CONFIRM DELETION</p><h3>Delete {{ sensorPendingDeletion.id }}?</h3><p>The device will be removed from its pipeline and the network map.</p><div><button type="button" @click="sensorPendingDeletion = null">Keep sensor</button><button class="confirm-delete" type="button" @click="confirmDeleteSensor">Delete sensor</button></div></section></div></Teleport>
  </main>
</template>

<style scoped>
.main-content{width:calc(100% - 252px);min-width:0;margin-left:252px}.page-content{padding:26px 28px 40px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:20px}.eyebrow{margin:0 0 6px;color:#4a829d;font-size:.62rem;font-weight:800;letter-spacing:.15em}.page-heading h3{margin:0;color:#f4fbff}.page-heading>div>p:last-child{margin:7px 0 0;color:#78909f;font-size:.75rem}.heading-actions{display:flex;gap:9px}.heading-actions button,.import-button{display:grid;min-height:40px;padding:0 14px;place-items:center;border:1px solid #294353;border-radius:8px;background:#10232f;color:#8fdff2;font-size:.67rem;font-weight:800;cursor:pointer}.heading-actions button{border:0;background:#00addf;color:#00131c}.import-button input{display:none}.import-message{margin:-8px 0 14px;padding:10px 12px;border-radius:8px;font-size:.68rem}.import-message.success{background:rgba(32,219,155,.08);color:#4ce4af}.import-message.error{background:rgba(255,82,103,.08);color:#ff7182}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:15px}.summary-grid article{padding:16px;border:1px solid #1b303e;border-radius:11px;background:#0b1922}.summary-grid span,.summary-grid small{display:block;color:#718a99;font-size:.64rem}.summary-grid strong{display:block;margin:6px 0 4px;color:#f4fbff;font-size:1.45rem}.summary-grid .healthy{border-color:rgba(32,219,155,.24)}.summary-grid .draft{border-color:rgba(255,200,87,.22)}.summary-grid .offline{border-color:rgba(255,82,103,.24)}.registry-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(330px,.6fr);overflow:hidden;border:1px solid #1b303e;border-radius:12px;background:#0b1922}.registry-panel{min-width:0;border-right:1px solid #1b303e}.filters{display:grid;grid-template-columns:1.4fr repeat(3,.7fr) auto;gap:9px;align-items:end;padding:14px;border-bottom:1px solid #1b303e}.filters label{display:grid;gap:6px}.filters label span{color:#718a99;font-size:.6rem}.filters input,.filters select{width:100%;min-height:38px;padding:8px 9px;border:1px solid #294353;border-radius:7px;background:#0c1d27;color:#e9f4fb}.filters button{min-height:38px;padding:0 11px;border:1px solid #294353;border-radius:7px;background:#10232f;color:#8fdff2}.result-count{padding:9px 14px;border-bottom:1px solid #182c39;color:#607887;font-size:.62rem}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:.65rem}th,td{padding:12px 13px;border-bottom:1px solid #182c39;text-align:left;white-space:nowrap}th{color:#577181;font-size:.56rem;text-transform:uppercase}td{color:#8298a6}td strong{display:block;color:#dcebf3}td small{display:block;margin-top:3px;color:#526d7c;font-size:.56rem}tbody tr{cursor:pointer}tbody tr:hover,tbody tr.selected{background:#102633}.health-dot{display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%}.health-dot.normal{background:#20db9b}.health-dot.warning{background:#ffc857}.health-dot.critical{background:#ff5267}.state-badge{display:inline-flex;padding:5px 7px;border-radius:999px;font-size:.55rem;font-weight:900;text-transform:capitalize}.state-badge.commissioned{background:rgba(32,219,155,.1);color:#4ce4af}.state-badge.draft{background:rgba(255,200,87,.1);color:#ffc857}.state-badge.offline{background:rgba(255,82,103,.11);color:#ff7182}.row-actions{display:flex;gap:5px}.row-actions button{padding:5px 7px;border:1px solid #294353;border-radius:6px;background:#10232f;color:#8fdff2;font-size:.56rem}.row-actions .delete{color:#ff7182}.empty-row{padding:40px;text-align:center}.detail-panel{display:flex;flex-direction:column;background:#091821}.detail-panel>header{display:flex;justify-content:space-between;padding:17px;border-bottom:1px solid #1b303e}.detail-panel h4{margin:0;color:#f4fbff}.detail-content{flex:1;padding:17px}.detail-content dl{margin:0}.detail-content dl div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #182c39}.detail-content dt{color:#607887;font-size:.62rem}.detail-content dd{margin:0;color:#dcebf3;font-size:.64rem;font-weight:700;text-align:right}.telemetry{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:15px}.telemetry div,.thresholds{padding:10px;border:1px solid #1b303e;border-radius:8px;background:#0c1d27}.telemetry span{display:block;color:#607887;font-size:.55rem}.telemetry strong{display:block;margin-top:4px;color:#e9f4fb;font-size:.66rem}.thresholds{margin-top:12px}.thresholds h5{margin:0 0 8px;color:#dcebf3}.thresholds div{display:flex;justify-content:space-between;padding:6px 0;color:#718a99;font-size:.62rem}.thresholds strong{color:#dcebf3}.detail-panel>footer{display:grid;gap:7px;padding:13px;border-top:1px solid #1b303e}.detail-panel>footer button{min-height:38px;border:1px solid #294353;border-radius:7px;background:#10232f;color:#8fdff2;font-size:.62rem;font-weight:800}.empty-detail{display:grid;flex:1;place-items:center;align-content:center;text-align:center}.empty-detail span{color:#4a829d;font-size:1.5rem}.empty-detail strong{margin-top:8px;color:#dcebf3}.empty-detail p{max-width:240px;color:#607887;font-size:.65rem}.confirm-backdrop{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;background:rgba(1,9,14,.78)}.confirm-backdrop section{width:min(450px,calc(100% - 30px));padding:24px;border:1px solid #294555;border-radius:14px;background:#091821}.confirm-backdrop h3{margin:0;color:#f4fbff}.confirm-backdrop section>p:not(.eyebrow){color:#78909f;font-size:.7rem}.confirm-backdrop section>div{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.confirm-backdrop button{min-height:39px;padding:0 13px;border:1px solid #294353;border-radius:7px;background:#10232f;color:#9ab0bc}.confirm-backdrop .confirm-delete{border:0;background:#ff5267;color:#fff}button{cursor:pointer}@media(max-width:1150px){.registry-layout{grid-template-columns:1fr}.registry-panel{border-right:0}.detail-panel{min-height:500px}.filters{grid-template-columns:repeat(2,1fr)}}@media(max-width:820px){.main-content{width:calc(100% - 82px);margin-left:0}.page-content{padding-inline:16px}.summary-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:580px){.page-heading{align-items:flex-start;flex-direction:column}.heading-actions{width:100%}.heading-actions>*{flex:1}.filters,.summary-grid{grid-template-columns:1fr}.telemetry{grid-template-columns:1fr}}
</style>
