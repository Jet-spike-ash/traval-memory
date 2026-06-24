<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { formatDateCN, getSeasonCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const userStore = useUserStore()
const loading = ref(true)
const flipped = ref(false)
const drawing = ref(false)
const currentMemory = ref(null)

function getWeatherIcon(type) {
  const m = { sunny: 'fa-sun', rain: 'fa-cloud-rain', snow: 'fa-snowflake', cloudy: 'fa-cloud', fog: 'fa-smog', wind: 'fa-wind' }
  return m[type] || 'fa-cloud-sun'
}

/** 随机抽取 */
function drawMemory() {
  if (drawing.value || memoryStore.memories.length === 0) return
  drawing.value = true
  flipped.value = false

  // 快速轮播效果
  let count = 0
  const max = 12
  const interval = setInterval(() => {
    const idx = Math.floor(Math.random() * memoryStore.memories.length)
    currentMemory.value = memoryStore.memories[idx]
    count++
    if (count >= max) {
      clearInterval(interval)
      setTimeout(() => {
        flipped.value = true
        drawing.value = false
      }, 400)
    }
  }, 100)
}

onMounted(async () => {
  if (!userStore.userId) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  loading.value = false
  // 初始显示一个随机记忆
  if (memoryStore.memories.length > 0) {
    currentMemory.value = memoryStore.memories[Math.floor(Math.random() * memoryStore.memories.length)]
    flipped.value = true
  }
})
</script>

<template>
  <div class="blindbox-page">
    <AppHeader />
    <Loader :visible="loading" text="准备记忆盲盒..." />

    <main v-if="!loading" class="blindbox-page__main">
      <h1 class="blindbox__title">
        <i class="fa-solid fa-gift"></i> 邂逅·记忆盲盒
      </h1>

      <!-- 盲盒卡片区 -->
      <div class="blindbox-stage">
        <!-- 3D 翻转卡片 -->
        <div class="flip-card" :class="{ 'flip-card--flipped': flipped, 'flip-card--shuffling': drawing }">
          <div class="flip-card__inner">
            <!-- 正面：盲盒（未翻开） -->
            <div class="flip-card__front glass">
              <div class="flip-card__mystery">
                <div class="mystery-box">
                  <i class="fa-solid fa-cube mystery-icon"></i>
                  <div class="mystery-sparkles">
                    <span v-for="n in 6" :key="n" class="sparkle"></span>
                  </div>
                </div>
                <p class="mystery-text">{{ drawing ? '抽取中...' : '点击下方按钮' }}</p>
                <p class="mystery-hint text-muted">随机开启一段记忆</p>
              </div>
            </div>
            <!-- 背面：记忆详情（翻开后） -->
            <div class="flip-card__back glass" v-if="currentMemory">
              <div class="flip-card__image">
                <img v-if="currentMemory.images?.length" :src="currentMemory.images[0]" :alt="currentMemory.title" />
                <div v-else class="flip-card__img-plh"><i class="fa-solid fa-image"></i></div>
              </div>
              <div class="flip-card__info">
                <h2>{{ currentMemory.title }}</h2>
                <div class="flip-card__meta">
                  <span><i class="fa-solid fa-calendar"></i> {{ formatDateCN(currentMemory.happened_date) }}</span>
                  <span><i class="fa-solid fa-leaf"></i> {{ getSeasonCN(currentMemory.happened_date) }}</span>
                  <span><i class="fa-solid" :class="getWeatherIcon(currentMemory.weather_type)"></i></span>
                </div>
                <p class="flip-card__location text-muted">
                  <i class="fa-solid fa-location-dot"></i> {{ currentMemory.location_name }}
                </p>
                <p class="flip-card__story text-muted">
                  {{ currentMemory.story?.replace(/[#*`\n]/g, ' ').slice(0, 150) }}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="blindbox-actions">
        <button class="btn btn--draw" :disabled="drawing" @click="drawMemory">
          <i class="fa-solid fa-shuffle"></i>
          {{ drawing ? '抽取中...' : '🎲 再抽一次' }}
        </button>
        <button
          v-if="currentMemory"
          class="btn btn--visit"
          @click="router.push(`/memory/${currentMemory.id}`)"
        >
          <i class="fa-solid fa-arrow-right"></i> 查看详情
        </button>
      </div>

      <!-- 记忆总数 -->
      <p class="blindbox__count text-muted">
        盲盒中藏有 <strong>{{ memoryStore.memoryCount }}</strong> 段记忆等待发现
      </p>

      <div v-if="memoryStore.memoryCount === 0" class="blindbox__empty">
        <i class="fa-solid fa-box-open"></i>
        <p>还没有记忆可以抽取，去 <router-link to="/memory/add">添加记忆</router-link> 吧</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.blindbox-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0F2533 0%, #1E3A4D 50%, #0F2533 100%);
  padding-top: 64px;
  color: #fff;
}

.blindbox-page__main {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--space-6);
  text-align: center;
}

.blindbox__title {
  font: var(--text-h1);
  color: var(--color-accent-light);
  margin-bottom: var(--space-5);
}
.blindbox__title i { color: var(--color-accent); }

/* ====== 3D 翻转卡片 ====== */
.blindbox-stage {
  perspective: 1200px;
  margin-bottom: var(--space-5);
}

.flip-card {
  width: 100%;
  max-width: 500px;
  height: 380px;
  margin: 0 auto;
}

.flip-card__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card--flipped .flip-card__inner {
  transform: rotateY(180deg);
}

.flip-card--shuffling .flip-card__inner {
  animation: shuffle-bounce 0.1s ease-in-out infinite;
}

@keyframes shuffle-bounce {
  0%, 100% { transform: rotateY(0deg) scale(1); }
  50% { transform: rotateY(10deg) scale(0.97); }
}

.flip-card__front,
.flip-card__back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.flip-card__front {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(200, 169, 110, 0.2);
}

.flip-card__back {
  transform: rotateY(180deg);
}

/* ====== 正面：神秘盲盒 ====== */
.flip-card__mystery {
  text-align: center;
}

.mystery-box {
  position: relative;
  display: inline-block;
  margin-bottom: var(--space-4);
}

.mystery-icon {
  font-size: 80px;
  color: var(--color-accent);
  animation: float-box 3s ease-in-out infinite;
}

@keyframes float-box {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.mystery-sparkles {
  position: absolute;
  inset: -20px;
}

.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: sparkle-fade 1.5s ease-in-out infinite;
}
.sparkle:nth-child(1) { top: 0; left: 50%; animation-delay: 0s; }
.sparkle:nth-child(2) { top: 20%; right: 0; animation-delay: 0.25s; }
.sparkle:nth-child(3) { bottom: 0; left: 50%; animation-delay: 0.5s; }
.sparkle:nth-child(4) { bottom: 20%; left: 0; animation-delay: 0.75s; }
.sparkle:nth-child(5) { top: 50%; right: 10%; animation-delay: 1s; }
.sparkle:nth-child(6) { top: 10%; left: 10%; animation-delay: 1.25s; }

@keyframes sparkle-fade {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.mystery-text {
  font: var(--text-h2);
  color: var(--color-accent-light);
}

.mystery-hint {
  font-size: var(--text-sm);
}

/* ====== 背面：记忆详情 ====== */
.flip-card__image {
  height: 200px;
  overflow: hidden;
}
.flip-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.flip-card__img-plh {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-light);
  color: var(--color-text-muted);
  font-size: 48px;
}

.flip-card__info {
  padding: var(--space-4);
  text-align: left;
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text-primary);
}

.flip-card__info h2 {
  font: var(--text-h3);
  color: var(--color-primary-dark);
}

.flip-card__meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0;
}

.flip-card__location { font-size: var(--text-xs); }
.flip-card__story { font-size: var(--text-xs); line-height: 1.5; margin-top: var(--space-2); }

/* ====== 按钮 ====== */
.blindbox-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-pill);
  font-weight: 600;
  font-size: var(--text-btn);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--duration-fast);
}

.btn--draw {
  background: linear-gradient(135deg, var(--color-accent), #a88b4e);
  color: #fff;
  box-shadow: 0 6px 24px rgba(200, 169, 110, 0.35);
  font-size: 18px;
}
.btn--draw:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(200, 169, 110, 0.5); }
.btn--draw:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--visit {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  color: #fff;
}
.btn--visit:hover { background: rgba(255,255,255,0.22); }

.blindbox__count { margin-top: var(--space-4); font-size: var(--text-sm); color: rgba(255,255,255,0.5); }
.blindbox__count strong { color: var(--color-accent); }

.blindbox__empty {
  margin-top: var(--space-8);
  color: rgba(255,255,255,0.4);
}
.blindbox__empty i { font-size: 48px; display: block; margin-bottom: var(--space-3); }
.blindbox__empty a { color: var(--color-accent); text-decoration: underline; }
</style>
