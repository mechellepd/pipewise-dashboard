<script setup>
import Topbar from '../components/Topbar.vue'
import PipelineMap from '../components/PipelineMap.vue'

defineProps({
  activeMenu: {
    type: String,
    required: true,
  },
})

const metrics = [
  {
    label: 'Network Status',
    value: 'Operational',
    detail: '98.7% system availability',
    icon: '✓',
    status: 'normal',
  },
  {
    label: 'Active Pipelines',
    value: '128',
    detail: '246.8 km monitored',
    icon: '⌁',
    status: 'normal',
  },
  {
    label: 'Active Sensors',
    value: '342',
    detail: '336 sensors online',
    icon: '◉',
    status: 'normal',
  },
  {
    label: 'Active Alerts',
    value: '3',
    detail: '1 critical, 2 warnings',
    icon: '!',
    status: 'critical',
  },
]

const alerts = [
  {
    title: 'Possible leak detected',
    location: 'Pipeline PL-023 · Gadong',
    time: '2 minutes ago',
    severity: 'Critical',
  },
  {
    title: 'Pressure below threshold',
    location: 'Pipeline PL-041 · Berakas',
    time: '14 minutes ago',
    severity: 'Warning',
  },
  {
    title: 'Sensor signal intermittent',
    location: 'Sensor SN-118 · Kiulap',
    time: '31 minutes ago',
    severity: 'Warning',
  },
]

const pipelineAssets = [
  {
    id: 'PL-023',
    location: 'Gadong',
    pressure: '21.8 PSI',
    flow: '832 L/min',
    status: 'Critical',
  },
  {
    id: 'PL-041',
    location: 'Berakas',
    pressure: '34.6 PSI',
    flow: '1,028 L/min',
    status: 'Warning',
  },
  {
    id: 'PL-018',
    location: 'Kiulap',
    pressure: '46.2 PSI',
    flow: '1,194 L/min',
    status: 'Normal',
  },
  {
    id: 'PL-065',
    location: 'Jerudong',
    pressure: '44.9 PSI',
    flow: '1,107 L/min',
    status: 'Normal',
  },
]
</script>

