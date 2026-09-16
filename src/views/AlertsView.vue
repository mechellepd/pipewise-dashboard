<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import Topbar from '../components/Topbar.vue'
import { useAssetStore } from '../stores/assetStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useSensorStore } from '../stores/sensorStore'

const router = useRouter()
const alertStore = useNotificationStore()
const assetStore = useAssetStore()
const sensorStore = useSensorStore()

const searchQuery = ref('')
const severityFilter = ref('all')
const statusFilter = ref('open')
const categoryFilter = ref('all')
const selectedAlertId = ref(alertStore.notifications[0]?.id ?? '')
const isResolveModalOpen = ref(false)
const resolutionNote = ref('')

const categories = computed(() =>
  [...new Set(alertStore.notifications.map((alert) => alert.category))].sort(),
)

const filteredAlerts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const severityRank = { critical: 0, warning: 1, information: 2 }
  const statusRank = { active: 0, acknowledged: 1, resolved: 2 }

  return alertStore.notifications
    .filter((alert) => {
      const matchesSearch =
        !query ||
        [alert.id, alert.title, alert.message, alert.assetId, alert.sensorId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      const matchesSeverity =
        severityFilter.value === 'all' || alert.severity === severityFilter.value
      const matchesStatus =
        statusFilter.value === 'all' ||
        (statusFilter.value === 'open'
          ? alert.status !== 'resolved'
          : alert.status === statusFilter.value)
      const matchesCategory =
        categoryFilter.value === 'all' || alert.category === categoryFilter.value

      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory
    })
    .sort((first, second) =>
      statusRank[first.status] - statusRank[second.status] ||
      severityRank[first.severity] - severityRank[second.severity],
    )
})

const selectedAlert = computed(() =>
  alertStore.notifications.find((alert) => alert.id === selectedAlertId.value) ?? null,
)

const selectedSensor = computed(() =>
  selectedAlert.value?.sensorId
    ? sensorStore.getSensorById(selectedAlert.value.sensorId)
    : null,
)

const selectedAssetName = computed(() =>
  assetStore.pipelines.find((pipeline) => pipeline.id === selectedAlert.value?.assetId)?.name ??
  'Unassigned asset',
)

function selectAlert(alert) {
  selectedAlertId.value = alert.id
  alertStore.markAsRead(alert.id)
}

function viewOnMap(alert) {
  if (!alert?.assetId) return
  router.push({ name: 'network-map', query: { pipeline: alert.assetId } })
}

function acknowledgeSelectedAlert() {
  if (selectedAlert.value) {
    alertStore.acknowledgeAlert(selectedAlert.value.id)
  }
}

function openResolveModal() {
  resolutionNote.value = ''
  isResolveModalOpen.value = true
}

function closeResolveModal() {
  isResolveModalOpen.value = false
  resolutionNote.value = ''
}

function confirmResolution() {
  if (!selectedAlert.value) return

  const alert = selectedAlert.value
  alertStore.resolveAlert(alert.id, resolutionNote.value)

  if (alert.assetId) {
    assetStore.setAssetStatus(alert.assetId, 'normal')
  }

  if (selectedSensor.value) {
    sensorStore.updateSensor(selectedSensor.value.id, {
      pressure: Math.max(selectedSensor.value.pressure, 45),
      lastUpdated: 'Just now',
    }, true)
  }

  closeResolveModal()
}

function reopenSelectedAlert() {
  if (selectedAlert.value) {
    alertStore.reopenAlert(selectedAlert.value.id)
  }
}

function clearFilters() {
  searchQuery.value = ''
  severityFilter.value = 'all'
  statusFilter.value = 'open'
  categoryFilter.value = 'all'
}

function severitySymbol(severity) {
  return { critical: '!', warning: '▲', information: 'i' }[severity] ?? '•'
}
</script>

