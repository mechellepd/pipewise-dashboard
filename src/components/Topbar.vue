<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import NotificationDrawer from './NotificationDrawer.vue'
import { useNotificationStore } from '../stores/notificationStore'

const notificationStore = useNotificationStore()
const isNotificationDrawerOpen = ref(false)

function openNotificationDrawer() {
  isNotificationDrawerOpen.value = true
}

function closeNotificationDrawer() {
  isNotificationDrawerOpen.value = false
}

const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title ?? 'PIPEWISE'
})

const isRegisterModalOpen = ref(false)

const assetForm = reactive({
  assetId: '',
  assetName: '',
  material: '',
  diameter: '',
  installationYear: '',
  location: '',
})

function openRegisterModal() {
  isRegisterModalOpen.value = true
}

function closeRegisterModal() {
  isRegisterModalOpen.value = false
}

function resetAssetForm() {
  assetForm.assetId = ''
  assetForm.assetName = ''
  assetForm.material = ''
  assetForm.diameter = ''
  assetForm.installationYear = ''
  assetForm.location = ''
}

function submitAsset() {
  const requiredFields = [
    assetForm.assetId,
    assetForm.assetName,
    assetForm.material,
    assetForm.diameter,
    assetForm.location,
  ]

  if (requiredFields.some((value) => !String(value).trim())) {
    window.alert('Please complete all required fields.')
    return
  }

  console.log('Registered asset:', {
    ...assetForm,
  })

  window.alert(
    `${assetForm.assetId} has been registered in the prototype.`,
  )

  resetAssetForm()
  closeRegisterModal()
}
</script>

<template>
  <header class="topbar">

    <div>
      <p class="eyebrow">
        Pipeline Intelligence & Early Warning System
      </p>

   <h2>{{ pageTitle }}</h2>
    </div>

    <div class="topbar-actions">

      <div class="live-indicator">
        <span></span>
        LIVE MONITORING
      </div>

<button
  class="icon-button notification-button"
  type="button"
  aria-label="Open notifications"
  @click="openNotificationDrawer"
>
  <span aria-hidden="true">🔔</span>

  <span
    v-if="notificationStore.unreadCount > 0"
    class="notification-badge"
  >
    {{
      notificationStore.unreadCount > 9
        ? '9+'
        : notificationStore.unreadCount
    }}
  </span>
</button>

      <button
  class="primary-button"
  type="button"
  @click="openRegisterModal"
>
  + Register Asset
</button>

    </div>

  </header>

  <NotificationDrawer
  :is-open="isNotificationDrawerOpen"
  @close="closeNotificationDrawer"
/>

  <Teleport to="body">
  <div
    v-if="isRegisterModalOpen"
    class="modal-backdrop"
    @click.self="closeRegisterModal"
  >
    <section
      class="asset-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-asset-title"
    >
      <div class="modal-header">
        <div>
          <p class="modal-eyebrow">
            ASSET REGISTRY
          </p>

          <h3 id="register-asset-title">
            Register Pipeline Asset
          </h3>
        </div>

        <button
          class="modal-close"
          type="button"
          aria-label="Close register asset form"
          @click="closeRegisterModal"
        >
          ×
        </button>
      </div>

      <form
        class="asset-form"
        @submit.prevent="submitAsset"
      >
        <label>
          <span>Asset ID *</span>

          <input
            v-model.trim="assetForm.assetId"
            type="text"
            placeholder="Example: PL-072"
          />
        </label>

        <label>
          <span>Asset name *</span>

          <input
            v-model.trim="assetForm.assetName"
            type="text"
            placeholder="Example: Lambak Main Line"
          />
        </label>

        <div class="form-row">
          <label>
            <span>Material *</span>

            <select v-model="assetForm.material">
              <option value="" disabled>
                Select material
              </option>

              <option value="Ductile iron">
                Ductile iron
              </option>

              <option value="Steel">
                Steel
              </option>

              <option value="HDPE">
                HDPE
              </option>

              <option value="PVC">
                PVC
              </option>
            </select>
          </label>

          <label>
            <span>Diameter *</span>

            <input
              v-model.number="assetForm.diameter"
              type="number"
              min="1"
              placeholder="mm"
            />
          </label>
        </div>

        <div class="form-row">
          <label>
            <span>Installation year</span>

            <input
              v-model.number="assetForm.installationYear"
              type="number"
              min="1900"
              max="2100"
              placeholder="2026"
            />
          </label>

          <label>
            <span>Location *</span>

            <input
              v-model.trim="assetForm.location"
              type="text"
              placeholder="Example: Lambak"
            />
          </label>
        </div>

        <div class="modal-actions">
          <button
            class="cancel-button"
            type="button"
            @click="closeRegisterModal"
          >
            Cancel
          </button>

          <button
            class="save-button"
            type="submit"
          >
            Register asset
          </button>
        </div>
      </form>
    </section>
  </div>
