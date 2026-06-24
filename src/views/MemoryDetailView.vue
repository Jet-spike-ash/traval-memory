<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { marked } from 'marked'
import { formatDateCN, formatDateTimeCN, getSeasonCN, getYear } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const route = useRoute()
const router = useRouter()
const memoryStore = useMemoryStore()

// 根据来源决定返回路径
const backPath = computed(() => {
  if (route.query.from === 'explore') return '/about'
  if (route.query.from === 'traveler' && route.query.tid) return `/traveler/${route.query.tid}`
  if (route.query.from === 'favorites') return '/favorites'
  if (route.query.from === 'timeline') return '/timeline'
  return '/home'
})
const userStore = useUserStore()
const uiStore = useUiStore()

const memory = ref(null)
const loading = ref(true)
const currentImageIdx = ref(0)
const touchStartX = ref(0)

// 天气映射
const weatherMap = {
  sunny: { label: '晴', icon: 'fa-sun', color: '#D9A05B' },
  rain: { label: '雨', icon: 'fa-cloud-rain', color: '#5A7D9A' },
  snow: { label: '雪', icon: 'fa-snowflake', color: '#5A7D9A' },
  cloudy: { label: '多云', icon: 'fa-cloud', color: '#8C7C6B' },
  fog: { label: '雾', icon: 'fa-smog', color: '#8C7C6B' },
  wind: { label: '风', icon: 'fa-wind', color: '#5A7D9A' },
}

const weatherInfo = computed(() => weatherMap[memory.value?.weather_type] || weatherMap.sunny)

// 加载记忆
async function loadMemory() {
  loading.value = true
  const id = Number(route.params.id)
  if (!id) {
    uiStore.showToast('无效的记忆 ID', 'error')
    router.push(backPath.value)
    return
  }

  try {
    // 先检查 store 中是否已有
    const cached = memoryStore.memories.find((m) => m.id === id)
    if (cached) {
      memory.value = cached
    } else {
      memory.value = await memoryStore.fetchMemoryById(id)
    }
    if (!memory.value) {
      uiStore.showToast('记忆未找到', 'error')
      router.push(backPath.value)
    }
  } catch (err) {
    uiStore.showToast('加载记忆失败', 'error')
  } finally {
    loading.value = false
  }
}

// Markdown 渲染
const renderedStory = computed(() => {
  if (!memory.value?.story) return ''
  try {
    return marked.parse(memory.value.story)
  } catch {
    return memory.value.story.replace(/\n/g, '<br>')
  }
})

// 图片轮播
const images = computed(() => memory.value?.images || [])
const hasMultipleImages = computed(() => images.value.length > 1)

function prevImage() {
  currentImageIdx.value =
    currentImageIdx.value === 0 ? images.value.length - 1 : currentImageIdx.value - 1
}

function nextImage() {
  currentImageIdx.value =
    currentImageIdx.value === images.value.length - 1 ? 0 : currentImageIdx.value + 1
}

function goToImage(idx) {
  currentImageIdx.value = idx
}

// 触摸滑动
function onTouchStart(e) {
  touchStartX.value = e.touches[0].clientX
}

function onTouchEnd(e) {
  const diff = touchStartX.value - e.changedTouches[0].clientX
  if (Math.abs(diff) > 50) {
    diff > 0 ? nextImage() : prevImage()
  }
}

// 键盘导航
function onKeydown(e) {
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'Escape') router.push(backPath.value)
}

onMounted(async () => {
  await loadMemory()
  window.addEventListener('keydown', onKeydown)
})

watch(() => route.params.id, loadMemory)

