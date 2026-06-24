/* AI 辅助生成：DeepSeek V4 + Claude */
import { ref, shallowRef } from 'vue'
import L from 'leaflet'

/**
 * Leaflet 地图组合式函数
 * 封装地图初始化、标记管理、飞入动画
 */
export function useMap() {
  const mapInstance = shallowRef(null)
  const markersLayer = shallowRef(null)
  const markers = ref([])
  const mapReady = ref(false)

  /** 修复 Leaflet 默认图标路径问题 */
  function fixIconPaths() {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }

  /** 初始化地图 */
  function initMap(containerId, options = {}) {
    if (mapInstance.value) return mapInstance.value

    fixIconPaths()

    const defaultOptions = {
      center: [39.9042, 116.4074],
      zoom: 5,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true,
    }

    const el = document.getElementById(containerId)
    if (!el) {
      console.error(`地图容器 #${containerId} 未找到`)
      return null
    }

    const map = L.map(el, { ...defaultOptions, ...options })

    // OpenStreetMap 瓦片
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // 标记图层组
    markersLayer.value = L.layerGroup().addTo(map)

    // 响应式调整
    setTimeout(() => map.invalidateSize(), 100)

    mapInstance.value = map
    mapReady.value = true
    return map
  }

  /** 创建自定义光晕标记 */
  function createGlowIcon(color = '#C8A96E') {
    return L.divIcon({
      className: 'glow-marker',
      html: `
        <div class="glow-marker__inner" style="--glow-color: ${color}">
          <div class="glow-marker__ring"></div>
          <div class="glow-marker__ring glow-marker__ring--pulse"></div>
          <div class="glow-marker__dot"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    })
  }

  /** 添加标记 */
  function addMarker(lat, lng, popupHTML, options = {}) {
    if (!mapInstance.value || !markersLayer.value) return null

    const icon = options.icon || createGlowIcon(options.color)
    const marker = L.marker([lat, lng], { icon, ...options })

    if (popupHTML) {
      marker.bindPopup(popupHTML, {
        maxWidth: 300,
        className: 'custom-popup',
        closeButton: true,
      })
    }

    marker.addTo(markersLayer.value)
    const markerData = { lat, lng, marker, id: Date.now() + Math.random() }
    markers.value.push(markerData)
    return markerData
  }

  /** 清除所有标记 */
  function clearMarkers() {
    if (markersLayer.value) {
      markersLayer.value.clearLayers()
    }
    markers.value = []
  }

  /** 飞入动画 */
  function flyTo(lat, lng, zoom = 12) {
    if (!mapInstance.value) return
    mapInstance.value.flyTo([lat, lng], zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    })
  }

  /** 设置视图 */
  function setView(lat, lng, zoom = 5) {
    if (!mapInstance.value) return
    mapInstance.value.setView([lat, lng], zoom)
  }

  /** 销毁地图 */
  function destroyMap() {
    if (mapInstance.value) {
      mapInstance.value.remove()
      mapInstance.value = null
    }
    markersLayer.value = null
    markers.value = []
    mapReady.value = false
  }

  /** 地图点击获取坐标 */
  function onMapClick(callback) {
    if (!mapInstance.value) return
    mapInstance.value.on('click', (e) => {
      callback({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
  }

  return {
    mapInstance,
    markers,
    mapReady,
    initMap,
    addMarker,
    clearMarkers,
    flyTo,
    setView,
    destroyMap,
    onMapClick,
    createGlowIcon,
  }
}
