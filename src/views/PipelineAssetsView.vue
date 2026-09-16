<script setup>
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'

import Topbar from '../components/Topbar.vue'
import { useAssetStore } from '../stores/assetStore'
import { useRouter } from 'vue-router'

const searchQuery = ref('')
const statusFilter = ref('all')
const materialFilter = ref('all')
const sortKey = ref('id')
const sortDirection = ref('asc')
const selectedAsset = ref(null)
const editingAssetId = ref('')
const editError = ref('')
const assetPendingDeletion = ref(null)
const router = useRouter()
const assetStore = useAssetStore()
const { pipelines } = storeToRefs(assetStore)

const editForm = reactive({
  id: '',
  name: '',
  material: '',
  diameter: '',
  installationYear: '',
  lengthKm: '',
  latitude: '',
  longitude: '',
})

const materials = computed(() => {
  return [...new Set(pipelines.value.map((pipeline) => pipeline.material))]
    .sort()
})

const filteredAssets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  const result = pipelines.value.filter((pipeline) => {
    const matchesSearch =
      !query ||
      pipeline.id.toLowerCase().includes(query) ||
      pipeline.name.toLowerCase().includes(query) ||
      pipeline.material.toLowerCase().includes(query)

    const matchesStatus =
      statusFilter.value === 'all' ||
      pipeline.status === statusFilter.value

    const matchesMaterial =
      materialFilter.value === 'all' ||
      pipeline.material === materialFilter.value

    return matchesSearch && matchesStatus && matchesMaterial
  })

  return [...result].sort((first, second) => {
    const firstValue = first[sortKey.value]
    const secondValue = second[sortKey.value]

    if (typeof firstValue === 'number') {
      return sortDirection.value === 'asc'
        ? firstValue - secondValue
        : secondValue - firstValue
    }

    return sortDirection.value === 'asc'
      ? String(firstValue).localeCompare(String(secondValue))
      : String(secondValue).localeCompare(String(firstValue))
  })
})

const summary = computed(() => {
  return {
    total: pipelines.value.length,
    normal: pipelines.value.filter(
      (pipeline) => pipeline.status === 'normal',
    ).length,
    warning: pipelines.value.filter(
      (pipeline) => pipeline.status === 'warning',
    ).length,
    critical: pipelines.value.filter(
      (pipeline) => pipeline.status === 'critical',
    ).length,
  }
})

function viewAssetOnMap() {
  if (!selectedAsset.value) {
    return
  }

  router.push({
    name: 'network-map',
    query: {
      pipeline: selectedAsset.value.id,
    },
  })
}

function manageAssetSensors() {
  if (!selectedAsset.value) return

  router.push({
    name: 'sensor-network',
    query: { pipeline: selectedAsset.value.id },
  })
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortDirection.value =
      sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = 'asc'
}