import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="detail-page">
    <AppHeader />

    <Loader :visible="loading" text="加载记忆..." />

    <main v-if="!loading && memory" class="detail-page__main">
      <!-- 返回按钮 -->
      <button class="detail-page__back" @click="router.push(backPath)">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>

      <!-- 左栏：图片轮播 -->
      <section class="detail-page__gallery">
        <div
          class="gallery__carousel"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <div class="gallery__slides" :style="{ transform: `translateX(-${currentImageIdx * 100}%)` }">
            <div v-for="(img, idx) in images" :key="idx" class="gallery__slide">
              <img :src="img" :alt="`照片 ${idx + 1}`" loading="lazy" />
            </div>
          </div>

          <!-- 轮播控制 -->
          <button v-if="hasMultipleImages" class="gallery__arrow gallery__arrow--left" @click="prevImage">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button v-if="hasMultipleImages" class="gallery__arrow gallery__arrow--right" @click="nextImage">
            <i class="fa-solid fa-chevron-right"></i>
          </button>

          <!-- 图片计数器 -->
          <div v-if="hasMultipleImages" class="gallery__counter">
            {{ currentImageIdx + 1 }} / {{ images.length }}
          </div>

          <!-- 缩略图导航 -->
          <div v-if="hasMultipleImages" class="gallery__thumbnails">
            <button
              v-for="(img, idx) in images"
              :key="idx"
              class="gallery__thumb"
              :class="{ 'gallery__thumb--active': idx === currentImageIdx }"
              @click="goToImage(idx)"
            >
              <img :src="img" :alt="`缩略图 ${idx + 1}`" />
            </button>
          </div>
        </div>
      </section>

      <!-- 右栏：信息 -->
      <section class="detail-page__info">
        <!-- 标题与日期 -->
        <div class="info__header">
          <span class="info__year-badge">{{ getYear(memory.happened_date) }}</span>
          <h1 class="info__title">{{ memory.title }}</h1>
          <p class="info__date text-muted">
            <i class="fa-solid fa-calendar"></i>
            {{ formatDateCN(memory.happened_date) }}
          </p>
        </div>

        <!-- 位置 -->
        <div class="info__location glass">
          <i class="fa-solid fa-location-dot"></i>
          <span>{{ memory.location_name }}</span>
        </div>

        <!-- 元数据网格 -->
        <div class="info__meta-grid">
          <div class="meta-item">
            <i class="fa-solid" :class="weatherInfo.icon" :style="{ color: weatherInfo.color }"></i>
            <div>
              <span class="meta-item__label">天气</span>
              <span class="meta-item__value">{{ weatherInfo.label }}</span>
            </div>
          </div>
          <div class="meta-item">
            <i class="fa-solid fa-leaf" style="color: var(--color-success);"></i>
            <div>
              <span class="meta-item__label">季节</span>
              <span class="meta-item__value">{{ getSeasonCN(memory.happened_date) }}</span>
            </div>
          </div>
          <div class="meta-item">
            <i class="fa-solid fa-earth-americas" style="color: var(--color-info);"></i>
            <div>
              <span class="meta-item__label">纬度</span>
              <span class="meta-item__value">{{ memory.lat?.toFixed(4) }}</span>
            </div>
          </div>
          <div class="meta-item">
            <i class="fa-solid fa-earth-americas" style="color: var(--color-info);"></i>
            <div>
              <span class="meta-item__label">经度</span>
              <span class="meta-item__value">{{ memory.lng?.toFixed(4) }}</span>
            </div>
          </div>
          <div class="meta-item">
            <i class="fa-solid fa-clock" style="color: var(--color-text-muted);"></i>
            <div>
              <span class="meta-item__label">记录时间</span>
              <span class="meta-item__value">{{ formatDateTimeCN(memory.created_at) }}</span>
            </div>
          </div>
          <div class="meta-item">
            <i
              class="fa-solid"
              :class="memory.privacy_level === 1 ? 'fa-lock' : 'fa-earth-americas'"
              :style="{ color: memory.privacy_level === 1 ? 'var(--color-danger)' : 'var(--color-success)' }"
            ></i>
            <div>
              <span class="meta-item__label">隐私</span>
              <span class="meta-item__value">{{ memory.privacy_level === 1 ? '仅自己' : '公开' }}</span>
            </div>
          </div>
        </div>

        <!-- Markdown 故事 -->
        <div class="info__story">
          <h2 class="info__story-title">
            <i class="fa-solid fa-feather"></i> 记忆故事
          </h2>
          <div class="info__story-content" v-html="renderedStory"></div>
        </div>
      </section>
    </main>

    <!-- 空状态 -->
    <div v-if="!loading && !memory" class="detail-page__empty">
      <i class="fa-solid fa-circle-exclamation"></i>
      <p>记忆未找到</p>
      <button class="btn btn--primary" @click="router.push(backPath)">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-top: 64px;
}