<template>
  <main class="main-content">
    <Topbar :active-menu="activeMenu" />

    <section class="dashboard-content">
      <div class="welcome-row">
        <div>
          <h3>Pipeline Network Overview</h3>

          <p>
            Monitor infrastructure conditions, telemetry and active
            incidents across the network.
          </p>
        </div>

        <div class="last-updated">
          Updated 03 Aug 2026 · 11:48 AM
        </div>
      </div>

      <section class="metrics-grid">
        <article
          v-for="metric in metrics"
          :key="metric.label"
          class="metric-card"
        >
          <div
            class="metric-icon"
            :class="metric.status"
          >
            {{ metric.icon }}
          </div>

          <div class="metric-information">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small>{{ metric.detail }}</small>
          </div>
        </article>
      </section>

      <section class="dashboard-grid">
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

          <div class="map-placeholder">
            <div class="map-grid"></div>

            <div class="pipeline pipeline-one"></div>
            <div class="pipeline pipeline-two warning-line"></div>
            <div class="pipeline pipeline-three"></div>
            <div class="pipeline pipeline-four critical-line"></div>

            <button
              class="map-marker marker-one"
              type="button"
              aria-label="Normal pipeline sensor"
            ></button>

            <button
              class="map-marker marker-two"
              type="button"
              aria-label="Normal pipeline sensor"
            ></button>

            <button
              class="map-marker marker-three warning"
              type="button"
              aria-label="Warning pipeline sensor"
            ></button>

            <button
              class="map-marker marker-four critical"
              type="button"
              aria-label="Critical pipeline sensor"
            ></button>

            <div class="leak-popup">
              <span class="popup-label">CRITICAL ALERT</span>
              <strong>Possible pipeline leak</strong>
              <p>PL-023 · Gadong</p>

              <div class="popup-reading">
                Pressure:
                <b>21.8 PSI</b>
              </div>

              <button type="button">
                View incident
              </button>
            </div>

            <div class="map-controls">
              <button type="button">+</button>
              <button type="button">−</button>
            </div>

            <div class="map-caption">
              GIS map will be integrated using Leaflet
            </div>
          </div>
        </article>

        <article class="panel alert-panel">
          <div class="panel-header">
            <div>
              <h4>Active Alerts</h4>
              <p>Incidents requiring attention</p>
            </div>

            <button
              class="text-button"
              type="button"
            >
              View all
            </button>
          </div>

          <div class="alert-list">
            <div
              v-for="alert in alerts"
              :key="`${alert.title}-${alert.location}`"
              class="alert-item"
              :class="alert.severity.toLowerCase()"
            >
              <div class="alert-symbol">!</div>

              <div class="alert-information">
                <div class="alert-title-row">
                  <strong>{{ alert.title }}</strong>

                  <span
                    class="severity-badge"
                    :class="alert.severity.toLowerCase()"
                  >
                    {{ alert.severity }}
                  </span>
                </div>

                <p>{{ alert.location }}</p>
                <small>{{ alert.time }}</small>
              </div>
            </div>
          </div>

          <button
            class="secondary-button"
            type="button"
          >
            Open incident centre
          </button>
        </article>

        <article class="panel chart-panel">
          <div class="panel-header">
            <div>
              <h4>Network Pressure</h4>
              <p>Average pressure over the past 24 hours</p>
            </div>

            <select aria-label="Select chart period">
              <option>Last 24 hours</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>

          <div class="chart-placeholder">
            <div class="chart-y-labels">
              <span>60</span>
              <span>45</span>
              <span>30</span>
              <span>15</span>
              <span>0</span>
            </div>

            <div class="chart-area">
              <div class="chart-horizontal-lines"></div>

              <svg
                viewBox="0 0 800 220"
                preserveAspectRatio="none"
                aria-label="Sample network pressure chart"
              >
                <defs>
                  <linearGradient
                    id="chartFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stop-color="#00c2ff"
                      stop-opacity="0.34"
                    />

                    <stop
                      offset="100%"
                      stop-color="#00c2ff"
                      stop-opacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  class="chart-fill"
                  d="M0,80 C80,70 110,95 180,82 C260,68 300,78 360,74 C430,68 470,110 520,124 C585,143 610,82 670,90 C730,98 760,72 800,76 L800,220 L0,220 Z"
                />

                <path
                  class="chart-line"
                  d="M0,80 C80,70 110,95 180,82 C260,68 300,78 360,74 C430,68 470,110 520,124 C585,143 610,82 670,90 C730,98 760,72 800,76"
                />

                <circle
                  cx="520"
                  cy="124"
                  r="7"
                  class="chart-alert-point"
                />
              </svg>

              <div class="chart-alert-label">
                Pressure anomaly
              </div>

              <div class="chart-x-labels">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>24:00</span>
              </div>
            </div>
          </div>
        </article>

        <article class="panel asset-panel">
          <div class="panel-header">
            <div>
              <h4>Pipeline Assets</h4>
              <p>Latest readings by network segment</p>
            </div>

            <button
              class="text-button"
              type="button"
            >
              View assets
            </button>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Location</th>
                  <th>Pressure</th>
                  <th>Flow Rate</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="asset in pipelineAssets"
                  :key="asset.id"
                >
                  <td>
                    <strong>{{ asset.id }}</strong>
                  </td>

                  <td>{{ asset.location }}</td>
                  <td>{{ asset.pressure }}</td>
                  <td>{{ asset.flow }}</td>

                  <td>
                    <span
                      class="status-badge"
                      :class="asset.status.toLowerCase()"
                    >
                      {{ asset.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.main-content {
  width: calc(100% - 252px);
  min-width: 0;
  margin-left: 252px;
}

.dashboard-content {
  padding: 26px 28px 40px;
}

.welcome-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 21px;
}

.welcome-row h3 {
  margin: 0 0 7px;
  font-size: 1.25rem;
}

.welcome-row p {
  margin: 0;
  color: #78909f;
  font-size: 0.82rem;
}

.last-updated {
  flex-shrink: 0;
  color: #577080;
  font-size: 0.7rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  min-height: 118px;
  padding: 18px;
  border: 1px solid #1b303e;
  border-radius: 13px;
  background:
    linear-gradient(
      145deg,
      rgba(16, 34, 45, 0.96),
      rgba(10, 23, 32, 0.96)
    );
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.13);
}

.metric-icon {
  display: grid;
  flex: 0 0 43px;
  width: 43px;
  height: 43px;
  place-items: center;
  border-radius: 11px;
  font-weight: 800;
}

.metric-icon.normal {
  background: rgba(0, 194, 255, 0.11);
  color: #59dcff;
}

.metric-icon.critical {
  background: rgba(255, 82, 103, 0.12);
  color: #ff7182;
}

.metric-information {
  min-width: 0;
}

.metric-information span {
  display: block;
  margin-bottom: 5px;
  color: #8196a4;
  font-size: 0.72rem;
}

.metric-information strong {
  display: block;
  overflow: hidden;
  color: #f4fbff;
  font-size: 1.42rem;
  text-overflow: ellipsis;
}