function sortIndicator(key) {
  if (sortKey.value !== key) {
    return ''
  }

  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function openAsset(asset) {
  selectedAsset.value = asset
}

function closeAsset() {
  selectedAsset.value = null
}

function openEditAsset(asset) {
  editingAssetId.value = asset.id
  editError.value = ''
  editForm.id = asset.id
  editForm.name = asset.name
  editForm.material = asset.material
  editForm.diameter = asset.diameter
  editForm.installationYear = asset.installationYear
  editForm.lengthKm = asset.lengthKm
  editForm.latitude = asset.coordinates[0]?.[0] ?? 4.9031
  editForm.longitude = asset.coordinates[0]?.[1] ?? 114.9398
}

function closeEditAsset() {
  editingAssetId.value = ''
  editError.value = ''
}

function saveAssetChanges() {
  if (assetStore.assetIdExists(editForm.id, editingAssetId.value)) {
    editError.value = 'That Asset ID is already registered.'
    return
  }

  const latitude = Number(editForm.latitude)
  const longitude = Number(editForm.longitude)
  const lengthKm = Number(editForm.lengthKm)
  const longitudeOffset = Math.max(lengthKm / 111, 0.004)

  const updatedAsset = assetStore.updateAsset(editingAssetId.value, {
    id: editForm.id,
    name: editForm.name,
    material: editForm.material,
    diameter: Number(editForm.diameter),
    installationYear: Number(editForm.installationYear),
    lengthKm,
    coordinates: [
      [latitude, longitude],
      [latitude, longitude + longitudeOffset],
    ],
  })

  if (selectedAsset.value?.id === editingAssetId.value) {
    selectedAsset.value = updatedAsset
  }

  closeEditAsset()
}

function requestDeleteAsset(asset) {
  assetPendingDeletion.value = asset
}

function cancelDeleteAsset() {
  assetPendingDeletion.value = null
}

function confirmDeleteAsset() {
  const asset = assetPendingDeletion.value

  if (!asset) {
    return
  }

  assetStore.deleteAsset(asset.id)

  if (selectedAsset.value?.id === asset.id) {
    closeAsset()
  }

  cancelDeleteAsset()
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  materialFilter.value = 'all'
}

function exportView() {
  window.print()
}
</script>

<template>
  <main class="main-content">
    <Topbar />

    <section class="page-content">
      <div class="page-heading">
        <div>
          <p class="eyebrow">ASSET MANAGEMENT</p>
          <h3>Pipeline Asset Registry</h3>

          <p class="page-description">
            Review pipeline specifications, operating condition and
            lifecycle information across the monitored network.
          </p>
        </div>

<button
  class="export-button"
  type="button"
  @click="exportView"
>
  Export view
</button>
      </div>

      <section class="summary-grid">
        <article class="summary-card">
          <span>Total pipelines</span>
          <strong>{{ summary.total }}</strong>
          <small>Registered infrastructure assets</small>
        </article>

        <article class="summary-card normal">
          <span>Normal</span>
          <strong>{{ summary.normal }}</strong>
          <small>Operating within expected range</small>
        </article>

        <article class="summary-card warning">
          <span>Warning</span>
          <strong>{{ summary.warning }}</strong>
          <small>Requires operational review</small>
        </article>

        <article class="summary-card critical">
          <span>Critical</span>
          <strong>{{ summary.critical }}</strong>
          <small>Requires immediate attention</small>
        </article>
      </section>

      <article class="registry-panel">
        <div class="toolbar">
          <label class="search-field">
            <span>Search assets</span>

            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search by ID, name or material"
            />
          </label>

          <label>
            <span>Status</span>

            <select v-model="statusFilter">
              <option value="all">All statuses</option>
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label>
            <span>Material</span>

            <select v-model="materialFilter">
              <option value="all">All materials</option>

              <option
                v-for="material in materials"
                :key="material"
                :value="material"
              >
                {{ material }}
              </option>
            </select>
          </label>

          <button
            class="clear-button"
            type="button"
            @click="clearFilters"
          >
            Clear filters
          </button>
        </div>

        <div class="results-row">
          <span>
            Showing {{ filteredAssets.length }}
            of {{ pipelines.length }} assets
          </span>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" @click="sortBy('id')">
                    Asset ID {{ sortIndicator('id') }}
                  </button>
                </th>

                <th>
                  <button type="button" @click="sortBy('name')">
                    Name {{ sortIndicator('name') }}
                  </button>
                </th>

                <th>
                  <button type="button" @click="sortBy('material')">
                    Material {{ sortIndicator('material') }}
                  </button>
                </th>

                <th>
                  <button type="button" @click="sortBy('diameter')">
                    Diameter {{ sortIndicator('diameter') }}
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    @click="sortBy('installationYear')"
                  >
                    Installed
                    {{ sortIndicator('installationYear') }}
                  </button>
                </th>

                <th>
                  <button type="button" @click="sortBy('lengthKm')">
                    Length {{ sortIndicator('lengthKm') }}
                  </button>
                </th>

                <th>
                  <button type="button" @click="sortBy('status')">
                    Status {{ sortIndicator('status') }}
                  </button>
                </th>

                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="asset in filteredAssets"
                :key="asset.id"
              >
                <td>
                  <strong>{{ asset.id }}</strong>
                </td>

                <td>{{ asset.name }}</td>
                <td>{{ asset.material }}</td>
                <td>{{ asset.diameter }} mm</td>
                <td>{{ asset.installationYear }}</td>
                <td>{{ asset.lengthKm }} km</td>

                <td>
                  <span
                    class="status-badge"
                    :class="asset.status"
                  >
                    {{ asset.status }}
                  </span>
                </td>

                <td class="action-cell">
                  <button class="details-button" type="button" @click="openAsset(asset)">
                    View
                  </button>

                  <button class="edit-button" type="button" @click="openEditAsset(asset)">
                    Edit
                  </button>

                  <button class="delete-button" type="button" @click="requestDeleteAsset(asset)">
                    Delete
                  </button>
                </td>
              </tr>

              <tr v-if="filteredAssets.length === 0">
                <td
                  class="empty-state"
                  colspan="8"
                >
                  No pipeline assets match the selected filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <Teleport to="body">
      <div
        v-if="selectedAsset"
        class="drawer-backdrop"
        @click.self="closeAsset"
      >
        <aside
          class="asset-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="asset-drawer-title"
        >
          <div class="drawer-header">
            <div>
              <p class="eyebrow">PIPELINE ASSET</p>

              <h3 id="asset-drawer-title">
                {{ selectedAsset.name }}
              </h3>
            </div>

            <button
              class="drawer-close"
              type="button"
              aria-label="Close asset details"
              @click="closeAsset"
            >
              ×
            </button>
          </div>

          <div class="drawer-content">
            <span
              class="status-badge large"
              :class="selectedAsset.status"
            >
              {{ selectedAsset.status }}
            </span>

            <dl class="asset-details">
              <div>
                <dt>Asset ID</dt>
                <dd>{{ selectedAsset.id }}</dd>
              </div>

              <div>
                <dt>Material</dt>
                <dd>{{ selectedAsset.material }}</dd>
              </div>

              <div>
                <dt>Diameter</dt>
                <dd>{{ selectedAsset.diameter }} mm</dd>
              </div>

              <div>
                <dt>Installation year</dt>
                <dd>{{ selectedAsset.installationYear }}</dd>
              </div>

              <div>
                <dt>Pipeline length</dt>
                <dd>{{ selectedAsset.lengthKm }} km</dd>
              </div>

              <div>
                <dt>Coordinate points</dt>
                <dd>{{ selectedAsset.coordinates.length }}</dd>
              </div>
            </dl>

            <section class="condition-panel">
              <h4>Operational assessment</h4>

              <p v-if="selectedAsset.status === 'normal'">
                The asset is currently operating within the expected
                condition range.
              </p>

              <p v-else-if="selectedAsset.status === 'warning'">
                The asset requires operational review and closer
                telemetry monitoring.
              </p>

              <p v-else>
                The asset has been classified as critical and should
                be reviewed immediately.
              </p>
            </section>

            <div class="drawer-actions">
              <button
  type="button"
  @click="viewAssetOnMap"
>
  View on map
</button>

              <button type="button" @click="manageAssetSensors">
                Manage sensors
              </button>
            </div>
          </div>
        </aside>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="editingAssetId"
        class="modal-backdrop"
        @click.self="closeEditAsset"
      >
        <section
          class="edit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-asset-title"
        >
          <div class="modal-header">
            <div>
              <p class="eyebrow">ASSET REGISTRY</p>
              <h3 id="edit-asset-title">Edit Pipeline Asset</h3>
            </div>

            <button
              class="drawer-close"
              type="button"
              aria-label="Close edit asset form"
              @click="closeEditAsset"
            >×</button>
          </div>

          <form class="edit-form" @submit.prevent="saveAssetChanges">
            <div class="form-row">
              <label>
                <span>Asset ID *</span>
                <input
                  v-model.trim="editForm.id"
                  required
                  readonly
                />
              </label>

              <label>
                <span>Asset name *</span>
                <input v-model.trim="editForm.name" required />
              </label>
            </div>

            <div class="form-row three-columns">
              <label>
                <span>Material *</span>
                <select v-model="editForm.material" required>
                  <option>Ductile iron</option>
                  <option>Steel</option>
                  <option>HDPE</option>
                  <option>PVC</option>
                </select>
              </label>

              <label>
                <span>Diameter (mm) *</span>
                <input v-model.number="editForm.diameter" required type="number" min="1" />
              </label>

              <label>
                <span>Length (km) *</span>
                <input v-model.number="editForm.lengthKm" required type="number" min="0.1" step="0.1" />
              </label>
            </div>

            <div class="form-row three-columns">
              <label>
                <span>Installation year *</span>
                <input
                  v-model.number="editForm.installationYear"
                  required
                  type="number"
                  min="1900"
                  :max="new Date().getFullYear()"
                />
              </label>

              <label>
                <span>Start latitude *</span>
                <input v-model.number="editForm.latitude" required type="number" min="-90" max="90" step="0.0001" />
              </label>

              <label>
                <span>Start longitude *</span>
                <input v-model.number="editForm.longitude" required type="number" min="-180" max="180" step="0.0001" />
              </label>
            </div>

            <p v-if="editError" class="form-error">{{ editError }}</p>

            <div class="modal-actions">
              <button class="cancel-button" type="button" @click="closeEditAsset">Cancel</button>
              <button class="save-button" type="submit">Save changes</button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="assetPendingDeletion"
        class="modal-backdrop"
        @click.self="cancelDeleteAsset"
      >
        <section
          class="confirm-modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-asset-title"
        >
          <p class="eyebrow">CONFIRM DELETION</p>
          <h3 id="delete-asset-title">Delete {{ assetPendingDeletion.id }}?</h3>
          <p>
            {{ assetPendingDeletion.name }} will be removed from the registry
            and network map. This action cannot be undone.
          </p>

          <div class="modal-actions">
            <button class="cancel-button" type="button" @click="cancelDeleteAsset">Keep asset</button>
            <button class="confirm-delete-button" type="button" @click="confirmDeleteAsset">Delete asset</button>
          </div>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
.main-content {
  width: calc(100% - 252px);
  min-width: 0;
  margin-left: 252px;
}

.page-content {
  padding: 26px 28px 40px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #4a829d;
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.page-heading h3,
.drawer-header h3 {
  margin: 0;
  color: #f4fbff;
}

.page-heading h3 {
  font-size: 1.35rem;
}

.page-description {
  max-width: 680px;
  margin: 8px 0 0;
  color: #78909f;
  font-size: 0.8rem;
  line-height: 1.6;
}

.export-button,
.clear-button,
.details-button,
.drawer-actions button {
  border-radius: 8px;
  font-weight: 800;
}

.export-button {
  padding: 10px 14px;
  border: 1px solid #284354;
  background: #10232f;
  color: #8fdff2;
  font-size: 0.7rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.summary-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid #1b303e;
  border-radius: 13px;
  background: rgba(11, 25, 34, 0.96);
}

.summary-card span,
.summary-card small {
  display: block;
}

.summary-card span {
  color: #8196a4;
  font-size: 0.7rem;
}

.summary-card strong {
  display: block;
  margin: 7px 0 5px;
  color: #f4fbff;
  font-size: 1.55rem;
}

.summary-card small {
  color: #607887;
  font-size: 0.64rem;
}

.summary-card.normal {
  border-color: rgba(32, 219, 155, 0.25);
}

.summary-card.warning {
  border-color: rgba(255, 200, 87, 0.25);
}

.summary-card.critical {
  border-color: rgba(255, 82, 103, 0.25);
}

.registry-panel {
  overflow: hidden;
  border: 1px solid #1b303e;
  border-radius: 13px;
  background: rgba(11, 25, 34, 0.96);
}

.toolbar {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.6fr)
    minmax(150px, 0.6fr)
    minmax(150px, 0.6fr)
    auto;
  gap: 12px;
  align-items: end;
  padding: 17px;
  border-bottom: 1px solid #1b303e;
}

.toolbar label {
  display: grid;
  gap: 7px;
}

.toolbar label span {
  color: #78909f;
  font-size: 0.65rem;
  font-weight: 700;
}

.toolbar input,
.toolbar select {
  width: 100%;
  min-height: 40px;
  padding: 9px 11px;
  border: 1px solid #294353;
  border-radius: 8px;
  outline: none;
  background: #0c1d27;
  color: #e9f4fb;
}

.toolbar input:focus,
.toolbar select:focus {
  border-color: #00addf;
  box-shadow: 0 0 0 3px rgba(0, 173, 223, 0.1);
}

.clear-button {
  min-height: 40px;
  padding: 0 13px;
  border: 1px solid #294353;
  background: #10232f;
  color: #9ab0bc;
  font-size: 0.67rem;
}

.results-row {
  padding: 11px 17px;
  border-bottom: 1px solid #182c39;
  color: #607887;
  font-size: 0.65rem;
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
  padding: 14px 16px;
  border-bottom: 1px solid #182c39;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #577181;
  font-size: 0.58rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

th button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: 800;
  text-transform: uppercase;
}

td {
  color: #8298a6;
}

td strong {
  color: #dcebf3;
}

.status-badge {
  display: inline-flex;
  min-width: 62px;
  justify-content: center;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: capitalize;
}

.status-badge.normal {
  background: rgba(32, 219, 155, 0.11);
  color: #4ce4af;
}

.status-badge.warning {
  background: rgba(255, 200, 87, 0.12);
  color: #ffc857;
}

.status-badge.critical {
  background: rgba(255, 82, 103, 0.13);
  color: #ff7182;
}

.status-badge.large {
  min-width: 78px;
  padding: 7px 10px;
}

.action-cell {
  display: flex;
  gap: 6px;
}

.details-button,
.edit-button,
.delete-button {
  padding: 7px 10px;
  border-radius: 7px;
  font-size: 0.62rem;
  font-weight: 800;
}

.details-button,
.edit-button {
  border: 1px solid #214052;
  background: #10232f;
  color: #87dff2;
}

.edit-button {
  color: #ffc857;
}

.delete-button {
  border: 1px solid rgba(255, 82, 103, 0.32);
  background: rgba(255, 82, 103, 0.08);
  color: #ff7182;
}

.empty-state {
  padding: 42px;
  color: #698191;
  text-align: center;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(1, 9, 14, 0.58);
  backdrop-filter: blur(4px);
}

.asset-drawer {
  position: absolute;
  top: 0;
  right: 0;
  width: min(100%, 430px);
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid #294555;
  background: #091821;
  box-shadow: -24px 0 60px rgba(0, 0, 0, 0.45);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  border-bottom: 1px solid #1b303e;
}

.drawer-close {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #284354;
  border-radius: 8px;
  background: #10232f;
  color: #89a5b5;
  font-size: 1.25rem;
}

.drawer-content {
  padding: 22px;
}

.asset-details {
  margin: 22px 0;
}

.asset-details div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 13px 0;
  border-bottom: 1px solid #182c39;
}

