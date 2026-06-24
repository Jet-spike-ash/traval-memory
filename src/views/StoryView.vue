<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useMap } from '@/composables/useMap'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const userStore = useUserStore()
const { mapInstance, mapReady, initMap, clearMarkers, addMarker, destroyMap } = useMap()

const loading = ref(true)
const playing = ref(false)
const paused = ref(false)
const currentIdx = ref(0)
const photoVisible = ref(false)
const storyText = ref('')
const progress = ref(0)

const mapContainerId = 'story-map'
const photoTimer = 4000 // 每张照片展示 4 秒

// 按时间正序排列
const timeline = computed(() =>
  [...memoryStore.memories].sort(
    (a, b) => new Date(a.happened_date) - new Date(b.happened_date)
  )
)

const currentMemory = computed(() => timeline.value[currentIdx.value] || null)

// 渲染标记
function renderMarkers() {
  clearMarkers()
  timeline.value.forEach((m, i) => {
    addMarker(m.lat, m.lng, null, { color: i === currentIdx.value ? '#C8A96E' : '#8C7C6B' })
  })
}

// 开始播放
async function startStory() {
  if (timeline.value.length === 0 || playing.value) return
  playing.value = true; paused.value = false; currentIdx.value = 0
  renderMarkers()
  await playNext()
}

function pauseStory() {
  paused.value = !paused.value
  if (!paused.value) playNext()
}

function skipStory(delta) {
  const next = currentIdx.value + delta
  if (next >= 0 && next < timeline.value.length) {
    currentIdx.value = next
    photoVisible.value = false
    renderMarkers()
    playCurrent()
  }
}

function stopStory() {
  playing.value = false; paused.value = false; photoVisible.value = false; storyText.value = ''
}