.metric-information small {
  display: block;
  margin-top: 5px;
  color: #607887;
  font-size: 0.67rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(310px, 0.75fr);
  gap: 16px;
}

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

.map-placeholder {
  position: relative;
  min-height: 395px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 72% 45%,
      rgba(0, 194, 255, 0.13),
      transparent 18rem
    ),
    #08151e;
}

.map-grid {
  position: absolute;
  inset: 0;
  opacity: 0.42;
  background-image:
    linear-gradient(
      rgba(35, 71, 91, 0.24) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(35, 71, 91, 0.24) 1px,
      transparent 1px
    );
  background-size: 42px 42px;
  transform: rotate(-8deg) scale(1.15);
}

.pipeline {
  position: absolute;
  height: 4px;
  border-radius: 999px;
  background: #00bde9;
  box-shadow: 0 0 13px rgba(0, 189, 233, 0.47);
  transform-origin: left center;
}

.pipeline::after {
  content: "";
  position: absolute;
  inset: 1px 0;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0 18px,
      rgba(255, 255, 255, 0.75) 18px 22px,
      transparent 22px 35px
    );
  animation: pipeline-flow 2.7s linear infinite;
}

.pipeline-one {
  top: 43%;
  left: 6%;
  width: 49%;
  transform: rotate(6deg);
}

.pipeline-two {
  top: 61%;
  left: 23%;
  width: 40%;
  transform: rotate(-23deg);
}

.pipeline-three {
  top: 30%;
  left: 49%;
  width: 42%;
  transform: rotate(19deg);
}

.pipeline-four {
  top: 66%;
  left: 53%;
  width: 33%;
  transform: rotate(-8deg);
}

.warning-line {
  background: #ffc857;
  box-shadow: 0 0 13px rgba(255, 200, 87, 0.45);
}

.critical-line {
  background: #ff5267;
  box-shadow: 0 0 15px rgba(255, 82, 103, 0.55);
}

.map-marker {
  position: absolute;
  z-index: 3;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 4px solid #092632;
  border-radius: 50%;
  background: #20db9b;
  box-shadow:
    0 0 0 5px rgba(32, 219, 155, 0.16),
    0 0 18px rgba(32, 219, 155, 0.6);
}

.marker-one {
  top: 43%;
  left: 29%;
}

.marker-two {
  top: 36%;
  left: 64%;
}

.marker-three {
  top: 52%;
  left: 43%;
}

.marker-four {
  top: 59%;
  left: 70%;
}

.map-marker.warning {
  background: #ffc857;
  box-shadow:
    0 0 0 5px rgba(255, 200, 87, 0.16),
    0 0 18px rgba(255, 200, 87, 0.6);
}

.map-marker.critical {
  background: #ff5267;
  box-shadow:
    0 0 0 7px rgba(255, 82, 103, 0.17),
    0 0 22px rgba(255, 82, 103, 0.75);
  animation: alert-pulse 1.6s ease-in-out infinite;
}

.leak-popup {
  position: absolute;
  z-index: 5;
  top: 30%;
  right: 7%;
  width: 205px;
  padding: 14px;
  border: 1px solid rgba(255, 82, 103, 0.42);
  border-radius: 11px;
  background: rgba(8, 20, 29, 0.96);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.35);
}

.popup-label {
  display: inline-block;
  margin-bottom: 8px;
  color: #ff6b7d;
  font-size: 0.57rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.leak-popup strong {
  display: block;
  font-size: 0.79rem;
}

.leak-popup p {
  margin: 5px 0 10px;
  color: #718a99;
  font-size: 0.67rem;
}

.popup-reading {
  padding: 8px;
  border-radius: 7px;
  background: #0c1c26;
  color: #7e96a5;
  font-size: 0.66rem;
}

.popup-reading b {
  float: right;
  color: #ff7182;
}

.leak-popup button {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  border: 0;
  border-radius: 7px;
  background: #ff5267;
  color: #ffffff;
  font-size: 0.67rem;
  font-weight: 800;
}

.map-controls {
  position: absolute;
  z-index: 5;
  bottom: 20px;
  left: 18px;
  display: flex;
  flex-direction: column;
}

.map-controls button {
  width: 32px;
  height: 30px;
  border: 1px solid #284354;
  background: #0b1c26;
  color: #dff7ff;
}

.map-controls button:first-child {
  border-radius: 7px 7px 0 0;
}

.map-controls button:last-child {
  border-radius: 0 0 7px 7px;
}

.map-caption {
  position: absolute;
  right: 16px;
  bottom: 14px;
  color: #3f5e70;
  font-size: 0.62rem;
}

.alert-list {
  padding: 9px 14px 5px;
}

.alert-item {
  display: flex;
  gap: 11px;
  padding: 14px 4px;
  border-bottom: 1px solid #182c39;
}

.alert-symbol {
  display: grid;
  flex: 0 0 31px;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 8px;
  font-weight: 900;
}

.alert-item.critical .alert-symbol {
  background: rgba(255, 82, 103, 0.13);
  color: #ff7182;
}

.alert-item.warning .alert-symbol {
  background: rgba(255, 200, 87, 0.12);
  color: #ffc857;
}

.alert-information {
  min-width: 0;
  flex: 1;
}

.alert-title-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 8px;
}