.asset-details dt {
  color: #718a99;
  font-size: 0.7rem;
}

.asset-details dd {
  margin: 0;
  color: #e9f4fb;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: right;
}

.condition-panel {
  padding: 16px;
  border: 1px solid #1b303e;
  border-radius: 10px;
  background: #0c1d27;
}

.condition-panel h4 {
  margin: 0 0 8px;
  font-size: 0.78rem;
}

.condition-panel p {
  margin: 0;
  color: #78909f;
  font-size: 0.7rem;
  line-height: 1.6;
}

.drawer-actions {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}

.drawer-actions button {
  min-height: 41px;
  border: 1px solid #214052;
  background: #10232f;
  color: #87dff2;
  font-size: 0.68rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(1, 9, 14, 0.74);
  backdrop-filter: blur(7px);
}

.edit-modal,
.confirm-modal {
  width: min(100%, 760px);
  overflow: hidden;
  border: 1px solid #294555;
  border-radius: 16px;
  background: #0a1821;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
}

.confirm-modal {
  width: min(100%, 460px);
  padding: 24px;
}

.confirm-modal h3 {
  margin: 0;
  color: #f4fbff;
}

.confirm-modal > p:not(.eyebrow) {
  margin: 12px 0 22px;
  color: #78909f;
  font-size: 0.75rem;
  line-height: 1.6;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-bottom: 1px solid #1b303e;
}