<template>
  <main class="main-content">
    <Topbar />

    <section class="page-content">
      <div class="page-heading">
        <div>
          <p class="eyebrow">INCIDENT MANAGEMENT</p>
          <h3>Alerts & Operational Response</h3>
          <p>Prioritise incidents, document operator actions and track resolution across the pipeline network.</p>
        </div>
        <button class="mark-read-button" type="button" :disabled="alertStore.unreadCount === 0" @click="alertStore.markAllAsRead">
          Mark all as read
        </button>
      </div>

      <section class="summary-grid">
        <article><span>Open incidents</span><strong>{{ alertStore.activeCount }}</strong><small>Active and acknowledged</small></article>
        <article class="critical"><span>Critical</span><strong>{{ alertStore.criticalActiveCount }}</strong><small>Immediate response required</small></article>
        <article class="acknowledged"><span>Acknowledged</span><strong>{{ alertStore.acknowledgedCount }}</strong><small>Under operator review</small></article>
        <article class="resolved"><span>Resolved</span><strong>{{ alertStore.resolvedCount }}</strong><small>Available in alert history</small></article>
      </section>

      <section class="alerts-workspace">
        <div class="alert-list-panel">
          <div class="filters">
            <label class="search-field"><span>Search alerts</span><input v-model="searchQuery" type="search" placeholder="Alert, pipeline or sensor ID" /></label>
            <label><span>Severity</span><select v-model="severityFilter"><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="information">Information</option></select></label>
            <label><span>Status</span><select v-model="statusFilter"><option value="open">Open incidents</option><option value="active">Active</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved history</option><option value="all">All statuses</option></select></label>
            <label><span>Category</span><select v-model="categoryFilter"><option value="all">All categories</option><option v-for="category in categories" :key="category">{{ category }}</option></select></label>
            <button class="clear-button" type="button" @click="clearFilters">Clear</button>
          </div>

          <div class="list-summary">{{ filteredAlerts.length }} matching alert<span v-if="filteredAlerts.length !== 1">s</span></div>

          <div class="alert-list">
            <button
              v-for="alert in filteredAlerts"
              :key="alert.id"
              class="alert-row"
              :class="[alert.severity, { selected: selectedAlertId === alert.id, unread: !alert.isRead }]"
              type="button"
              @click="selectAlert(alert)"
            >
              <span class="severity-icon" :class="alert.severity">{{ severitySymbol(alert.severity) }}</span>
              <span class="alert-row-content">
                <span class="alert-title-line"><strong>{{ alert.title }}</strong><i v-if="!alert.isRead"></i></span>
                <span class="alert-message">{{ alert.message }}</span>
                <span class="alert-meta"><b :class="alert.status">{{ alert.status }}</b><span>{{ alert.assetId }}</span><span v-if="alert.sensorId">{{ alert.sensorId }}</span><span>{{ alert.time }}</span></span>
              </span>
            </button>

            <div v-if="filteredAlerts.length === 0" class="empty-list">
              <strong>No matching alerts</strong><span>Adjust the filters to review other incidents.</span>
            </div>
          </div>
        </div>

        <aside class="detail-panel">
          <template v-if="selectedAlert">
            <header class="detail-header">
              <div><p class="eyebrow">{{ selectedAlert.id }}</p><h4>{{ selectedAlert.title }}</h4></div>
              <span class="severity-badge" :class="selectedAlert.severity">{{ selectedAlert.severity }}</span>
            </header>

            <div class="detail-content">
              <span class="status-banner" :class="selectedAlert.status">{{ selectedAlert.status }}</span>
              <p class="detail-message">{{ selectedAlert.message }}</p>

              <dl>
                <div><dt>Pipeline</dt><dd>{{ selectedAlert.assetId }} — {{ selectedAssetName }}</dd></div>
                <div><dt>Sensor</dt><dd>{{ selectedAlert.sensorId || 'Not sensor-generated' }}</dd></div>
                <div><dt>Category</dt><dd>{{ selectedAlert.category }}</dd></div>
                <div><dt>Created</dt><dd>{{ selectedAlert.createdAt }}</dd></div>
                <div><dt>Assigned team</dt><dd>{{ selectedAlert.assignedTo }}</dd></div>
              </dl>

              <section v-if="selectedSensor" class="telemetry-card">
                <div><span>Pressure</span><strong>{{ selectedSensor.pressure.toFixed(1) }} PSI</strong></div>
                <div><span>Flow</span><strong>{{ selectedSensor.flowRate }} L/min</strong></div>
                <div><span>Sensor status</span><strong :class="selectedSensor.status">{{ selectedSensor.status }}</strong></div>
              </section>

              <section v-if="selectedAlert.resolutionNote" class="resolution-card">
                <span>Resolution</span><p>{{ selectedAlert.resolutionNote }}</p><small>{{ selectedAlert.resolvedBy }} · {{ selectedAlert.resolvedAt }}</small>
              </section>

              <section class="timeline">
                <h5>Incident timeline</h5>
                <ol>
                  <li v-for="(entry, index) in selectedAlert.timeline" :key="`${entry.time}-${index}`"><time>{{ entry.time }}</time><span>{{ entry.event }}</span></li>
                </ol>
              </section>
            </div>

            <footer class="detail-actions">
              <button type="button" @click="viewOnMap(selectedAlert)">View on map</button>
              <button v-if="selectedAlert.status === 'active'" class="acknowledge-button" type="button" @click="acknowledgeSelectedAlert">Acknowledge</button>
              <button v-if="selectedAlert.status !== 'resolved'" class="resolve-button" type="button" @click="openResolveModal">Resolve alert</button>
              <button v-else class="reopen-button" type="button" @click="reopenSelectedAlert">Reopen alert</button>
            </footer>
          </template>

          <div v-else class="empty-detail"><span>◈</span><strong>Select an alert</strong><p>Choose an incident to review its telemetry and response history.</p></div>
        </aside>
      </section>
    </section>

    <Teleport to="body">
      <div v-if="isResolveModalOpen" class="modal-backdrop" @click.self="closeResolveModal">
        <section class="resolve-modal" role="dialog" aria-modal="true" aria-labelledby="resolve-title">
          <p class="eyebrow">INCIDENT CLOSURE</p>
          <h3 id="resolve-title">Resolve {{ selectedAlert?.id }}</h3>
          <p>Record the operator’s findings or corrective action before closing this incident.</p>
          <label><span>Resolution note</span><textarea v-model.trim="resolutionNote" rows="4" placeholder="Example: Field team inspected the section and isolated the faulty valve."></textarea></label>
          <div><button type="button" @click="closeResolveModal">Cancel</button><button class="resolve-button" type="button" @click="confirmResolution">Confirm resolution</button></div>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.main-content{width:calc(100% - 252px);min-width:0;margin-left:252px}.page-content{padding:26px 28px 40px}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:20px}.eyebrow{margin:0 0 6px;color:#4a829d;font-size:.63rem;font-weight:800;letter-spacing:.15em}.page-heading h3{margin:0;color:#f4fbff;font-size:1.35rem}.page-heading>div>p:last-child{max-width:720px;margin:8px 0 0;color:#78909f;font-size:.78rem;line-height:1.55}.mark-read-button,.clear-button{min-height:39px;padding:0 13px;border:1px solid #294353;border-radius:8px;background:#10232f;color:#8fdff2;font-size:.67rem;font-weight:800}.mark-read-button:disabled{opacity:.45}
.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}.summary-grid article{padding:17px;border:1px solid #1b303e;border-radius:12px;background:rgba(11,25,34,.96)}.summary-grid span,.summary-grid small{display:block}.summary-grid span{color:#8196a4;font-size:.68rem}.summary-grid strong{display:block;margin:6px 0 4px;color:#f4fbff;font-size:1.5rem}.summary-grid small{color:#607887;font-size:.62rem}.summary-grid .critical{border-color:rgba(255,82,103,.28)}.summary-grid .acknowledged{border-color:rgba(255,200,87,.24)}.summary-grid .resolved{border-color:rgba(32,219,155,.22)}
.alerts-workspace{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(360px,.65fr);min-height:620px;overflow:hidden;border:1px solid #1b303e;border-radius:13px;background:rgba(11,25,34,.96)}.alert-list-panel{min-width:0;border-right:1px solid #1b303e}.filters{display:grid;grid-template-columns:minmax(180px,1.5fr) repeat(3,minmax(120px,.75fr)) auto;gap:10px;align-items:end;padding:14px;border-bottom:1px solid #1b303e}.filters label{display:grid;gap:6px}.filters label span{color:#78909f;font-size:.61rem;font-weight:700}.filters input,.filters select{width:100%;min-height:39px;padding:8px 10px;border:1px solid #294353;border-radius:8px;background:#0c1d27;color:#e9f4fb}.list-summary{padding:10px 15px;border-bottom:1px solid #182c39;color:#607887;font-size:.63rem}.alert-list{max-height:640px;overflow-y:auto;padding:8px}.alert-row{display:flex;width:100%;gap:11px;margin-bottom:7px;padding:13px;border:1px solid #19303d;border-radius:10px;background:#0c1d27;color:inherit;text-align:left}.alert-row:hover,.alert-row.selected{border-color:#31566a;background:#102633}.alert-row.critical.unread{border-left:3px solid #ff5267}.alert-row.warning.unread{border-left:3px solid #ffc857}.severity-icon{display:grid;width:32px;height:32px;flex:0 0 32px;place-items:center;border-radius:8px;font-weight:900}.severity-icon.critical,.severity-badge.critical{background:rgba(255,82,103,.13);color:#ff7182}.severity-icon.warning,.severity-badge.warning{background:rgba(255,200,87,.12);color:#ffc857}.severity-icon.information,.severity-badge.information{background:rgba(0,194,255,.12);color:#61dffb}.alert-row-content{display:block;min-width:0;flex:1}.alert-title-line{display:flex;align-items:center;justify-content:space-between;gap:8px}.alert-title-line strong{overflow:hidden;color:#e9f4fb;font-size:.72rem;text-overflow:ellipsis;white-space:nowrap}.alert-title-line i{width:7px;height:7px;flex-shrink:0;border-radius:50%;background:#00c2ff}.alert-message{display:-webkit-box;margin-top:5px;overflow:hidden;color:#77909f;font-size:.64rem;line-height:1.4;-webkit-box-orient:vertical;-webkit-line-clamp:2}.alert-meta{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:8px;color:#526d7c;font-size:.58rem}.alert-meta b{font-weight:800;text-transform:capitalize}.alert-meta b.active{color:#ff7182}.alert-meta b.acknowledged{color:#ffc857}.alert-meta b.resolved{color:#4ce4af}.empty-list{display:grid;min-height:300px;place-items:center;align-content:center;gap:7px;color:#698191}.empty-list strong{color:#dcebf3}.empty-list span{font-size:.68rem}
.detail-panel{display:flex;min-width:0;flex-direction:column;background:#091821}.detail-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px;border-bottom:1px solid #1b303e}.detail-header h4{margin:0;color:#f4fbff;font-size:1rem}.severity-badge{padding:6px 9px;border-radius:999px;font-size:.58rem;font-weight:900;text-transform:uppercase}.detail-content{flex:1;padding:18px;overflow-y:auto}.status-banner{display:inline-flex;padding:6px 10px;border-radius:999px;font-size:.6rem;font-weight:900;text-transform:capitalize}.status-banner.active{background:rgba(255,82,103,.12);color:#ff7182}.status-banner.acknowledged{background:rgba(255,200,87,.11);color:#ffc857}.status-banner.resolved{background:rgba(32,219,155,.1);color:#4ce4af}.detail-message{margin:14px 0;color:#8ba0ac;font-size:.72rem;line-height:1.6}.detail-content dl{margin:0}.detail-content dl div{display:flex;justify-content:space-between;gap:15px;padding:10px 0;border-bottom:1px solid #182c39}.detail-content dt{color:#607887;font-size:.65rem}.detail-content dd{margin:0;color:#dcebf3;font-size:.67rem;font-weight:700;text-align:right}.telemetry-card{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.telemetry-card div{padding:11px;border:1px solid #1b303e;border-radius:8px;background:#0c1d27}.telemetry-card span{display:block;color:#607887;font-size:.58rem}.telemetry-card strong{display:block;margin-top:5px;color:#e9f4fb;font-size:.7rem;text-transform:capitalize}.telemetry-card strong.critical{color:#ff7182}.telemetry-card strong.warning{color:#ffc857}.telemetry-card strong.normal{color:#4ce4af}.resolution-card{margin-top:16px;padding:13px;border:1px solid rgba(32,219,155,.22);border-radius:9px;background:rgba(32,219,155,.05)}.resolution-card span{color:#4ce4af;font-size:.61rem;font-weight:800}.resolution-card p{margin:7px 0;color:#a8bbc5;font-size:.68rem;line-height:1.5}.resolution-card small{color:#607887;font-size:.58rem}.timeline{margin-top:18px}.timeline h5{margin:0 0 12px;color:#dcebf3;font-size:.72rem}.timeline ol{margin:0;padding:0;list-style:none}.timeline li{position:relative;display:grid;grid-template-columns:45px 1fr;gap:10px;padding:0 0 14px 12px;border-left:1px solid #284354}.timeline li::before{position:absolute;top:2px;left:-4px;width:7px;height:7px;border-radius:50%;background:#00addf;content:''}.timeline time{color:#4f6b7a;font-size:.58rem}.timeline li span{color:#8298a6;font-size:.64rem;line-height:1.4}.detail-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px;border-top:1px solid #1b303e}.detail-actions button{min-height:39px;border:1px solid #294353;border-radius:8px;background:#10232f;color:#8fdff2;font-size:.65rem;font-weight:800}.detail-actions .acknowledge-button{border-color:rgba(255,200,87,.3);color:#ffc857}.detail-actions .resolve-button{border-color:rgba(32,219,155,.3);color:#4ce4af}.detail-actions .reopen-button{border-color:rgba(255,200,87,.3);color:#ffc857}.empty-detail{display:grid;flex:1;place-items:center;align-content:center;padding:30px;text-align:center}.empty-detail span{font-size:1.5rem;color:#4a829d}.empty-detail strong{margin-top:10px;color:#dcebf3}.empty-detail p{max-width:260px;color:#607887;font-size:.68rem;line-height:1.5}
.modal-backdrop{position:fixed;inset:0;z-index:1300;display:grid;place-items:center;padding:20px;background:rgba(1,9,14,.78);backdrop-filter:blur(7px)}.resolve-modal{width:min(100%,520px);padding:24px;border:1px solid #294555;border-radius:15px;background:#091821}.resolve-modal h3{margin:0;color:#f4fbff}.resolve-modal>p:not(.eyebrow){color:#78909f;font-size:.72rem;line-height:1.55}.resolve-modal label{display:grid;gap:7px;margin:18px 0}.resolve-modal label span{color:#8fa6b4;font-size:.67rem;font-weight:700}.resolve-modal textarea{width:100%;padding:11px;border:1px solid #294353;border-radius:8px;background:#0c1d27;color:#e9f4fb;resize:vertical}.resolve-modal>div{display:flex;justify-content:flex-end;gap:9px}.resolve-modal button{min-height:40px;padding:0 14px;border:1px solid #294353;border-radius:8px;background:#10232f;color:#9ab0bc;font-weight:800}.resolve-modal .resolve-button{border:0;background:#20db9b;color:#032016}
button{cursor:pointer}@media(max-width:1180px){.alerts-workspace{grid-template-columns:1fr}.alert-list-panel{border-right:0;border-bottom:1px solid #1b303e}.filters{grid-template-columns:repeat(2,minmax(0,1fr))}.detail-panel{min-height:540px}}@media(max-width:820px){.main-content{width:calc(100% - 82px);margin-left:0}.page-content{padding-inline:16px}.summary-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:580px){.page-heading{align-items:flex-start;flex-direction:column}.summary-grid,.filters{grid-template-columns:1fr}.mark-read-button{width:100%}.telemetry-card{grid-template-columns:1fr}.detail-actions{grid-template-columns:1fr}}
</style>
