<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const memoryStore = useMemoryStore()
const userStore = useUserStore()
const loading = ref(true)
const sliderPos = ref(50)
const leftIdx = ref(0)
const rightIdx = ref(1)

// 同月不同年的记忆对
const pairs = computed(() => {
  const memories = memoryStore.memories
  const byMonth = {}
  memories.forEach((m) => {
    const month = new Date(m.happened_date).getMonth()
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(m)
  })
  // 找出有多条记忆的月份
  const result = []
  Object.entries(byMonth).forEach(([, items]) => {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].happened_date.slice(0, 4) !== items[j].happened_date.slice(0, 4)) {
          result.push([items[i], items[j]])
        }
      }
    }
  })
  return result
})

const leftMemory = computed(() => pairs.value[leftIdx.value]?.[0])
const rightMemory = computed(() => pairs.value[rightIdx.value]?.[1])
const hasPairs = computed(() => pairs.value.length > 0)

function prevPair() {
  rightIdx.value = (rightIdx.value - 1 + pairs.value.length) % pairs.value.length
  leftIdx.value = (leftIdx.value - 1 + pairs.value.length) % pairs.value.length
}

function nextPair() {
  leftIdx.value = (leftIdx.value + 1) % pairs.value.length
  rightIdx.value = (rightIdx.value + 1) % pairs.value.length
}

function onSliderInput(e) {
  sliderPos.value = Number(e.target.value)
}

onMounted(async () => {
  if (!userStore.userId) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  loading.value = false
})
</script>

<template>
  <div class="compare-page">
    <AppHeader />
    <Loader :visible="loading" text="加载对比..." />

    <main v-if="!loading" class="compare-page__main">
      <h1 class="compare__title">
        <i class="fa-solid fa-code-compare"></i> 叠影·时空对比
      </h1>
      <p class="text-muted compare__subtitle">同一月份的不同年份，时光如何改变了风景</p>

      <!-- 对比画布 -->
      <div v-if="hasPairs" class="compare-stage">
        <!-- 左图 -->
        <div class="compare-image compare-image--left">
          <img v-if="leftMemory?.images?.[0]" :src="leftMemory.images[0]" :alt="leftMemory?.title" />
          <div class="compare-image__label">
            <span class="compare-image__year">{{ leftMemory?.happened_date?.slice(0, 4) }}</span>
            <span>{{ leftMemory?.title }}</span>
          </div>
        </div>
        <!-- 右图（被裁剪） -->
        <div class="compare-image compare-image--right" :style="{ clipPath: `inset(0 0 0 ${sliderPos}%)` }">
          <img v-if="rightMemory?.images?.[0]" :src="rightMemory.images[0]" :alt="rightMemory?.title" />
          <div class="compare-image__label compare-image__label--right">
            <span class="compare-image__year">{{ rightMemory?.happened_date?.slice(0, 4) }}</span>
            <span>{{ rightMemory?.title }}</span>
          </div>
        </div>
        <!-- 滑块 -->
        <div class="compare-slider" :style="{ left: `${sliderPos}%` }">
          <div class="compare-slider__handle">
            <div class="compare-slider__grip">
              <i class="fa-solid fa-grip-lines-vertical"></i>
            </div>
          </div>
        </div>
        <!-- 滑块输入 -->
        <input
          type="range"
          min="5"
          max="95"
          :value="sliderPos"
          class="compare-slider__input"
          @input="onSliderInput"
        />
      </div>

      <!-- 无数据 -->
      <div v-else class="compare__empty">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>需要至少两个月各有两条不同年份的记忆才能对比。去 <router-link to="/memory/add">添加更多记忆</router-link> 吧</p>
      </div>

      <!-- 切换按钮 -->
      <div v-if="hasPairs" class="compare-actions">
        <button class="btn btn--ghost" @click="prevPair">
          <i class="fa-solid fa-chevron-left"></i> 上一组
        </button>
        <div class="compare-info">
          <span class="compare-info__month">
            📅 {{ leftMemory ? new Date(leftMemory.happened_date).getMonth() + 1 : '-' }} 月
          </span>
          <span class="text-muted">—</span>
          <span>{{ leftMemory?.location_name?.split('·')[0] }}</span>
          <span class="text-muted">vs</span>
          <span>{{ rightMemory?.location_name?.split('·')[0] }}</span>
        </div>
        <button class="btn btn--ghost" @click="nextPair">
          下一组 <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.compare-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-top: 64px;
}

.compare-page__main {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-6);
}

.compare__title {
  font: var(--text-h1);
  color: var(--color-primary-dark);
  text-align: center;
}
.compare__title i { color: var(--color-accent); margin-right: var(--space-2); }
.compare__subtitle { text-align: center; margin-bottom: var(--space-5); }

/* ====== 对比舞台 ====== */
.compare-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  min-height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-5);
}

.compare-image {
  position: absolute;
  inset: 0;
}
.compare-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.compare-image__label {
  position: absolute;
  bottom: var(--space-4);
  left: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: rgba(15, 37, 51, 0.7);
  color: #fff;
  font-size: var(--text-sm);
  backdrop-filter: blur(4px);
}
.compare-image__label--right { left: auto; right: var(--space-4); }

.compare-image__year {
  font-weight: 700;
  font-family: var(--font-serif);
  font-size: 20px;
  margin-right: var(--space-2);
}

/* ====== 滑块 ====== */
.compare-slider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #fff;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
  pointer-events: none;
}

.compare-slider__handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: ew-resize;
}

.compare-slider__grip {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-round);
  background: #fff;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 16px;
}

.compare-slider__input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: ew-resize;
}

/* ====== 按钮 ====== */
.compare-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.compare-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
.compare-info__month { font-weight: 600; color: var(--color-primary); }

.btn {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-pill);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--duration-fast);
}

.btn--ghost {
  background: transparent;
  border: 2px solid var(--color-border);
  color: var(--color-text-secondary);
}
.btn--ghost:hover { border-color: var(--color-primary-light); color: var(--color-primary); }

.compare__empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.compare__empty i { font-size: 48px; margin-bottom: var(--space-3); display: block; }
.compare__empty a { color: var(--color-accent); text-decoration: underline; }
</style>