.modal-header h3 {
  margin: 0;
  color: #f4fbff;
  font-size: 1.15rem;
}

.edit-form {
  display: grid;
  gap: 17px;
  padding: 24px;
}

.edit-form label {
  display: grid;
  gap: 7px;
}

.edit-form label span {
  color: #8fa6b4;
  font-size: 0.7rem;
  font-weight: 700;
}

.edit-form input,
.edit-form select {
  width: 100%;
  min-height: 43px;
  padding: 10px 12px;
  border: 1px solid #294353;
  border-radius: 9px;
  outline: none;
  background: #0c1d27;
  color: #e9f4fb;
}

.edit-form input:focus,
.edit-form select:focus {
  border-color: #00addf;
  box-shadow: 0 0 0 3px rgba(0, 173, 223, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.form-row.three-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-error {
  margin: 0;
  color: #ff7182;
  font-size: 0.7rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button,
.save-button,
.confirm-delete-button {
  min-height: 41px;
  padding: 0 16px;
  border-radius: 9px;
  font-weight: 800;
}

.cancel-button {
  border: 1px solid #294353;
  background: #10232f;
  color: #9ab0bc;
}

.save-button {
  border: 0;
  background: #00addf;
  color: #00131c;
}

.confirm-delete-button {
  border: 1px solid rgba(255, 82, 103, 0.38);
  background: #ff5267;
  color: #ffffff;
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .toolbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .main-content {
    width: calc(100% - 82px);
    margin-left: 0;
  }

  .page-content {
    padding-inline: 16px;
  }
}

@media (max-width: 580px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-grid,
  .toolbar {
    grid-template-columns: 1fr;
  }

  .export-button {
    width: 100%;
  }

  .modal-backdrop {
    padding: 12px;
  }

  .form-row,
  .form-row.three-columns {
    grid-template-columns: 1fr;
  }

  .edit-form,
  .modal-header {
    padding: 18px;
  }
}
</style>
