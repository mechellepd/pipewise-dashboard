<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import L from 'leaflet'

import { useAssetStore } from '../stores/assetStore'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'registered'])
const assetStore = useAssetStore()

const DRAFT_KEY = 'pipewise-asset-registration-draft'
const mapContainer = ref(null)
const routeCoordinates = ref([])
const selectedMethod = ref('draw')
const selectedPlace = ref('')
const selectedPipelineId = ref('')
const manualCoordinates = ref('')
const snapEnabled = ref(true)
const useLengthOverride = ref(false)
const lengthOverride = ref('')
const formError = ref('')
const routeMessage = ref('Click the map to start drawing the pipeline route.')
const hasDraft = ref(false)

let routeMap = null
let routeLine = null
let pointMarkers = []

const form = reactive({
  id: '',
  name: '',
  material: '',
  diameter: '',
  installationYear: new Date().getFullYear(),
})

const places = [
  { name: 'Bandar Seri Begawan', coordinates: [4.9031, 114.9398] },
  { name: 'Gadong', coordinates: [4.907, 114.916] },
  { name: 'Kiulap', coordinates: [4.8988, 114.9276] },
  { name: 'Berakas', coordinates: [4.9512, 114.9621] },
  { name: 'Lambak', coordinates: [4.9672, 114.9518] },
  { name: 'Jerudong', coordinates: [4.9503, 114.827] },
  { name: 'Mentiri', coordinates: [4.9925, 115.0207] },
  { name: 'Muara', coordinates: [5.0333, 115.0667] },
]

const routePointCount = computed(() => routeCoordinates.value.length)

const calculatedLengthKm = computed(() => {
  let total = 0

  for (let index = 1; index < routeCoordinates.value.length; index += 1) {
    total += haversineDistance(
      routeCoordinates.value[index - 1],
      routeCoordinates.value[index],
    )
  }

  return Number(total.toFixed(2))
})

const effectiveLengthKm = computed(() => {
  return useLengthOverride.value
    ? Number(lengthOverride.value)
    : calculatedLengthKm.value
})

function toRadians(value) {
  return (value * Math.PI) / 180
}

function haversineDistance(first, second) {
  const earthRadiusKm = 6371
  const latitudeDelta = toRadians(second[0] - first[0])
  const longitudeDelta = toRadians(second[1] - first[1])
  const firstLatitude = toRadians(first[0])
  const secondLatitude = toRadians(second[0])

  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(
    Math.sqrt(calculation),
    Math.sqrt(1 - calculation),
  )
}

function findSnapPoint(coordinate) {
  if (!snapEnabled.value) {
    return coordinate
  }

  const candidates = assetStore.pipelines.flatMap(
    (pipeline) => pipeline.coordinates,
  )

  let closestPoint = null
  let closestDistance = 0.12

  candidates.forEach((candidate) => {
    const distance = haversineDistance(coordinate, candidate)

    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = candidate
    }
  })

  return closestPoint ? [...closestPoint] : coordinate
}