</Teleport>

</template>

<style scoped>

.topbar{
    position:sticky;
    top:0;
    z-index:15;

    display:flex;
    align-items:center;
    justify-content:space-between;

    min-height:86px;

    padding:16px 28px;

    border-bottom:1px solid #1b2d3a;

    background:rgba(7,16,25,.88);

    backdrop-filter:blur(18px);
}

.eyebrow{

    margin:0 0 4px;

    color:#4a829d;

    font-size:.63rem;

    font-weight:800;

    letter-spacing:.15em;

}

.topbar h2 {
  margin: 0;
  color: #f4fbff;
  font-size: 1.42rem;
}

.topbar-actions{

    display:flex;

    align-items:center;

    gap:11px;

}

.live-indicator{

    display:flex;

    align-items:center;

    gap:7px;

    padding:8px 11px;

    border-radius:999px;

    border:1px solid rgba(32,219,155,.25);

    background:rgba(32,219,155,.07);

    color:#58e6b2;

    font-size:.66rem;

    font-weight:800;

    letter-spacing:.07em;

}

.live-indicator span{

    width:7px;

    height:7px;

    border-radius:50%;

    background:#20db9b;

    box-shadow:0 0 9px #20db9b;

}

.icon-button{

    width:39px;

    height:39px;

    border:none;

    border-radius:9px;

    background:#0e1c26;

    color: #e9f4fb;

    border:1px solid #213747;

    cursor:pointer;

    position: relative;

}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  place-items: center;
  border: 2px solid #071019;
  border-radius: 999px;
  background: #ff5267;
  color: #ffffff;
  font-size: 0.56rem;
  font-weight: 900;
  line-height: 1;
}

.primary-button{

    padding:11px 15px;

    border:none;

    border-radius:9px;

    cursor:pointer;

    background:#00addf;

    color:#00131c;

    font-size:.78rem;

    font-weight:800;

}

@media(max-width:820px){

    .topbar{

        align-items:flex-start;

        padding-inline:16px;

    }

    .live-indicator,
    .primary-button{

        display:none;

    }

}
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(1, 9, 14, 0.78);
  backdrop-filter: blur(8px);
}

.asset-modal {
  width: min(100%, 640px);
  overflow: hidden;
  border: 1px solid #294555;
  border-radius: 16px;
  background:
    radial-gradient(
      circle at top right,
      rgba(0, 194, 255, 0.1),
      transparent 18rem
    ),
    #0a1821;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-bottom: 1px solid #1b303e;
}

.modal-eyebrow {
  margin: 0 0 5px;
  color: #4a829d;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.modal-header h3 {
  margin: 0;
  color: #f4fbff;
  font-size: 1.15rem;
}

.modal-close {
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

.modal-close:hover {
  color: #ffffff;
}

.asset-form {
  display: grid;
  gap: 17px;
  padding: 24px;
}

.asset-form label {
  display: grid;
  gap: 7px;
}

.asset-form label span {
  color: #8fa6b4;
  font-size: 0.7rem;
  font-weight: 700;
}

.asset-form input,
.asset-form select {
  width: 100%;
  min-height: 43px;
  padding: 10px 12px;
  border: 1px solid #294353;
  border-radius: 9px;
  outline: none;
  background: #0c1d27;
  color: #e9f4fb;
}

.asset-form input::placeholder {
  color: #506b7b;
}

.asset-form input:focus,
.asset-form select:focus {
  border-color: #00addf;
  box-shadow: 0 0 0 3px rgba(0, 173, 223, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 5px;
}

.cancel-button,
.save-button {
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

@media (max-width: 580px) {
  .modal-backdrop {
    padding: 12px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .asset-form,
  .modal-header {
    padding: 18px;
  }
}
</style>