.alert-title-row strong {
  overflow: hidden;
  font-size: 0.73rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-information p {
  margin: 5px 0 4px;
  color: #718a99;
  font-size: 0.65rem;
}

.alert-information small {
  color: #4d6676;
  font-size: 0.61rem;
}

.severity-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 800;
}

.severity-badge {
  flex-shrink: 0;
  padding: 4px 7px;
}

.severity-badge.critical,
.status-badge.critical {
  background: rgba(255, 82, 103, 0.13);
  color: #ff7182;
}

.severity-badge.warning,
.status-badge.warning {
  background: rgba(255, 200, 87, 0.12);
  color: #ffc857;
}

.status-badge.normal {
  background: rgba(32, 219, 155, 0.11);
  color: #4ce4af;
}

.text-button {
  border: 0;
  background: transparent;
  color: #45d5f7;
  font-size: 0.68rem;
}

.secondary-button {
  width: calc(100% - 28px);
  margin: 10px 14px 16px;
  padding: 11px;
  border: 1px solid #214052;
  border-radius: 8px;
  background: #10232f;
  color: #87dff2;
  font-size: 0.69rem;
  font-weight: 800;
}

.chart-panel {
  min-height: 342px;
}

.panel-header select {
  padding: 8px 10px;
  border: 1px solid #243e4e;
  border-radius: 7px;
  outline: none;
  background: #0b1b25;
  color: #8197a5;
  font-size: 0.66rem;
}

.chart-placeholder {
  display: flex;
  min-height: 270px;
  padding: 23px 20px 15px;
}

.chart-y-labels {
  display: flex;
  width: 28px;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 23px;
  color: #4f6878;
  font-size: 0.58rem;
}

.chart-area {
  position: relative;
  min-width: 0;
  flex: 1;
}

.chart-horizontal-lines {
  position: absolute;
  inset: 0 0 22px;
  background-image:
    linear-gradient(
      rgba(44, 73, 91, 0.34) 1px,
      transparent 1px
    );
  background-size: 100% 25%;
}

.chart-area svg {
  position: absolute;
  inset: 0 0 22px;
  width: 100%;
  height: calc(100% - 22px);
  overflow: visible;
}

.chart-line {
  fill: none;
  stroke: #00c2ff;
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(
    0 0 7px rgba(0, 194, 255, 0.55)
  );
}

.chart-fill {
  fill: url("#chartFill");
}

.chart-alert-point {
  fill: #ff5267;
  stroke: rgba(255, 255, 255, 0.85);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.chart-alert-label {
  position: absolute;
  top: 58%;
  left: 61%;
  padding: 5px 7px;
  border: 1px solid rgba(255, 82, 103, 0.32);
  border-radius: 5px;
  background: #111e27;
  color: #ff7182;
  font-size: 0.56rem;
}

.chart-x-labels {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  color: #4f6878;
  font-size: 0.58rem;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.68rem;
}

th,
td {
  padding: 13px 16px;
  border-bottom: 1px solid #182c39;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #577181;
  font-size: 0.59rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

td {
  color: #8298a6;
}

td strong {
  color: #dcebf3;
}

.status-badge {
  min-width: 61px;
  padding: 5px 8px;
}

@keyframes pipeline-flow {
  from {
    transform: translateX(-35px);
  }

  to {
    transform: translateX(0);
  }
}

@keyframes alert-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.18);
  }
}

@media (max-width: 1180px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .main-content {
    width: calc(100% - 82px);
    margin-left: 0;
  }

  .dashboard-content {
    padding-inline: 16px;
  }

  .welcome-row {
    align-items: flex-start;
  }

  .last-updated {
    display: none;
  }
}

@media (max-width: 580px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-content {
    padding-top: 18px;
  }

  .map-legend {
    display: none;
  }

  .leak-popup {
    right: 4%;
    width: 178px;
  }

  .panel-header {
    align-items: flex-start;
  }
}
</style>