function pointIcon(index) {
  return L.divIcon({
    className: 'route-point-wrapper',
    html: `<span class="route-point">${index + 1}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function redrawRoute({ fit = false } = {}) {
  if (!routeMap) {
    return
  }

  if (!routeLine) {
    routeLine = L.polyline([], {
      color: '#00addf',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeMap)
  }

  routeLine.setLatLngs(routeCoordinates.value)
  pointMarkers.forEach((marker) => marker.remove())
  pointMarkers = routeCoordinates.value.map((coordinate, index) => {
    const marker = L.marker(coordinate, {
      draggable: true,
      icon: pointIcon(index),
    }).addTo(routeMap)

    marker.on('drag', (event) => {
      const point = event.target.getLatLng()
      routeCoordinates.value[index] = [point.lat, point.lng]
      routeCoordinates.value = [...routeCoordinates.value]
      routeLine.setLatLngs(routeCoordinates.value)
    })

    marker.on('dragend', () => {
      const snapped = findSnapPoint(routeCoordinates.value[index])
      routeCoordinates.value[index] = snapped
      routeCoordinates.value = [...routeCoordinates.value]
      redrawRoute()
    })

    return marker
  })

  if (fit && routeCoordinates.value.length > 0) {
    if (routeCoordinates.value.length === 1) {
      routeMap.setView(routeCoordinates.value[0], 16)
    } else {
      routeMap.fitBounds(routeCoordinates.value, { padding: [35, 35] })
    }
  }
}

function addRoutePoint(event) {
  if (selectedMethod.value !== 'draw') {
    return
  }

  const point = findSnapPoint([event.latlng.lat, event.latlng.lng])
  routeCoordinates.value = [...routeCoordinates.value, point]
  routeMessage.value = routeCoordinates.value.length < 2
    ? 'Add at least one more point to complete the route.'
    : 'Route ready. Add more points to follow bends or drag points to refine it.'
  redrawRoute()
}

function initialiseMap() {
  if (!mapContainer.value || routeMap) {
    return
  }

  routeMap = L.map(mapContainer.value, {
    center: [4.915, 114.945],
    zoom: 13,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(routeMap)

  routeMap.on('click', addRoutePoint)
  redrawRoute()
}

function destroyMap() {
  pointMarkers.forEach((marker) => marker.remove())
  pointMarkers = []
  routeMap?.remove()
  routeMap = null
  routeLine = null
}

function undoPoint() {
  routeCoordinates.value = routeCoordinates.value.slice(0, -1)
  redrawRoute()
}

function clearRoute() {
  routeCoordinates.value = []
  manualCoordinates.value = ''
  routeMessage.value = 'Click the map to start drawing the pipeline route.'
  redrawRoute()
}

function goToPlace() {
  const place = places.find((item) => item.name === selectedPlace.value)

  if (place && routeMap) {
    routeMap.setView(place.coordinates, 15)
  }
}

function copyExistingRoute() {
  const pipeline = assetStore.pipelines.find(
    (item) => item.id === selectedPipelineId.value,
  )

  if (!pipeline) {
    return
  }

  routeCoordinates.value = pipeline.coordinates.map((point) => [...point])
  routeMessage.value = `Route copied from ${pipeline.id}. Drag points to adjust it.`
  redrawRoute({ fit: true })
}

function coordinatesFromGeoJson(data) {
  const geometry = data.type === 'Feature'
    ? data.geometry
    : data.type === 'FeatureCollection'
      ? data.features?.find((feature) =>
          ['LineString', 'MultiLineString'].includes(feature.geometry?.type),
        )?.geometry
      : data

  if (geometry?.type === 'LineString') {
    return geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude])
  }

  if (geometry?.type === 'MultiLineString') {
    return geometry.coordinates.flat().map(([longitude, latitude]) => [latitude, longitude])
  }

  throw new Error('The GeoJSON file must contain a LineString route.')
}

function coordinatesFromKml(text) {
  const document = new DOMParser().parseFromString(text, 'application/xml')
  const coordinateText = document.querySelector('LineString coordinates')?.textContent

  if (!coordinateText) {
    throw new Error('The KML file must contain a LineString route.')
  }

  return coordinateText.trim().split(/\s+/).map((entry) => {
    const [longitude, latitude] = entry.split(',').map(Number)
    return [latitude, longitude]
  })
}

function coordinatesFromCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean)
  const firstColumns = rows[0].split(',').map((item) => item.trim().toLowerCase())
  const hasHeader = firstColumns.some((item) =>
    ['latitude', 'lat', 'longitude', 'lng', 'lon'].includes(item),
  )
  let latitudeIndex = 0
  let longitudeIndex = 1

  if (hasHeader) {
    latitudeIndex = firstColumns.findIndex((item) => ['latitude', 'lat'].includes(item))
    longitudeIndex = firstColumns.findIndex((item) => ['longitude', 'lng', 'lon'].includes(item))

    if (latitudeIndex === -1 || longitudeIndex === -1) {
      throw new Error('CSV headers must include latitude and longitude.')
    }
  }

  return rows.slice(hasHeader ? 1 : 0).map((row) => {
    const columns = row.split(',').map((item) => item.trim())
    return [Number(columns[latitudeIndex]), Number(columns[longitudeIndex])]
  })
}

function validateCoordinates(coordinates) {
  const valid = coordinates.filter(([latitude, longitude]) =>
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180,
  )

  if (valid.length < 2 || valid.length !== coordinates.length) {
    throw new Error('The route must contain at least two valid coordinate points.')
  }

  return valid
}

async function importRoute(event) {
  const file = event.target.files?.[0]

  if (!file) {
    return
  }

  try {
    const text = await file.text()
    const extension = file.name.split('.').pop()?.toLowerCase()
    let coordinates

    if (['geojson', 'json'].includes(extension)) {
      coordinates = coordinatesFromGeoJson(JSON.parse(text))
    } else if (extension === 'kml') {
      coordinates = coordinatesFromKml(text)
    } else if (extension === 'csv') {
      coordinates = coordinatesFromCsv(text)
    } else {
      throw new Error('Use a GeoJSON, KML or CSV file.')
    }

    routeCoordinates.value = validateCoordinates(coordinates)
    routeMessage.value = `${file.name} imported successfully. Review the route before registering.`
    formError.value = ''
    redrawRoute({ fit: true })
  } catch (error) {
    formError.value = error.message
  } finally {
    event.target.value = ''
  }
}

function applyManualCoordinates() {
  try {
    const coordinates = manualCoordinates.value
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((row) => row.split(',').map((value) => Number(value.trim())))

    routeCoordinates.value = validateCoordinates(coordinates)
    routeMessage.value = 'Manual coordinates applied. Review the route on the map.'
    formError.value = ''
    redrawRoute({ fit: true })
  } catch (error) {
    formError.value = error.message
  }
}

function draftPayload() {
  return {
    form: { ...form },
    coordinates: routeCoordinates.value,
    method: selectedMethod.value,
    useLengthOverride: useLengthOverride.value,
    lengthOverride: lengthOverride.value,
  }
}

function saveDraft() {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload()))
  hasDraft.value = true
  routeMessage.value = 'Draft saved on this device.'
}

function resumeDraft() {
  try {
    const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY))
    Object.assign(form, draft.form ?? {})
    routeCoordinates.value = validateCoordinates(draft.coordinates ?? [])
    selectedMethod.value = draft.method ?? 'draw'
    useLengthOverride.value = Boolean(draft.useLengthOverride)
    lengthOverride.value = draft.lengthOverride ?? ''
    redrawRoute({ fit: true })
    routeMessage.value = 'Draft restored.'
  } catch {
    formError.value = 'The saved draft could not be restored.'
  }
}

function discardDraft() {
  window.localStorage.removeItem(DRAFT_KEY)
  hasDraft.value = false
}

function resetForm() {
  form.id = assetStore.generateAssetId()
  form.name = ''
  form.material = ''
  form.diameter = ''
  form.installationYear = new Date().getFullYear()
  selectedMethod.value = 'draw'
  selectedPlace.value = ''
  selectedPipelineId.value = ''
  manualCoordinates.value = ''
  useLengthOverride.value = false
  lengthOverride.value = ''
  formError.value = ''
  clearRoute()
}

function closeModal() {
  emit('close')
}

function submitAsset() {
  formError.value = ''

  if (assetStore.assetIdExists(form.id)) {
    form.id = assetStore.generateAssetId()
  }

  if (routeCoordinates.value.length < 2) {
    formError.value = 'Draw, import, copy or enter a route with at least two points.'
    return
  }

  if (!effectiveLengthKm.value || effectiveLengthKm.value <= 0) {
    formError.value = 'Enter a valid engineering length or use the calculated route length.'
    return
  }

  const asset = assetStore.registerAsset({
    id: form.id,
    name: form.name,
    material: form.material,
    diameter: Number(form.diameter),
    installationYear: Number(form.installationYear),
    lengthKm: effectiveLengthKm.value,
    coordinates: routeCoordinates.value,
  })

  discardDraft()
  resetForm()
  emit('registered', asset)
  emit('close')
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      hasDraft.value = Boolean(window.localStorage.getItem(DRAFT_KEY))
      if (!hasDraft.value) {
        resetForm()
      }
      await nextTick()
      initialiseMap()
      window.setTimeout(() => routeMap?.invalidateSize(), 50)
    } else {
      destroyMap()
    }
  },
)

watch(selectedMethod, async () => {
  await nextTick()
  routeMap?.invalidateSize()
})

onBeforeUnmount(destroyMap)
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="registration-backdrop" @click.self="closeModal">
      <section class="registration-modal" role="dialog" aria-modal="true" aria-labelledby="register-asset-title">
        <header class="registration-header">
          <div>
            <p class="eyebrow">ASSET REGISTRY</p>
            <h3 id="register-asset-title">Register Pipeline Asset</h3>
            <p>Enter the asset details, then build or import its route.</p>
          </div>
          <button class="close-button" type="button" aria-label="Close register asset form" @click="closeModal">×</button>
        </header>

        <form class="registration-body" @submit.prevent="submitAsset">
          <section class="details-grid">
            <label><span>Asset ID</span><input v-model="form.id" class="generated-id" readonly aria-describedby="asset-id-help" /><small id="asset-id-help">Generated automatically and never reused</small></label>
            <label class="wide"><span>Asset name *</span><input v-model.trim="form.name" required placeholder="Lambak Main Line" /></label>
            <label><span>Material *</span><select v-model="form.material" required><option value="" disabled>Select material</option><option>Ductile iron</option><option>Steel</option><option>HDPE</option><option>PVC</option></select></label>
            <label><span>Diameter (mm) *</span><input v-model.number="form.diameter" required type="number" min="1" /></label>
            <label><span>Installation year *</span><input v-model.number="form.installationYear" required type="number" min="1900" :max="new Date().getFullYear()" /></label>
          </section>

          <section v-if="hasDraft" class="draft-banner">
            <div><strong>Saved registration draft available</strong><span>Continue where the operator last stopped.</span></div>
            <button type="button" @click="resumeDraft">Resume</button>
            <button class="text-button" type="button" @click="discardDraft">Discard</button>
          </section>

          <section class="route-builder">
            <div class="route-heading">
              <div><h4>Pipeline route</h4><p>Choose the entry method that matches the available field information.</p></div>
              <label class="snap-toggle"><input v-model="snapEnabled" type="checkbox" /> Snap to nearby pipeline points</label>
            </div>

            <div class="method-tabs" role="tablist" aria-label="Route entry method">
              <button v-for="method in [{id:'draw',label:'Draw on map'},{id:'import',label:'Import GIS/CSV'},{id:'copy',label:'Copy existing'},{id:'manual',label:'Manual coordinates'}]" :key="method.id" type="button" :class="{ active: selectedMethod === method.id }" @click="selectedMethod = method.id">{{ method.label }}</button>
            </div>

            <div class="route-workspace">
              <div class="map-column">
                <div class="place-search">
                  <select v-model="selectedPlace" aria-label="Find an area"><option value="">Find an area…</option><option v-for="place in places" :key="place.name">{{ place.name }}</option></select>
                  <button type="button" :disabled="!selectedPlace" @click="goToPlace">Go</button>
                </div>
                <div ref="mapContainer" class="route-map" aria-label="Draw pipeline route on map"></div>
                <div class="map-actions">
                  <span>{{ routePointCount }} route points</span>
                  <button type="button" :disabled="routePointCount === 0" @click="undoPoint">Undo point</button>
                  <button type="button" :disabled="routePointCount === 0" @click="clearRoute">Clear route</button>
                </div>
              </div>

              <aside class="method-panel">
                <template v-if="selectedMethod === 'draw'">
                  <h5>Draw the route</h5><p>Click along the pipeline alignment. Add a point at each bend or junction, then drag points to refine the route.</p>
                </template>
                <template v-else-if="selectedMethod === 'import'">
                  <h5>Import an existing route</h5><p>Supports GeoJSON LineString, KML LineString and CSV rows containing latitude and longitude.</p>
                  <label class="file-button">Choose route file<input type="file" accept=".geojson,.json,.kml,.csv" @change="importRoute" /></label>
                </template>
                <template v-else-if="selectedMethod === 'copy'">
                  <h5>Copy an existing pipeline</h5><p>Useful for parallel mains or replacement pipelines. Copy the route, then drag points to adjust it.</p>
                  <select v-model="selectedPipelineId"><option value="">Select pipeline</option><option v-for="pipeline in assetStore.pipelines" :key="pipeline.id" :value="pipeline.id">{{ pipeline.id }} — {{ pipeline.name }}</option></select>
                  <button type="button" :disabled="!selectedPipelineId" @click="copyExistingRoute">Copy route</button>
                </template>
                <template v-else>
                  <h5>Advanced coordinate entry</h5><p>Enter one point per line in latitude, longitude order.</p>
                  <textarea v-model="manualCoordinates" rows="8" placeholder="4.9031, 114.9398&#10;4.9070, 114.9450"></textarea>
                  <button type="button" :disabled="!manualCoordinates.trim()" @click="applyManualCoordinates">Apply coordinates</button>
                </template>
              </aside>
            </div>

            <p class="route-message">{{ routeMessage }}</p>
          </section>

          <section class="length-panel">
            <div><span>Calculated route length</span><strong>{{ calculatedLengthKm.toFixed(2) }} km</strong></div>
            <label class="override-toggle"><input v-model="useLengthOverride" type="checkbox" /> Use engineering-record length</label>
            <label v-if="useLengthOverride"><span>Recorded length (km)</span><input v-model.number="lengthOverride" required type="number" min="0.01" step="0.01" /></label>
          </section>

          <p v-if="formError" class="form-error">{{ formError }}</p>

          <footer class="registration-actions">
            <button class="secondary-button" type="button" @click="saveDraft">Save draft</button>
            <span></span>
            <button class="secondary-button" type="button" @click="closeModal">Cancel</button>
            <button class="primary-action" type="submit">Register asset</button>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.registration-backdrop{position:fixed;inset:0;z-index:1300;display:grid;place-items:center;padding:18px;background:rgba(1,9,14,.82);backdrop-filter:blur(8px)}
.registration-modal{width:min(1180px,100%);max-height:calc(100vh - 36px);overflow:auto;border:1px solid #294555;border-radius:16px;background:#081720;box-shadow:0 30px 90px rgba(0,0,0,.62)}
.registration-header{position:sticky;top:0;z-index:5;display:flex;align-items:flex-start;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #1b303e;background:rgba(8,23,32,.96);backdrop-filter:blur(12px)}
.eyebrow{margin:0 0 5px;color:#4a829d;font-size:.62rem;font-weight:800;letter-spacing:.15em}.registration-header h3{margin:0;color:#f4fbff}.registration-header p:not(.eyebrow){margin:6px 0 0;color:#718a99;font-size:.72rem}.close-button{display:grid;width:34px;height:34px;place-items:center;border:1px solid #284354;border-radius:8px;background:#10232f;color:#89a5b5;font-size:1.25rem}
.registration-body{display:grid;gap:18px;padding:20px 24px 24px}.details-grid{display:grid;grid-template-columns:1fr 1.7fr 1fr 1fr 1fr;gap:12px}.details-grid label,.length-panel label{display:grid;gap:6px}.details-grid span,.length-panel label span{color:#8fa6b4;font-size:.67rem;font-weight:700}input,select,textarea{width:100%;min-height:40px;padding:9px 11px;border:1px solid #294353;border-radius:8px;outline:none;background:#0c1d27;color:#e9f4fb}input:focus,select:focus,textarea:focus{border-color:#00addf;box-shadow:0 0 0 3px rgba(0,173,223,.1)}.generated-id{border-color:rgba(0,173,223,.35);background:rgba(0,173,223,.08);color:#91e7f8;font-weight:800}.details-grid small{color:#526d7b;font-size:.56rem}
.draft-banner{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid rgba(255,200,87,.3);border-radius:10px;background:rgba(255,200,87,.06)}.draft-banner div{display:grid;flex:1;gap:2px}.draft-banner strong{color:#ffc857;font-size:.72rem}.draft-banner span{color:#78909f;font-size:.65rem}.draft-banner button{padding:7px 11px;border:1px solid #826d35;border-radius:7px;background:#2b2718;color:#ffd979;font-weight:800}.draft-banner .text-button{border:0;background:transparent;color:#8298a6}
.route-builder{overflow:hidden;border:1px solid #1b303e;border-radius:12px;background:#0a1b25}.route-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:14px 16px}.route-heading h4{margin:0 0 4px;color:#f4fbff}.route-heading p{margin:0;color:#6f8795;font-size:.68rem}.snap-toggle,.override-toggle{display:flex!important;align-items:center;gap:7px;color:#91a7b4;font-size:.68rem;white-space:nowrap}.snap-toggle input,.override-toggle input{width:auto;min-height:auto}
.method-tabs{display:flex;gap:4px;padding:0 12px 12px}.method-tabs button{padding:8px 12px;border:1px solid #253d4c;border-radius:7px;background:#0d202b;color:#7f96a4;font-size:.66rem;font-weight:800}.method-tabs button.active{border-color:#00addf;background:rgba(0,173,223,.12);color:#91e7f8}.route-workspace{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(260px,.7fr);min-height:390px;border-top:1px solid #1b303e}.map-column{position:relative;min-width:0}.route-map{height:390px;background:#10232f}.place-search{position:absolute;z-index:500;top:10px;left:50px;display:flex;gap:5px;width:min(320px,calc(100% - 65px))}.place-search select{box-shadow:0 5px 18px rgba(0,0,0,.28)}.place-search button,.map-actions button,.method-panel button{padding:8px 11px;border:1px solid #294353;border-radius:7px;background:#10232f;color:#91dff1;font-size:.65rem;font-weight:800}.map-actions{position:absolute;z-index:500;right:10px;bottom:10px;display:flex;align-items:center;gap:6px;padding:6px;border:1px solid #294353;border-radius:9px;background:rgba(8,23,32,.94)}.map-actions span{padding:0 6px;color:#91a7b4;font-size:.62rem}.method-panel{display:flex;flex-direction:column;align-items:stretch;gap:12px;padding:18px;border-left:1px solid #1b303e}.method-panel h5{margin:0;color:#f4fbff;font-size:.8rem}.method-panel p{margin:0;color:#78909f;font-size:.68rem;line-height:1.55}.method-panel textarea{resize:vertical;font-family:monospace;font-size:.7rem}.file-button{display:grid;place-items:center;min-height:44px;border:1px dashed #2e5367;border-radius:9px;background:rgba(0,173,223,.06);color:#91e7f8;font-size:.7rem;font-weight:800;cursor:pointer}.file-button input{display:none}.route-message{margin:0;padding:10px 16px;border-top:1px solid #1b303e;color:#6f8795;font-size:.65rem}
.length-panel{display:flex;align-items:center;gap:18px;padding:14px 16px;border:1px solid #1b303e;border-radius:10px;background:#0a1b25}.length-panel>div{display:grid;min-width:160px}.length-panel>div span{color:#718a99;font-size:.65rem}.length-panel strong{margin-top:3px;color:#58e6b2;font-size:1.05rem}.length-panel>label:last-child{width:180px}.form-error{margin:0;padding:10px 12px;border:1px solid rgba(255,82,103,.28);border-radius:8px;background:rgba(255,82,103,.07);color:#ff8391;font-size:.7rem}.registration-actions{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px}.registration-actions button{min-height:41px;padding:0 16px;border-radius:9px;font-weight:800}.secondary-button{border:1px solid #294353;background:#10232f;color:#9ab0bc}.primary-action{border:0;background:#00addf;color:#00131c}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}
:deep(.route-point-wrapper){background:transparent;border:0}:deep(.route-point){display:grid;width:24px;height:24px;place-items:center;border:2px solid #dffaff;border-radius:50%;background:#00addf;color:#00131c;font-size:.62rem;font-weight:900;box-shadow:0 3px 10px rgba(0,0,0,.45)}
@media(max-width:900px){.details-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.route-workspace{grid-template-columns:1fr}.method-panel{border-top:1px solid #1b303e;border-left:0}.route-map{height:330px}}
@media(max-width:620px){.registration-backdrop{padding:0}.registration-modal{max-height:100vh;border-radius:0}.registration-body,.registration-header{padding:16px}.details-grid{grid-template-columns:1fr}.method-tabs{overflow-x:auto}.method-tabs button{white-space:nowrap}.route-heading,.length-panel{align-items:flex-start;flex-direction:column}.registration-actions{grid-template-columns:1fr 1fr}.registration-actions span{display:none}.registration-actions button{width:100%}}
</style>
