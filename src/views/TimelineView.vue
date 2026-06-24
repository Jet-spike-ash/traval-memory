<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { formatDateCN, getSeasonCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const loading = ref(true)
const activeYear = ref(null)
const deleting = ref(null)

async function handleDelete(memory, e) {
  e.stopPropagation()
  if (deleting.value) return
  uiStore.showModal({
    title: '确认删除',
    content: `确定要删除「${memory.title}」吗？此操作不可恢复。`,
    confirmText: '删除',
    cancelText: '取消',
    onConfirm: async () => {
      deleting.value = memory.id
      try {
        await memoryStore.deleteMemory(memory.id)
      } catch {
        // toast 已在 store 中处理
      }
      deleting.value = null
    },
  })
}

function getWeatherIcon(type) {
  const m = { sunny: 'fa-sun', rain: 'fa-cloud-rain', snow: 'fa-snowflake', cloudy: 'fa-cloud', fog: 'fa-smog', wind: 'fa-wind' }
  return m[type] || 'fa-cloud-sun'
}

function scrollToYear(year) {
  activeYear.value = year
  const el = document.getElementById(`year-${year}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  if (!userStore.userId) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  loading.value = false
})
</script>

<template>
  <div class="timeline-page">
    <AppHeader />
    <Loader :visible="loading" text="铺展时光卷轴..." />

    <main v-if="!loading" class="timeline-page__body">
      <!-- 左侧年份索引 -->
      <aside class="timeline-page__sidebar">
        <nav class="year-nav">
          <button
            v-for="group in memoryStore.memoriesByYear"
            :key="group.year"
            class="year-nav__btn"
            :class="{ 'year-nav__btn--active': activeYear === group.year }"
            @click="scrollToYear(group.year)"
          >
            <span class="year-nav__digit">{{ group.year }}</span>
            <span class="year-nav__count">{{ group.items.length }} 篇</span>
          </button>
        </nav>
      </aside>

      <!-- 右侧卡片流 -->
      <section class="timeline-page__content">
        <h1 class="timeline__title">
          <i class="fa-solid fa-timeline"></i> 时光·纵向时间线
        </h1>
        <p class="text-muted timeline__subtitle">
          共 {{ memoryStore.memoryCount }} 段记忆，跨越 {{ memoryStore.memoriesByYear.length }} 个年份
        </p>

        <!-- 时间线条 -->
        <div class="timeline-line"></div>

        <div
          v-for="group in memoryStore.memoriesByYear"
          :key="group.year"
          :id="`year-${group.year}`"
          class="year-section"
        >
          <!-- 年份标题 -->
          <div class="year-section__header">
            <div class="year-section__dot"></div>
            <h2 class="year-section__year">{{ group.year }}</h2>
            <span class="year-section__count text-muted">{{ group.items.length }} 段记忆</span>
          </div>

          <!-- 记忆卡片 -->
          <div class="year-cards">
            <article
              v-for="m in group.items"
              :key="m.id"
              class="timeline-card glass"
              @click="router.push(`/memory/${m.id}?from=timeline`)"
            >
              <div class="timeline-card__image">
                <img v-if="m.images?.length" :src="m.images[0]" :alt="m.title" loading="lazy" />
                <div v-else class="timeline-card__img-plh"><i class="fa-solid fa-image"></i></div>
              </div>
              <div class="timeline-card__body">
                <div class="timeline-card__badges">
                  <span class="badge badge--date">
                    <i class="fa-solid fa-calendar"></i> {{ formatDateCN(m.happened_date) }}
                  </span>
                  <span class="badge badge--season">
                    <i class="fa-solid fa-leaf"></i> {{ getSeasonCN(m.happened_date) }}
                  </span>
                  <span class="badge badge--weather">
                    <i class="fa-solid" :class="getWeatherIcon(m.weather_type)"></i>
                  </span>
                </div>
                <h3 class="timeline-card__title">{{ m.title }}</h3>
                <p class="timeline-card__location text-muted">
                  <i class="fa-solid fa-location-dot"></i> {{ m.location_name }}
                </p>
                <p class="timeline-card__excerpt text-muted">
                  {{ m.story?.replace(/[#*`\n]/g, ' ').slice(0, 100) }}...
                </p>
              </div>
              <div class="timeline-card__actions">
                <button
                  class="timeline-card__delete"
                  :disabled="deleting === m.id"
                  @click="handleDelete(m, $event)"
                  title="删除这段记忆"
                >
                  <i v-if="deleting === m.id" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </article>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="memoryStore.memoriesByYear.length === 0" class="timeline__empty">
          <i class="fa-solid fa-book-open"></i>
          <p>还没有记忆，去 <router-link to="/memory/add">镌刻第一段记忆</router-link> 吧</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.timeline-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-top: 64px;
}

