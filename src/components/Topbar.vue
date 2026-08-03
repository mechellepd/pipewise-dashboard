<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title ?? 'PIPEWISE'
})
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
        class="icon-button"
        type="button"
      >
        🔔
      </button>

      <button
        class="primary-button"
        type="button"
      >
        + Register Asset
      </button>

    </div>

  </header>
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

</style>