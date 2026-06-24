<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { getSeasonCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const userStore = useUserStore()
const loading = ref(true)

const seasonOrder = ['spring', 'summer', 'autumn', 'winter']
const seasonColors = { spring: '#7A9A7E', summer: '#D97A5A', autumn: '#C67A4A', winter: '#5A7D9A' }
const seasonIcons = { spring: 'fa-seedling', summer: 'fa-sun', autumn: 'fa-leaf', winter: 'fa-snowflake' }
const seasonLabels = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }

const grouped = computed(() => {
  const groups = { spring: [], summer: [], autumn: [], winter: [] }
  memoryStore.memories.forEach((m) => {
    const s = getSeasonCN(m.happened_date)
    if (s === '春') groups.spring.push(m)
    else if (s === '夏') groups.summer.push(m)
    else if (s === '秋') groups.autumn.push(m)
    else groups.winter.push(m)
  })
  return groups
})

onMounted(async () => {
  if (!userStore.userId) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  loading.value = false
})
</script>

<template>
  <div class="seasons-page">
    <AppHeader />
    <Loader :visible="loading" />
    <main v-if="!loading" class="seasons-page__main container">
      <h1 class="seasons__title"><i class="fa-solid fa-tree"></i> 四时·四季图鉴</h1>

      <div v-for="season in seasonOrder" :key="season" class="season-section">
        <div class="season-section__header" :style="{ borderColor: seasonColors[season] }">
          <i class="fa-solid" :class="seasonIcons[season]" :style="{ color: seasonColors[season] }"></i>
          <h2>{{ seasonLabels[season] }} · {{ grouped[season].length }} 篇</h2>
        </div>

        <!-- 瀑布流 -->
        <div class="waterfall" v-if="grouped[season].length">
          <div
            v-for="m in grouped[season]"
            :key="m.id"
            class="waterfall-card glass"
            @click="router.push(`/memory/${m.id}`)"
          >
            <div class="waterfall-card__image">
              <img v-if="m.images?.length" :src="m.images[0]" :alt="m.title" loading="lazy" />
              <div v-else class="waterfall-card__ph"><i class="fa-solid fa-image"></i></div>
            </div>
            <div class="waterfall-card__body">
              <h3>{{ m.title }}</h3>
              <p class="text-muted" style="font-size:12px;">{{ m.location_name }}</p>
            </div>
          </div>
        </div>
        <div v-else class="season-empty text-muted">这个季节还没有记忆</div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.seasons-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.seasons-page__main { padding: var(--space-6); max-width: var(--container-max); }
.seasons__title { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-6); }
.seasons__title i { color: var(--color-accent); }

.season-section { margin-bottom: var(--space-6); }
.season-section__header { display: flex; align-items: center; gap: var(--space-2); padding-bottom: var(--space-2); margin-bottom: var(--space-4); border-bottom: 3px solid; }
.season-section__header h2 { font: var(--text-h2); }
.season-section__header i { font-size: 22px; }

/* 瀑布流 */
.waterfall {
  columns: 3;
  column-gap: var(--space-4);
}

.waterfall-card {
  break-inside: avoid;
  margin-bottom: var(--space-4);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--duration-fast);
}
.waterfall-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }

.waterfall-card__image { width: 100%; overflow: hidden; }
.waterfall-card__image img { width: 100%; display: block; transition: transform var(--duration-slow); }
.waterfall-card:hover .waterfall-card__image img { transform: scale(1.03); }

.waterfall-card__ph {
  width: 100%; height: 160px; display: flex; align-items: center; justify-content: center;
  background: var(--color-accent-light); color: var(--color-text-muted); font-size: 32px;
}

.waterfall-card__body { padding: var(--space-3); }
.waterfall-card__body h3 { font: var(--text-h3); font-size: 16px; }

.season-empty { text-align: center; padding: var(--space-4); }

@media (max-width: 768px) {
  .waterfall { columns: 2; }
}
@media (max-width: 480px) {
  .waterfall { columns: 1; }
}
</style>
