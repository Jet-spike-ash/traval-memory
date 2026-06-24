<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  lat: { type: Number, default: 39.9042 },
  lng: { type: Number, default: 116.4074 },
  zoom: { type: Number, default: 5 },
})

const emit = defineEmits(['update:lat', 'update:lng', 'pick'])

const containerId = `map-picker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
let map = null
let pickMarker = null
const pickedLat = ref(props.lat)
const pickedLng = ref(props.lng)

const searchQuery = ref('')
const searching = ref(false)
const searchResults = ref([])
const showResults = ref(false)

function fixIcons() {
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

function initMap() {
  fixIcons()
  const el = document.getElementById(containerId)
  if (!el) return

  map = L.map(el, {
    center: [props.lat, props.lng],
    zoom: props.zoom,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)

  placeMarker(props.lat, props.lng)

  map.on('click', (e) => {
    placeMarker(e.latlng.lat, e.latlng.lng)
    pickedLat.value = e.latlng.lat
    pickedLng.value = e.latlng.lng
    emit('update:lat', e.latlng.lat)
    emit('update:lng', e.latlng.lng)
    emit('pick', { lat: e.latlng.lat, lng: e.latlng.lng })
  })

  setTimeout(() => map.invalidateSize(), 100)
}

function placeMarker(lat, lng) {
  if (pickMarker) {
    pickMarker.setLatLng([lat, lng])
  } else {
    const icon = L.divIcon({
      className: 'pick-marker',
      html: `<div style="
        width:24px;height:24px;background:var(--color-accent,#C8A96E);
        border:3px solid #fff;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,0.4);
        transform:translate(-50%,-50%);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
    pickMarker = L.marker([lat, lng], { icon }).addTo(map)
  }
}

