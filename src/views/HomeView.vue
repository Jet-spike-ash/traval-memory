<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { useMap } from '@/composables/useMap'
import { formatDateCN, getSeasonCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'
import CompanionPanel from '@/components/memory/CompanionPanel.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const { mapInstance, mapReady, initMap, addMarker, clearMarkers, flyTo, setView } = useMap()

const mapContainerId = 'home-map'
const loading = ref(true)
const selectedMemory = ref(null)
const showPreview = ref(false)
const selectedTraveler = ref(null)
const showTravelerDrawer = ref(false)

// 当前地图上显示的记忆来源: 'mine' | 'traveler'
const currentView = ref('mine')

// ---- 工具函数 ----
function getWeatherIcon(type) {
  const map = { sunny: 'fa-sun', rain: 'fa-cloud-rain', snow: 'fa-snowflake', cloudy: 'fa-cloud', fog: 'fa-smog', wind: 'fa-wind' }
  return map[type] || 'fa-cloud-sun'
}

function getWeatherLabel(type) {
  const map = { sunny: '晴', rain: '雨', snow: '雪', cloudy: '多云', fog: '雾', wind: '风' }
  return map[type] || type
}

// ---- 加载我的记忆 ----
async function loadMemories() {
  if (!userStore.userId) {
    await new Promise((r) => setTimeout(r, 200))
  }
  if (userStore.userId) {
    await memoryStore.fetchMemories(userStore.userId)
  }
}

// ---- 渲染记忆标记 ----
function renderMemoryMarkers(memories, color = '#C8A96E') {
  memories.forEach((m) => {
    const dateStr = formatDateCN(m.happened_date)
    const popupHTML = `
      <div style="font-family:'Inter',sans-serif;min-width:200px;">
        <img src="${m.images?.[0] || ''}" alt="${m.title}"
             style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;"
             onerror="this.style.display='none'" />
        <h3 style="margin:0 0 4px;font-size:16px;color:#1E3A4D;font-family:'Playfair Display',serif;">
          ${m.title}
        </h3>
        <p style="margin:0;font-size:12px;color:#8C7C6B;">
          <i class="fa-solid fa-calendar" style="margin-right:4px;color:#C8A96E;"></i>${dateStr}
        </p>
        <button onclick="window.__openMemory(${m.id})"
                style="margin-top:8px;width:100%;padding:6px;border:none;border-radius:20px;
                       background:#1E3A4D;color:#fff;font-size:13px;cursor:pointer;">
          查看详情 →
        </button>
      </div>
    `

    const marker = addMarker(m.lat, m.lng, popupHTML, {
      color: m.privacy_level === 1 ? '#B55A5A' : color,
    })

    if (marker) {
      marker.marker.on('click', () => {
        selectedMemory.value = m
        showPreview.value = true
        showTravelerDrawer.value = false
      })
    }
  })
}

// ---- 渲染我的记忆（默认视图）----
function showMyMemories() {
  clearMarkers()
  renderMemoryMarkers(memoryStore.memories, '#C8A96E')
  currentView.value = 'mine'
  showTravelerDrawer.value = false
  selectedTraveler.value = null
  setView(userStore.homePosition.lat, userStore.homePosition.lng, 3)
}

// ---- 渲染游者的记忆 ----
function showTravelerMemories(traveler) {
  clearMarkers()
  // 游者记忆用靛蓝色标记
  renderMemoryMarkers(traveler.memories, '#3A5F78')

  // 飞到游者最近的记忆位置
  if (traveler.primaryLat && traveler.primaryLng) {
    flyTo(traveler.primaryLat, traveler.primaryLng, 8)
  }

  currentView.value = 'traveler'
}

// ---- 游者面板：点击游者 ----
function onSelectTraveler(traveler) {
  selectedTraveler.value = traveler
  showTravelerDrawer.value = true
  showPreview.value = false
  showTravelerMemories(traveler)
}

// ---- 关闭游者抽屉 ----
function closeTravelerDrawer() {
  showTravelerDrawer.value = false
  selectedTraveler.value = null
  showMyMemories()
}

function goToDetail(id) {
  router.push(`/memory/${id}`)
}

// ---- 初始化 ----
onMounted(async () => {
  initMap(mapContainerId, { zoomControl: true })
  await loadMemories()
  renderMemoryMarkers(memoryStore.memories, '#C8A96E')
  loading.value = false

  window.__openMemory = (id) => {
    router.push(`/memory/${id}`)
  }
})

onUnmounted(() => {
  delete window.__openMemory
})
</script>

<template>
  <div class="home-page">
    <AppHeader />

    <!-- 全屏地图 -->
    <div :id="mapContainerId" class="home-page__map"></div>

    <Loader :visible="loading" text="正在加载记忆地图..." />

    <!-- 记忆统计浮动栏（hover 展开） -->
    <div v-if="!loading && mapReady" class="home-page__stats glass">
      <span class="stat-hint">你的记忆和目的地</span>
      <div class="stat-detail">
        <div class="stat-item">
          <span class="stat-value">{{ memoryStore.memoryCount }}</span>
          <span class="stat-label">段记忆</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">
            {{ [...new Set(memoryStore.memories.map((m) => m.location_name?.split('·')[0]))].length }}
          </span>
          <span class="stat-label">个目的地</span>
        </div>
      </div>
    </div>

    <!-- 游者面板 -->
    <CompanionPanel
      v-if="!loading && mapReady"
      @select="onSelectTraveler"
    />

    <!-- 查看游者时：返回按钮 -->
    <button
      v-if="currentView === 'traveler'"
      class="home-page__back-btn"
      @click="showMyMemories"
    >
      <i class="fa-solid fa-arrow-left"></i> 回到我的记忆
    </button>

    <!-- 定位按钮 -->
    <button
      v-if="mapReady"
      class="home-page__locate"
      :title="currentView === 'traveler' ? '回到我的位置' : '定位'"
      @click="currentView === 'traveler'
        ? showMyMemories()
        : flyTo(userStore.homePosition.lat, userStore.homePosition.lng, 8)"
    >
      <i class="fa-solid" :class="currentView === 'traveler' ? 'fa-house' : 'fa-location-crosshairs'"></i>
    </button>

    <!-- ====== 底部：我的记忆预览 (已有) ====== -->
    <Transition name="slide-up">
      <div v-if="showPreview && selectedMemory && !showTravelerDrawer" class="home-page__preview glass">
        <button class="preview__close" @click="showPreview = false">
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div class="preview__body" @click="goToDetail(selectedMemory.id)">
          <div class="preview__image">
            <img v-if="selectedMemory.images?.length" :src="selectedMemory.images[0]" :alt="selectedMemory.title" />
            <div v-else class="preview__img-placeholder"><i class="fa-solid fa-image"></i></div>
          </div>
          <div class="preview__info">
            <h3 class="preview__title">{{ selectedMemory.title }}</h3>
            <div class="preview__meta">
              <span><i class="fa-solid fa-calendar"></i> {{ formatDateCN(selectedMemory.happened_date) }}</span>
              <span><i class="fa-solid fa-leaf"></i> {{ getSeasonCN(selectedMemory.happened_date) }}</span>
              <span><i class="fa-solid" :class="getWeatherIcon(selectedMemory.weather_type)"></i> {{ getWeatherLabel(selectedMemory.weather_type) }}</span>
            </div>
            <p class="preview__location"><i class="fa-solid fa-location-dot"></i> {{ selectedMemory.location_name }}</p>
            <p class="preview__story text-muted">{{ selectedMemory.story?.replace(/[#*`\n]/g, ' ').slice(0, 80) }}...</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ====== 底部：游者详情抽屉 (新增) ====== -->
    <Transition name="slide-up">
      <div v-if="showTravelerDrawer && selectedTraveler" class="traveler-drawer glass">
        <!-- 关闭按钮 -->
        <button class="drawer__close" @click="closeTravelerDrawer">
          <i class="fa-solid fa-chevron-down"></i>
        </button>

        <!-- 游者头部信息 -->
        <div class="drawer__hero">
          <img :src="selectedTraveler.avatar" :alt="selectedTraveler.username" class="drawer__avatar" />
          <div class="drawer__hero-text">
            <h2 class="drawer__name">{{ selectedTraveler.username }}</h2>
            <p class="drawer__bio">{{ selectedTraveler.bio }}</p>
            <p class="drawer__stats">
              <span><i class="fa-solid fa-map-pin"></i> {{ selectedTraveler.memories.length }} 段旅程</span>
              <span><i class="fa-solid fa-earth-americas"></i> {{ [...new Set(selectedTraveler.memories.map((m) => m.location_name?.split('·')[0]))].length }} 个国家</span>
            </p>
          </div>
        </div>

        <!-- 游者照片墙 -->
        <div class="drawer__photos">
          <img
            v-for="(img, idx) in selectedTraveler.memories.slice(0, 6).flatMap((m) => m.images || []).slice(0, 6)"
            :key="idx"
            :src="img"
            alt="旅行照片"
            class="drawer__photo"
          />
        </div>

        <!-- 游者记忆列表 -->
        <div class="drawer__memories">
          <h3 class="drawer__section-title">
            <i class="fa-solid fa-book-open"></i> 旅行记忆
          </h3>
          <div
            v-for="m in selectedTraveler.memories"
            :key="m.id"
            class="drawer__memory-card"
            @click="goToDetail(m.id)"
          >
            <div class="drawer__memory-img">
              <img v-if="m.images?.length" :src="m.images[0]" :alt="m.title" />
              <div v-else class="preview__img-placeholder"><i class="fa-solid fa-image"></i></div>
            </div>
            <div class="drawer__memory-info">
              <h4>{{ m.title }}</h4>
              <p class="text-muted">
                <i class="fa-solid fa-calendar"></i> {{ formatDateCN(m.happened_date) }}
                &nbsp;
                <i class="fa-solid fa-location-dot"></i> {{ m.location_name }}
              </p>
              <p class="drawer__memory-excerpt text-muted">
                {{ m.story?.replace(/[#*`\n]/g, ' ').slice(0, 60) }}...
              </p>
            </div>
            <i class="fa-solid fa-chevron-right drawer__memory-arrow"></i>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.home-page__map {
  width: 100%;
  height: 100vh;
  z-index: var(--z-base);
}

/* Leaflet 缩放控件移到右下角 */
.home-page__map :deep(.leaflet-control-zoom) {
  position: fixed !important;
  right: var(--space-5);
  bottom: 96px;
  top: auto !important;
  left: auto !important;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: none;
}

/* ====== 统计栏：hover 展开 ====== */
.home-page__stats {
  position: absolute;
  top: 80px;
  left: 0;
  z-index: var(--z-popup);
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
  border-left: none;
  cursor: default;
  transition: all var(--duration-normal) var(--ease-out);
  white-space: nowrap;
  overflow: hidden;
  max-width: 160px;
}

.stat-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  writing-mode: horizontal-tb;
  flex-shrink: 0;
}

.stat-detail {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-left: var(--space-3);
  opacity: 0;
  transform: translateX(-8px);
  transition: all var(--duration-normal) var(--ease-out);
  pointer-events: none;
}

.home-page__stats:hover {
  max-width: 280px;
  padding: var(--space-3) var(--space-5);
  box-shadow: var(--shadow-md);
}

.home-page__stats:hover .stat-hint {
  color: var(--color-text-muted);
  font-size: 11px;
}

.home-page__stats:hover .stat-detail {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.stat-item { text-align: center; min-width: 60px; }
.stat-value {
  display: block;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}
.stat-label { font-size: var(--text-xs); color: var(--color-text-muted); }
.stat-divider { width: 1px; height: 32px; background: var(--color-border); }

/* ====== 返回按钮 ====== */
.home-page__back-btn {
  position: absolute;
  top: 80px;
  left: var(--space-5);
  z-index: var(--z-popup);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--color-glass);
  backdrop-filter: blur(8px);
  border: var(--border-width) solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-fast);
}
.home-page__back-btn:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* ====== 定位按钮 ====== */
.home-page__locate {
  position: absolute;
  bottom: 32px;
  right: var(--space-5);
  z-index: var(--z-popup);
  z-index: var(--z-popup);
  width: 48px;
  height: 48px;
  border-radius: var(--radius-round);
  background: #fff;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--color-primary);
  transition: all var(--duration-fast);
}
.home-page__locate:hover { background: var(--color-primary); color: #fff; }

/* ====== 底部预览卡片（我的记忆） ====== */
.home-page__preview {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-popup);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-3) var(--space-4) var(--space-5);
  max-height: 40vh;
  overflow-y: auto;
}

.preview__close {
  display: block;
  margin: 0 auto var(--space-2);
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
}

.preview__body {
  display: flex;
  gap: var(--space-4);
  cursor: pointer;
}

.preview__image {
  width: 120px;
  height: 90px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}
.preview__image img { width: 100%; height: 100%; object-fit: cover; }

.preview__img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-light);
  color: var(--color-text-muted);
}

.preview__info { flex: 1; min-width: 0; }
.preview__title { font: var(--text-h3); margin-bottom: var(--space-1); }
.preview__meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
  flex-wrap: wrap;
}
.preview__meta i { color: var(--color-accent); }
.preview__location { font-size: var(--text-xs); color: var(--color-text-secondary); margin-bottom: var(--space-1); }
.preview__story {
  font-size: var(--text-xs);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ====== 游者详情抽屉 ====== */
.traveler-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-popup);
  max-height: 55vh;
  overflow-y: auto;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 -8px 40px rgba(15, 37, 51, 0.18);
  padding: var(--space-3) var(--space-5) var(--space-6);
}

.drawer__close {
  display: block;
  margin: 0 auto var(--space-3);
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
}

/* 游者头部 */
.drawer__hero {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.drawer__avatar {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-round);
  border: 3px solid var(--color-accent);
  box-shadow: 0 4px 16px rgba(200, 169, 110, 0.25);
}

.drawer__hero-text { flex: 1; }
.drawer__name {
  font: var(--text-h2);
  color: var(--color-primary-dark);
  margin-bottom: var(--space-1);
}
.drawer__bio {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
  font-style: italic;
}
.drawer__stats {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.drawer__stats i { color: var(--color-accent); margin-right: 2px; }

/* 照片墙 */
.drawer__photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.drawer__photo {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

/* 记忆列表 */
.drawer__section-title {
  font: var(--text-h3);
  color: var(--color-primary);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-accent-light);
}
.drawer__section-title i { color: var(--color-accent); margin-right: var(--space-2); }

.drawer__memory-card {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--duration-fast);
  align-items: center;
}
.drawer__memory-card:hover {
  background: rgba(200, 169, 110, 0.08);
  border-color: var(--color-accent);
  transform: translateX(4px);
}

.drawer__memory-img {
  width: 70px;
  height: 56px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
}
.drawer__memory-img img { width: 100%; height: 100%; object-fit: cover; }

.drawer__memory-info { flex: 1; min-width: 0; }
.drawer__memory-info h4 {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--color-primary-dark);
  margin-bottom: 2px;
}
.drawer__memory-info p { font-size: 11px; }
.drawer__memory-excerpt {
  font-size: 11px;
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.drawer__memory-arrow {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  opacity: 0;
  transition: all var(--duration-fast);
}
.drawer__memory-card:hover .drawer__memory-arrow {
  opacity: 1;
  color: var(--color-accent);
}

/* ====== 动画 ====== */
.slide-up-enter-active { transition: all var(--duration-slow) var(--ease-spring); }
.slide-up-leave-active { transition: all var(--duration-normal) var(--ease-in); }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(100%); }

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .home-page__stats {
    top: 72px;
  }
  .home-page__back-btn {
    top: 72px;
    left: var(--space-3);
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
  }
  .preview__image { width: 80px; height: 60px; }
  .drawer__photos { grid-template-columns: repeat(2, 1fr); }
  .drawer__hero { flex-direction: column; text-align: center; }
  .drawer__stats { justify-content: center; }
  .traveler-drawer { max-height: 65vh; }
}
</style>
