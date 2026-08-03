<script setup>
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { pipelines } from '../data/pipelines'
import { sensors } from '../data/sensors'

const props = defineProps({
  focusPipelineId: {
    type: String,
    default: null,
  },

  expanded: {
    type: Boolean,
    default: false,
  },
})

const mapContainer = ref(null)

let map = null
let pipelineLayer = null
let sensorLayer = null
const pipelinePolylines = new Map()


const statusColours = {
  normal: '#20db9b',
  warning: '#ffc857',
  critical: '#ff5267',
}

function createSensorIcon(status) {
  const colour = statusColours[status] ?? statusColours.normal

  return L.divIcon({
    className: 'pipewise-sensor-wrapper',
    html: `
      <span
        class="pipewise-sensor pipewise-sensor--${status}"
        style="
          --sensor-colour: ${colour};
          --sensor-glow: ${colour}55;
        "
      ></span>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  })
}

function createPipelinePopup(pipeline) {
  return `
    <div class="pipewise-popup">
      <span class="pipewise-popup__label">
        ${pipeline.status.toUpperCase()}
      </span>

      <strong>${pipeline.name}</strong>

      <dl>
        <div>
          <dt>Pipeline ID</dt>
          <dd>${pipeline.id}</dd>
        </div>

        <div>
          <dt>Material</dt>
          <dd>${pipeline.material}</dd>
        </div>

        <div>
          <dt>Diameter</dt>
          <dd>${pipeline.diameter} mm</dd>
        </div>

        <div>
          <dt>Installed</dt>
          <dd>${pipeline.installationYear}</dd>
        </div>

        <div>
          <dt>Length</dt>
          <dd>${pipeline.lengthKm} km</dd>
        </div>

        <div>
          <dt>Status</dt>
          <dd>${pipeline.status}</dd>
        </div>
      </dl>
    </div>
  `
}

function createSensorPopup(sensor) {
  return `
    <div class="pipewise-popup">
      <span class="pipewise-popup__label">
        ${sensor.status.toUpperCase()}
      </span>

      <strong>${sensor.type}</strong>

      <dl>
        <div>
          <dt>Sensor ID</dt>
          <dd>${sensor.id}</dd>
        </div>

        <div>
          <dt>Pipeline</dt>
          <dd>${sensor.pipelineId}</dd>
        </div>

        <div>
          <dt>Pressure</dt>
          <dd>${sensor.pressure} PSI</dd>
        </div>

        <div>
          <dt>Flow rate</dt>
          <dd>${sensor.flowRate.toLocaleString()} L/min</dd>
        </div>

        <div>
          <dt>Battery</dt>
          <dd>${sensor.batteryLevel}%</dd>
        </div>

        <div>
          <dt>Last update</dt>
          <dd>${sensor.lastUpdated}</dd>
        </div>
      </dl>
    </div>
  `
}
function resetPipelineStyles() {
  pipelinePolylines.forEach(({ pipeline, polyline }) => {
    const colour =
      statusColours[pipeline.status] ?? statusColours.normal

    polyline.setStyle({
      color: colour,
      weight: pipeline.status === 'critical' ? 6 : 4,
      opacity: 0.95,
    })
  })
}

function focusPipeline(pipelineId) {
  if (!map || !pipelineId) {
    return
  }

  const target = pipelinePolylines.get(pipelineId)

  if (!target) {
    console.warn(`Pipeline ${pipelineId} was not found.`)
    return
  }

  resetPipelineStyles()

  target.polyline.setStyle({
    color: '#61e4ff',
    weight: 9,
    opacity: 1,
  })

  target.polyline.bringToFront()

  map.flyToBounds(target.polyline.getBounds(), {
    padding: [70, 70],
    duration: 1,
    maxZoom: 16,
  })

  window.setTimeout(() => {
    target.polyline.openPopup()
  }, 850)
}

function initialiseMap() {
  if (!mapContainer.value || map) {
    return
  }

  map = L.map(mapContainer.value, {
    center: [4.915, 114.945],
    zoom: 13,
    zoomControl: false,
    attributionControl: true,
  })

  L.control
    .zoom({
      position: 'bottomleft',
    })
    .addTo(map)

  /*
   * BASEMAPS
   */

  const darkMap = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      maxZoom: 20,
      attribution:
        '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  )

  const streetMap = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; OpenStreetMap contributors',
    },
  )

  const lightMap = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      maxZoom: 20,
      attribution:
        '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  )

  const satelliteMap = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/' +
      'World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution:
        'Tiles &copy; Esri and imagery providers',
    },
  )

  darkMap.addTo(map)

  /*
   * OVERLAY LAYERS
   */

  pipelineLayer = L.layerGroup().addTo(map)
  sensorLayer = L.layerGroup().addTo(map)

  const baseMaps = {
    'Dark Map': darkMap,
    'Street Map': streetMap,
    'Light Map': lightMap,
    'Satellite Imagery': satelliteMap,
  }

  const overlays = {
    Pipelines: pipelineLayer,
    Sensors: sensorLayer,
  }

  L.control
    .layers(baseMaps, overlays, {
      position: 'topright',
      collapsed: true,
    })
    .addTo(map)

  /*
   * DRAW PIPELINES
   */

  pipelines.forEach((pipeline) => {
  const colour =
    statusColours[pipeline.status] ?? statusColours.normal

  const polyline = L.polyline(pipeline.coordinates, {
    color: colour,
    weight: pipeline.status === 'critical' ? 6 : 4,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
  })
    .bindPopup(createPipelinePopup(pipeline))
    .addTo(pipelineLayer)

  pipelinePolylines.set(pipeline.id, {
    pipeline,
    polyline,
  })
})

  /*
   * DRAW SENSORS
   */

  sensors.forEach((sensor) => {
    L.marker(sensor.position, {
      icon: createSensorIcon(sensor.status),
    })
      .bindPopup(createSensorPopup(sensor))
      .addTo(sensorLayer)
  })

  /*
   * FIT MAP TO NETWORK
   */

  const allCoordinates = pipelines.flatMap(
    (pipeline) => pipeline.coordinates,
  )

  map.fitBounds(allCoordinates, {
    padding: [35, 35],
  })

  window.setTimeout(() => {
  map?.invalidateSize()

  if (props.focusPipelineId) {
    focusPipeline(props.focusPipelineId)
  }
}, 150)
}

onMounted(() => {
  initialiseMap()
})

watch(
  () => props.focusPipelineId,
  async (pipelineId) => {
    if (!pipelineId) {
      resetPipelineStyles()
      return
    }

    await nextTick()
    focusPipeline(pipelineId)
  },
)

onBeforeUnmount(() => {
  map?.remove()

  pipelinePolylines.clear()

  map = null
  pipelineLayer = null
  sensorLayer = null
})
</script>

<template>
  <article class="panel map-panel">
    <div class="panel-header">
      <div>
        <h4>Pipeline Network Map</h4>
        <p>Real-time infrastructure and sensor status</p>
      </div>

      <div class="map-legend">
        <span>
          <i class="legend-dot normal"></i>
          Normal
        </span>

        <span>
          <i class="legend-dot warning"></i>
          Warning
        </span>

        <span>
          <i class="legend-dot critical"></i>
          Critical
        </span>
      </div>
    </div>

<div
  ref="mapContainer"
  class="pipeline-map"
  :class="{ expanded }"
  aria-label="Interactive pipeline monitoring map"
></div>
  </article>
</template>

<style scoped>
.panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #1b303e;
  border-radius: 13px;
  background: rgba(11, 25, 34, 0.96);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.13);
}

.panel-header {
  display: flex;
  min-height: 71px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
  border-bottom: 1px solid #1b303e;
}

.panel-header h4 {
  margin: 0 0 4px;
  font-size: 0.91rem;
}

.panel-header p {
  margin: 0;
  color: #68808f;
  font-size: 0.68rem;
}

.map-legend {
  display: flex;
  gap: 12px;
  color: #708897;
  font-size: 0.64rem;
}

.map-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-dot.normal {
  background: #20db9b;
}

.legend-dot.warning {
  background: #ffc857;
}

.legend-dot.critical {
  background: #ff5267;
}

.pipeline-map {
  width: 100%;
  height: 395px;
  background: #08151e;
}

.pipeline-map.expanded {
  height: calc(100vh - 245px);
  min-height: 540px;
}

/*
 * LEAFLET BASE STYLING
 */

:deep(.leaflet-container) {
  background: #08151e;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    sans-serif;
}

/*
 * ZOOM CONTROL
 */

:deep(.leaflet-control-zoom) {
  overflow: hidden;
  border: 1px solid #284354;
  border-radius: 8px;
  box-shadow: none;
}

:deep(.leaflet-control-zoom a) {
  border-bottom-color: #284354;
  background: #0b1c26;
  color: #dff7ff;
}

:deep(.leaflet-control-zoom a:hover) {
  background: #142b38;
  color: #61e4ff;
}

/*
 * BASEMAP AND LAYER CONTROL
 */

:deep(.leaflet-control-layers) {
  overflow: hidden;
  border: 1px solid #284354;
  border-radius: 9px;
  background: rgba(8, 20, 29, 0.96);
  color: #dff7ff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.32);
}

:deep(.leaflet-control-layers-toggle) {
  width: 38px;
  height: 38px;
  background-color: #0b1c26;
  opacity: 0.85;
}

:deep(.leaflet-control-layers-expanded) {
  padding: 12px 14px;
}

:deep(.leaflet-control-layers-base),
:deep(.leaflet-control-layers-overlays) {
  font-size: 0.68rem;
}

:deep(.leaflet-control-layers label) {
  margin: 6px 0;
  color: #a8bdc9;
}

:deep(.leaflet-control-layers-selector) {
  margin-right: 6px;
}

:deep(.leaflet-control-layers-separator) {
  border-top-color: #284354;
}

/*
 * ATTRIBUTION
 */

:deep(.leaflet-control-attribution) {
  background: rgba(7, 16, 25, 0.76);
  color: #597486;
  font-size: 0.55rem;
}

:deep(.leaflet-control-attribution a) {
  color: #61bad3;
}

/*
 * SENSOR MARKERS
 */

:deep(.pipewise-sensor-wrapper) {
  border: 0;
  background: transparent;
}

:deep(.pipewise-sensor) {
  display: block;
  width: 18px;
  height: 18px;
  border: 4px solid #092632;
  border-radius: 50%;
  background: var(--sensor-colour);
  box-shadow:
    0 0 0 6px var(--sensor-glow),
    0 0 18px var(--sensor-colour);
}

:deep(.pipewise-sensor--critical) {
  animation: sensor-pulse 1.5s ease-in-out infinite;
}

/*
 * POPUPS
 */

:deep(.leaflet-popup-content-wrapper),
:deep(.leaflet-popup-tip) {
  border: 1px solid #294555;
  background: rgba(8, 20, 29, 0.98);
  color: #e9f4fb;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.4);
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 10px;
}

:deep(.leaflet-popup-content) {
  width: 205px;
  margin: 14px;
}

:deep(.leaflet-popup-close-button) {
  color: #708897;
}

:deep(.leaflet-popup-close-button:hover) {
  color: #ffffff;
}

:deep(.pipewise-popup__label) {
  display: block;
  margin-bottom: 7px;
  color: #ff7182;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.1em;
}

:deep(.pipewise-popup strong) {
  display: block;
  margin-bottom: 10px;
  font-size: 0.8rem;
}

:deep(.pipewise-popup dl) {
  margin: 0;
}

:deep(.pipewise-popup dl div) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #172d39;
  font-size: 0.65rem;
}

:deep(.pipewise-popup dl div:last-child) {
  border-bottom: 0;
}

:deep(.pipewise-popup dt) {
  color: #718a99;
}

:deep(.pipewise-popup dd) {
  margin: 0;
  color: #dff7ff;
  font-weight: 700;
  text-transform: capitalize;
}

@keyframes sensor-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }
}

@media (max-width: 580px) {
  .map-legend {
    display: none;
  }

  .pipeline-map {
    height: 360px;
  }

  .pipeline-map.expanded {
  height: 520px;
  min-height: 520px;
}
}
</style>