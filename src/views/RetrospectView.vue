<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { getSeasonCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const loading = ref(true)

const report = computed(() => ({
  total: memoryStore.memoryCount,
  countries: [...new Set(memoryStore.memories.map((m) => m.location_name?.split('·')[0]))],
  years: memoryStore.memoriesByYear.map((g) => ({
    year: g.year,
    count: g.items.length,
    locations: [...new Set(g.items.map((m) => m.location_name))],
    seasons: g.items.reduce((acc, m) => { const s = getSeasonCN(m.happened_date); acc[s] = (acc[s] || 0) + 1; return acc }, {}),
    weathers: g.items.reduce((acc, m) => { acc[m.weather_type] = (acc[m.weather_type] || 0) + 1; return acc }, {}),
    topPhoto: g.items.find((m) => m.images?.length)?.images[0] || null,
  })),
}))

function downloadJSON() {
  const blob = new Blob([JSON.stringify(report.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `memento-report-${new Date().getFullYear()}.json`; a.click()
  uiStore.showToast('年度报告已下载 📊', 'success')
}

onMounted(async () => {
  if (!userStore.userId) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) await memoryStore.fetchMemories(userStore.userId)
  loading.value = false
})
</script>

<template>
  <div class="retrospect-page">
    <AppHeader />
    <Loader :visible="loading" />
    <main v-if="!loading" class="retrospect-page__main container">
      <h1 class="retro__title"><i class="fa-solid fa-clock-rotate-left"></i> 年轮·数据回溯</h1>
      <button class="btn btn--download" @click="downloadJSON">📥 导出年度报告 JSON</button>

      <div class="retro__summary glass">
        <p>📊 总计 <strong>{{ report.total }}</strong> 段记忆，覆盖 <strong>{{ report.countries.length }}</strong> 个国家/地区，跨越 <strong>{{ report.years.length }}</strong> 个年份</p>
      </div>

      <div v-for="y in report.years" :key="y.year" class="retro-year glass">
        <div class="retro-year__header">
          <img v-if="y.topPhoto" :src="y.topPhoto" class="retro-year__cover" />
          <h2>{{ y.year }}</h2>
          <span class="text-muted">{{ y.count }} 段记忆</span>
        </div>
        <div class="retro-year__detail">
          <p><strong>📍 足迹：</strong>{{ y.locations.join('、') }}</p>
          <p><strong>🍂 季节：</strong>
            <span v-for="(v, k) in y.seasons" :key="k">{{ k }}季 {{ v }}次 </span>
          </p>
          <p><strong>🌤️ 天气：</strong>
            <span v-for="(v, k) in y.weathers" :key="k">{{ k }} {{ v }}次 </span>
          </p>
        </div>
      </div>

      <div v-if="report.years.length === 0" class="retro__empty text-muted">
        <p>还没有数据</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.retrospect-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.retrospect-page__main { padding: var(--space-6); max-width: 800px; }
.retro__title { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-4); }
.retro__title i { color: var(--color-accent); }

.btn--download {
  padding: var(--space-2) var(--space-5); background: var(--color-primary); color: #fff;
  border-radius: var(--radius-pill); font-weight: 600; margin-bottom: var(--space-5);
}

.retro__summary { padding: var(--space-4); margin-bottom: var(--space-5); text-align: center; }

.retro-year { padding: var(--space-4); margin-bottom: var(--space-4); }
.retro-year__header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-3); }
.retro-year__cover { width: 100px; height: 70px; border-radius: var(--radius-sm); object-fit: cover; }
.retro-year__header h2 { font: var(--text-h2); }
.retro-year__detail { font-size: var(--text-sm); color: var(--color-text-secondary); display: flex; flex-direction: column; gap: var(--space-1); }

.retro__empty { text-align: center; padding: var(--space-8); }
</style>