.detail-page__main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 64px);
}

.detail-page__back {
  position: fixed;
  top: 76px;
  left: var(--space-5);
  z-index: var(--z-popup);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--color-glass);
  backdrop-filter: blur(8px);
  border: var(--border-width) solid var(--color-border);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  transition: all var(--duration-fast);
}
.detail-page__back:hover {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* ====== 左栏：轮播 ====== */
.detail-page__gallery {
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  background: #0F2533;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.gallery__carousel {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.gallery__slides {
  display: flex;
  height: 100%;
  transition: transform var(--duration-slow) var(--ease-out);
}

.gallery__slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery__slide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gallery__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: var(--radius-round);
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast);
}
.gallery__arrow:hover { background: rgba(255,255,255,0.3); }
.gallery__arrow--left  { left: var(--space-4); }
.gallery__arrow--right { right: var(--space-4); }

.gallery__counter {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-1) var(--space-4);
  border-radius: var(--radius-pill);
  background: rgba(0,0,0,0.5);
  color: #fff;
  font-size: var(--text-xs);
}

.gallery__thumbnails {
  position: absolute;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--space-2);
}

.gallery__thumb {
  width: 48px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.5;
  transition: all var(--duration-fast);
  padding: 0;
}
.gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery__thumb--active {
  border-color: var(--color-accent);
  opacity: 1;
}

/* ====== 右栏：信息 ====== */
.detail-page__info {
  padding: var(--space-6);
  overflow-y: auto;
  max-height: calc(100vh - 64px);
}

.info__header {
  margin-bottom: var(--space-5);
}

.info__year-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--color-accent-light);
  color: var(--color-primary-dark);
  font-size: var(--text-xs);
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.info__title {
  font: var(--text-h1);
  color: var(--color-primary-dark);
}

.info__date {
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}

/* 位置标签 */
.info__location {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-primary);
  margin-bottom: var(--space-5);
}
.info__location i { color: var(--color-accent); }

/* 元数据网格 */
.info__meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.5);
}
.meta-item i { font-size: 18px; }

.meta-item__label {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
}
.meta-item__value {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

/* Markdown 故事 */
.info__story-title {
  font: var(--text-h2);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--color-accent-light);
}
.info__story-title i { color: var(--color-accent); margin-right: var(--space-2); }

.info__story-content {
  font: var(--text-body);
  line-height: 1.8;
  color: var(--color-text-secondary);
}
/* Markdown 样式 */
.info__story-content :deep(h1),
.info__story-content :deep(h2),
.info__story-content :deep(h3) {
  font-family: var(--font-serif);
  color: var(--color-primary);
  margin: var(--space-4) 0 var(--space-2);
}
.info__story-content :deep(p) { margin-bottom: var(--space-3); }
.info__story-content :deep(ul),
.info__story-content :deep(ol) { padding-left: var(--space-5); margin-bottom: var(--space-3); }
.info__story-content :deep(li) { margin-bottom: var(--space-1); }
.info__story-content :deep(blockquote) {
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-4);
  color: var(--color-text-muted);
  font-style: italic;
  margin: var(--space-3) 0;
}
.info__story-content :deep(code) {
  background: var(--color-accent-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.9em;
}
.info__story-content :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
  margin: var(--space-3) 0;
}

/* ====== 空状态 ====== */
.detail-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--space-4);
  color: var(--color-text-muted);
}
.detail-page__empty i { font-size: 48px; }

.btn--primary {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

/* ====== 响应式 ====== */
@media (max-width: 1024px) {
  .detail-page__main {
    grid-template-columns: 1fr;
  }
  .detail-page__gallery {
    position: relative;
    top: 0;
    height: 50vh;
    min-height: 320px;
  }
  .detail-page__info {
    max-height: none;
  }
  .info__meta-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