function playCurrent() {
  if (!playing.value || paused.value) return
  const m = currentMemory.value
  if (!m) { stopStory(); return }

  progress.value = ((currentIdx.value + 1) / timeline.value.length) * 100

  // 飞行动画
  if (mapInstance.value) {
    mapInstance.value.once('moveend', () => {
      photoVisible.value = true
      storyText.value = m.story?.replace(/[#*`]/g, '') || ''
      // 高亮当前标记
      renderMarkers()
    })
    mapInstance.value.flyTo([m.lat, m.lng], 13, { duration: 2 })
  } else {
    photoVisible.value = true
    storyText.value = m.story?.replace(/[#*`]/g, '') || ''
    renderMarkers()
  }
}

async function playNext() {
  if (!playing.value || paused.value) return
  const m = currentMemory.value
  if (!m) { stopStory(); return }

  progress.value = ((currentIdx.value + 1) / timeline.value.length) * 100
  photoVisible.value = false

  if (mapInstance.value) {
    mapInstance.value.flyTo([m.lat, m.lng], 13, { duration: 2 })
    await new Promise((r) => setTimeout(r, 2200))
  }

  if (!playing.value || paused.value) return
  photoVisible.value = true
  storyText.value = m.story?.replace(/[#*`]/g, '') || ''
  renderMarkers()

  // 等待展示时间后再播下一个
  if (currentIdx.value < timeline.value.length - 1) {
    await new Promise((r) => setTimeout(r, photoTimer))
    if (!playing.value || paused.value) return
    currentIdx.value++
    playNext()
  } else {
    // 播放完毕
    await new Promise((r) => setTimeout(r, photoTimer))
    stopStory()
    photoVisible.value = true
    storyText.value = '🎬 旅程结束，共回顾了 ' + timeline.value.length + ' 段记忆'
  }
}

function goToDetail() {
  if (currentMemory.value) router.push(`/memory/${currentMemory.value.id}`)
}

onMounted(async () => {
  for (let i = 0; i < 5 && !userStore.userId; i++) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  initMap(mapContainerId, { zoomControl: false, attributionControl: false })
  if (timeline.value.length) renderMarkers()
  loading.value = false
})

onUnmounted(() => { destroyMap() })
</script>

<template>
  <div class="story-page">
    <AppHeader />
    <Loader :visible="loading" text="准备纪录片..." />

    <main v-if="!loading" class="story-page__main">
      <!-- 全屏地图 -->
      <div :id="mapContainerId" class="story-map"></div>

      <!-- 顶部进度条 -->
      <div v-if="playing" class="story-progress">
        <div class="story-progress__bar" :style="{ width: `${progress}%` }"></div>
      </div>

      <!-- 居中大图漫游 -->
      <Transition name="fade-scale">
        <div v-if="photoVisible && currentMemory" class="story-hero">
          <img
            v-if="currentMemory.images?.length"
            :src="currentMemory.images[0]"
            :alt="currentMemory.title"
            class="story-hero__img"
            @click="goToDetail"
          />
          <div class="story-hero__overlay"></div>
          <div class="story-hero__text">
            <h2>{{ currentMemory.title }}</h2>
            <p>{{ formatDateCN(currentMemory.happened_date) }} · {{ currentMemory.location_name?.split('·')[0] }}</p>
            <p class="story-hero__subtitle">{{ storyText }}</p>
          </div>
          <!-- 控制栏 -->
          <div class="story-hero__controls">
            <button @click="skipStory(-1)" :disabled="currentIdx === 0"><i class="fa-solid fa-backward-step"></i></button>
            <button @click="pauseStory" class="story-hero__play"><i class="fa-solid" :class="paused ? 'fa-play' : 'fa-pause'"></i></button>
            <button @click="skipStory(1)" :disabled="currentIdx >= timeline.length - 1"><i class="fa-solid fa-forward-step"></i></button>
            <span>{{ currentIdx + 1 }} / {{ timeline.length }}</span>
            <button @click="stopStory" class="story-hero__exit"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      </Transition>

      <!-- 未播放时的入口 -->
      <div v-if="!playing" class="story-start glass">
        <div class="story-start__inner">
          <i class="fa-solid fa-clapperboard"></i>
          <h2>{{ timeline.length > 0 ? '🎬 记忆漫游' : '暂无记忆' }}</h2>
          <p class="text-muted">
            {{ timeline.length > 0
              ? `按时间顺序，从 ${timeline[0]?.location_name?.split('·')[0] || '起点'} 到 ${timeline[timeline.length - 1]?.location_name?.split('·')[0] || '终点'}，共 ${timeline.length} 站`
              : '先去添加一些记忆再来吧' }}
          </p>
          <button v-if="timeline.length" class="btn btn--start" @click="startStory">
            <i class="fa-solid fa-play"></i> 开始漫游
          </button>
          <button v-else class="btn btn--start" @click="router.push('/memory/add')">
            <i class="fa-solid fa-plus"></i> 添加记忆
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.story-page { height: 100vh; overflow: hidden; padding-top: 64px; position: relative; background: #0F2533; }
.story-map { width: 100%; height: 100%; z-index: 1; }

/* 进度条 */
.story-progress { position: absolute; top: 64px; left: 0; right: 0; height: 3px; z-index: var(--z-popup); background: rgba(255,255,255,0.15); }
.story-progress__bar { height: 100%; background: var(--color-accent); transition: width 0.4s ease; }

/* 居中大图漫游 */
.story-hero {
  position: absolute; inset: 0; z-index: var(--z-popup);
  display: flex; align-items: center; justify-content: center;
}
.story-hero__img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain;
  background: rgba(0,0,0,0.85); cursor: pointer;
}
.story-hero__overlay {
  position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
  pointer-events: none;
}
.story-hero__text {
  position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%);
  text-align: center; color: #fff; z-index: 2; max-width: 600px; padding: 0 var(--space-4);
}
.story-hero__text h2 {
  font: clamp(24px, 4vw, 40px)/1.2 var(--font-serif);
  text-shadow: 0 2px 12px rgba(0,0,0,0.6);
  margin-bottom: var(--space-2);
}
.story-hero__text p {
  font-size: var(--text-sm); opacity: 0.85;
}
.story-hero__subtitle {
  margin-top: var(--space-4); font-size: var(--text-body);
  opacity: 0.7; max-width: 500px; line-height: 1.6;
}

/* 控制栏 */
.story-hero__controls {
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: var(--space-3); z-index: 3;
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-pill);
  background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
  color: #fff; font-size: var(--text-xs);
}
.story-hero__controls button {
  width: 36px; height: 36px; border-radius: var(--radius-round);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 14px; transition: all var(--duration-fast);
}
.story-hero__controls button:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
.story-hero__controls button:disabled { opacity: 0.3; cursor: not-allowed; }
.story-hero__play { width: 48px !important; height: 48px !important; font-size: 20px !important; background: rgba(255,255,255,0.2) !important; }
.story-hero__exit { margin-left: var(--space-3); }
.story-hero__exit:hover:not(:disabled) { background: rgba(181,90,90,0.6) !important; }

/* 入口 */
.story-start { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: var(--z-overlay); padding: var(--space-6); max-width: 420px; width: 90%; text-align: center; }
.story-start__inner i { font-size: 56px; color: var(--color-accent); margin-bottom: var(--space-4); display: block; }
.story-start__inner h2 { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-2); }

.btn--start {
  margin-top: var(--space-4); padding: var(--space-3) var(--space-6); border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #fff; font-weight: 700; font-size: 18px; display: inline-flex; align-items: center; gap: var(--space-2);
  box-shadow: 0 6px 24px rgba(30,58,77,0.4); transition: all var(--duration-fast);
}
.btn--start:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(30,58,77,0.6); }

/* 动画 */
.fade-scale-enter-active { transition: all 0.6s var(--ease-spring); }
.fade-scale-leave-active { transition: all 0.3s var(--ease-in); }
.fade-scale-enter-from { opacity: 0; transform: translateY(20px) scale(0.95); }
.fade-scale-leave-to { opacity: 0; transform: translateY(-10px) scale(0.98); }

.fade-enter-active { transition: opacity 1s; }
.fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .story-hero__text { bottom: 140px; }
  .story-hero__text h2 { font-size: 24px; }
  .story-hero__subtitle { font-size: var(--text-sm); }
}
</style>