// ---- 地点搜索 ----
async function searchLocation() {
  const q = searchQuery.value.trim()
  if (!q || q.length < 2) return

  searching.value = true
  showResults.value = true
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=zh`
    )
    searchResults.value = await res.json()
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function selectResult(place) {
  const lat = parseFloat(place.lat)
  const lng = parseFloat(place.lon)
  if (isNaN(lat) || isNaN(lng)) return

  placeMarker(lat, lng)
  pickedLat.value = lat
  pickedLng.value = lng
  map.setView([lat, lng], 13)
  showResults.value = false
  // 取第一段短名称，避免显示过长的完整地址
  // 用结构化地址拼接短名称
  const a = place.address || {}
  const shortName = [a.state, a.city, a.county, a.road].filter(Boolean).join('') || place.display_name.split(',')[0]
  searchQuery.value = shortName

  emit('update:lat', lat)
  emit('update:lng', lng)
  emit('pick', { lat, lng })
}

function onFocusSearch() {
  if (searchResults.value.length > 0) showResults.value = true
}

function handleKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    searchLocation()
  }
}

// 点击外部关闭搜索结果
function onClickOutside(e) {
  if (!e.target.closest('.map-picker__search')) {
    showResults.value = false
  }
}

// ---- 定位当前 ----
const locating = ref(false)

function locateMe() {
  if (!navigator.geolocation) {
    alert('您的浏览器不支持定位功能')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      placeMarker(lat, lng)
      pickedLat.value = lat
      pickedLng.value = lng
      map?.setView([lat, lng], 15)
      searchQuery.value = ''
      showResults.value = false
      emit('update:lat', lat)
      emit('update:lng', lng)
      emit('pick', { lat, lng })
      locating.value = false
    },
    (err) => {
      locating.value = false
      if (err.code === 1) alert('定位被拒绝，请在浏览器设置中允许定位权限')
      else alert('获取位置失败，请检查网络或手动选点')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

watch([() => props.lat, () => props.lng], ([lat, lng]) => {
  if (map && lat && lng) {
    placeMarker(lat, lng)
    map.setView([lat, lng], map.getZoom())
  }
})

onMounted(() => {
  setTimeout(initMap, 100)
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  if (map) { map.remove(); map = null }
})

defineExpose({ map, flyTo: (lat, lng, z) => map?.setView([lat, lng], z || 13) })
</script>

<template>
  <div class="map-picker">
    <!-- 搜索栏 -->
    <div class="map-picker__search">
      <div class="map-picker__search-box">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索地点，如：巴黎、东京、西藏..."
          @keydown="handleKeydown"
          @focus="onFocusSearch"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''; searchResults = []; showResults = false">
          <i class="fa-solid fa-times"></i>
        </button>
        <button class="search-btn" :disabled="searching || searchQuery.length < 2" @click="searchLocation">
          <i v-if="searching" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-search"></i>
        </button>
        <button class="locate-btn" :disabled="locating" @click="locateMe" title="定位到当前位置">
          <i v-if="locating" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-location-crosshairs"></i>
        </button>
      </div>

      <!-- 搜索结果下拉 -->
      <div v-if="showResults && searchResults.length" class="map-picker__results">
        <button
          v-for="place in searchResults"
          :key="place.place_id"
          class="search-result"
          @click="selectResult(place)"
        >
          <i class="fa-solid fa-location-dot"></i>
          <div class="search-result__text">
            <span class="search-result__name">{{ place.display_name.split(',')[0] }}</span>
            <span class="search-result__full text-muted">{{ place.display_name }}</span>
          </div>
          <span class="search-result__coords">{{ parseFloat(place.lat).toFixed(4) }}, {{ parseFloat(place.lon).toFixed(4) }}</span>
        </button>
      </div>
      <div v-if="showResults && searchResults.length === 0 && !searching && searchQuery.length >= 2" class="map-picker__no-results">
        <i class="fa-solid fa-circle-exclamation"></i> 未找到匹配的地点
      </div>
    </div>

    <!-- 地图 -->
    <div :id="containerId" class="map-picker__map"></div>

    <!-- 坐标显示 -->
    <div class="map-picker__coords">
      <span class="map-picker__coord">
        <i class="fa-solid fa-location-dot"></i> 纬度 {{ pickedLat.toFixed(4) }}
      </span>
      <span class="map-picker__coord">
        <i class="fa-solid fa-location-dot"></i> 经度 {{ pickedLng.toFixed(4) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.map-picker {
  width: 100%;
  position: relative;
}

/* ====== 搜索栏 ====== */
.map-picker__search {
  position: relative;
  margin-bottom: var(--space-3);
  z-index: 10;
}

.map-picker__search-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--duration-fast);
}
.map-picker__search-box:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(200, 169, 110, 0.15);
}

.search-icon {
  padding-left: var(--space-4);
  color: var(--color-text-muted);
  font-size: 14px;
}

.search-input {
  flex: 1;
  border: none;
  padding: var(--space-3) var(--space-3);
  font-size: var(--text-sm);
  background: transparent;
  outline: none;
  min-width: 0;
}

.search-clear {
  padding: var(--space-1) var(--space-2);
  color: var(--color-text-muted);
  font-size: 12px;
}
.search-clear:hover { color: var(--color-text-primary); }

.search-btn {
  padding: var(--space-3) var(--space-3);
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  border-radius: 0;
  transition: background var(--duration-fast);
}
.search-btn:hover:not(:disabled) { background: var(--color-primary-light); }
.search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.locate-btn {
  padding: var(--space-3) var(--space-3);
  background: var(--color-accent);
  color: #fff;
  font-size: 14px;
  border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
  transition: background var(--duration-fast);
  flex-shrink: 0;
}
.locate-btn:hover:not(:disabled) { background: #b8933e; }
.locate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ====== 搜索结果下拉 ====== */
.map-picker__results,
.map-picker__no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 240px;
  overflow-y: auto;
  z-index: 20;
}

.map-picker__no-results {
  padding: var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.search-result {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--duration-fast);
  font-size: var(--text-sm);
  cursor: pointer;
}
.search-result:last-child { border-bottom: none; }
.search-result:hover { background: rgba(200, 169, 110, 0.1); }
.search-result i { color: var(--color-accent); flex-shrink: 0; }

.search-result__text {
  flex: 1;
  min-width: 0;
}
.search-result__name {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
}
.search-result__full {
  display: block;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result__coords {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* ====== 地图 ====== */
.map-picker__map {
  width: 100%;
  height: 350px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: var(--border-width) solid var(--color-border);
  z-index: 1;
}

.map-picker__coords {
  display: flex;
  gap: var(--space-5);
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-glass);
  border-radius: var(--radius-sm);
}

.map-picker__coord {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}
.map-picker__coord i {
  color: var(--color-accent);
  margin-right: var(--space-1);
}
</style>
