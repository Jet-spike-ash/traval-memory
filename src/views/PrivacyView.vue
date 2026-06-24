<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { useMap } from '@/composables/useMap'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const { mapInstance, mapReady, initMap, destroyMap, createGlowIcon } = useMap()
const mapContainerId = 'privacy-map'
const loading = ref(true)
const showPublic = ref(true)
const showPrivate = ref(true)

// 框选状态
let selecting = false
let startPoint = null
let selectionRect = null

onMounted(async () => {
  if (!userStore.userId) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  initMap(mapContainerId, { zoom: 3 })
  setTimeout(async () => {
    renderMarkers()
    loading.value = false

    // 添加框选功能
    if (mapInstance.value) {
      mapInstance.value.on('mousedown', (e) => {
        if (!e.originalEvent.shiftKey) return
        selecting = true
        startPoint = e.latlng
        if (selectionRect) mapInstance.value.removeLayer(selectionRect)
        selectionRect = L.rectangle([startPoint, startPoint], { color: '#C8A96E', weight: 2, fillOpacity: 0.1 }).addTo(mapInstance.value)
      })
      mapInstance.value.on('mousemove', (e) => {
        if (!selecting || !selectionRect) return
        selectionRect.setBounds([startPoint, e.latlng])
      })
      mapInstance.value.on('mouseup', async (e) => {
        if (!selecting) return
        selecting = false
        const bounds = selectionRect.getBounds()
        const inBox = memoryStore.memories.filter((m) => bounds.contains([m.lat, m.lng]))
        if (inBox.length > 0) {
          const ok = confirm(`将 ${inBox.length} 条记忆设为仅自己可见？`)
          if (ok) {
            for (const m of inBox) {
              await memoryStore.updateMemory(m.id, { ...m, privacy_level: 1 })
            }
            uiStore.showToast(`已设为仅自己可见`, 'success')
            renderMarkers()
          }
        }
      })
    }
  }, 200)
})

function renderMarkers() {
  memoryStore.memories.forEach((m) => {
    if (m.privacy_level === 1 && !showPrivate) return
    if (m.privacy_level === 0 && !showPublic) return
    // 简化标记
  })
  mapInstance.value?.invalidateSize()
}

async function togglePrivacy(memory) {
  const updated = { ...memory, privacy_level: memory.privacy_level === 1 ? 0 : 1 }
  try {
    await memoryStore.updateMemory(memory.id, updated)
    uiStore.showToast(updated.privacy_level === 1 ? '🔒 已设为仅自己' : '🌍 已设为公开', 'success')
  } catch { uiStore.showToast('更新失败', 'error') }
}

onUnmounted(() => { destroyMap() })
</script>

<template>
  <div class="privacy-page">
    <AppHeader />
    <Loader :visible="loading" text="加载隐私地图..." />
    <div :id="mapContainerId" class="privacy-map"></div>
    <div class="privacy-panel glass">
      <h2><i class="fa-solid fa-shield-halved"></i> 秘匣·隐私地图</h2>
      <p class="text-muted" style="font-size: var(--text-xs);">按住 Shift 拖拽框选区域批量设为私密</p>
      <div class="privacy-list">
        <div v-for="m in memoryStore.memories" :key="m.id" class="privacy-item" @click="togglePrivacy(m)">
          <span>{{ m.privacy_level === 1 ? '🔒' : '🌍' }}</span>
          <span class="privacy-item__title">{{ m.title }}</span>
          <span class="text-muted" style="font-size:11px;">{{ formatDateCN(m.happened_date) }}</span>
          <button class="privacy-item__toggle">
            {{ m.privacy_level === 1 ? '公开' : '私密' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-page { min-height: 100vh; padding-top: 64px; position: relative; }
.privacy-map { width: 100%; height: calc(100vh - 64px); z-index: 1; }
.privacy-panel {
  position: absolute; top: 80px; right: var(--space-5); z-index: var(--z-popup);
  width: 300px; max-height: calc(100vh - 160px); overflow-y: auto; padding: var(--space-4);
}
.privacy-panel h2 { font: var(--text-h3); margin-bottom: var(--space-2); }
.privacy-list { display: flex; flex-direction: column; gap: var(--space-1); margin-top: var(--space-3); }
.privacy-item {
  display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2);
  border-radius: var(--radius-sm); cursor: pointer; transition: background var(--duration-fast);
  font-size: var(--text-sm);
}
.privacy-item:hover { background: rgba(200,169,110,0.1); }
.privacy-item__title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.privacy-item__toggle {
  padding: 2px 10px; border-radius: var(--radius-pill); font-size: 11px;
  background: var(--color-border); color: var(--color-text-secondary);
}
@media (max-width: 768px) { .privacy-panel { width: 260px; right: var(--space-2); } }
</style>