.timeline-page__body {
  display: grid;
  grid-template-columns: 180px 1fr;
  max-width: 1100px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}

/* ====== 左侧年份索引 ====== */
.timeline-page__sidebar {
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  padding: var(--space-5) var(--space-3);
  border-right: 1px solid var(--color-border);
}

.year-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.year-nav__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
  color: var(--color-text-muted);
}
.year-nav__btn:hover {
  background: rgba(200, 169, 110, 0.1);
  color: var(--color-primary);
}
.year-nav__btn--active {
  background: var(--color-accent-light);
  color: var(--color-primary-dark);
}

.year-nav__digit {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
}
.year-nav__count {
  font-size: 11px;
  opacity: 0.6;
}

/* ====== 右侧内容 ====== */
.timeline-page__content {
  padding: var(--space-6) var(--space-6);
  position: relative;
}

.timeline__title {
  font: var(--text-h1);
  color: var(--color-primary-dark);
  margin-bottom: var(--space-1);
}
.timeline__title i { color: var(--color-accent); margin-right: var(--space-2); }

.timeline__subtitle {
  margin-bottom: var(--space-6);
}

/* 时间线条 */
.timeline-line {
  position: absolute;
  left: calc(var(--space-6) + 16px);
  top: 150px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--color-accent), var(--color-border));
}

/* ====== 年份区块 ====== */
.year-section {
  position: relative;
  margin-bottom: var(--space-7);
}

.year-section__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  position: relative;
}

.year-section__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px var(--color-accent-light);
  position: absolute;
  left: -32px;
}

.year-section__year {
  font: var(--text-h2);
  color: var(--color-primary-dark);
  margin-left: var(--space-2);
}

.year-section__count {
  font-size: var(--text-xs);
}

/* ====== 卡片 ====== */
.year-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-left: var(--space-2);
}

.timeline-card {
  display: flex;
  overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}
.timeline-card:hover {
  transform: translateX(8px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-accent);
}

.timeline-card__image {
  width: 160px;
  min-height: 120px;
  flex-shrink: 0;
  overflow: hidden;
}
.timeline-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow);
}
.timeline-card:hover .timeline-card__image img {
  transform: scale(1.05);
}

.timeline-card__img-plh {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-light);
  color: var(--color-text-muted);
  font-size: 24px;
  min-height: 120px;
}

.timeline-card__body {
  flex: 1;
  padding: var(--space-4);
  min-width: 0;
}

.timeline-card__badges {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-light);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.badge i { margin-right: 2px; }

.timeline-card__title {
  font: var(--text-h3);
  margin-bottom: var(--space-1);
}

.timeline-card__location {
  font-size: var(--text-xs);
  margin-bottom: var(--space-1);
}

.timeline-card__excerpt {
  font-size: var(--text-xs);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.timeline-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-right: var(--space-4);
}

.timeline-card__delete {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 14px;
  opacity: 0;
  transition: all var(--duration-fast);
  flex-shrink: 0;
}
.timeline-card:hover .timeline-card__delete {
  opacity: 1;
}
.timeline-card__delete:hover {
  background: var(--color-danger);
  color: #fff;
}
.timeline-card__delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timeline__empty {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.timeline__empty i { font-size: 48px; margin-bottom: var(--space-3); display: block; }
.timeline__empty a { color: var(--color-accent); text-decoration: underline; }

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .timeline-page__body {
    grid-template-columns: 1fr;
  }
  .timeline-page__sidebar {
    display: none;
  }
  .timeline-card {
    flex-direction: column;
  }
  .timeline-card__image {
    width: 100%;
    height: 180px;
  }
  .timeline-line {
    left: 16px;
  }
  .year-section__dot {
    left: -25px;
  }
}
</style>
