<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { getSeasonCN, formatDateCN } from '@/utils/date'
import * as echarts from 'echarts'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const memoryStore = useMemoryStore()
const userStore = useUserStore()
const loading = ref(true)
let charts = []

const worldMapRef = ref(null)
const monthlyRef = ref(null)
const weatherRef = ref(null)
const seasonRef = ref(null)
const topLocRef = ref(null)
const privacyRef = ref(null)
const yearCompareRef = ref(null)

const stats = computed(() => {
  const memories = memoryStore.memories
  const countries = [...new Set(memories.map((m) => m.location_name?.split('·')[0]))]
  const totalPhotos = memories.reduce((s, m) => s + (m.images?.length || 0), 0)
  const publicCount = memories.filter((m) => m.privacy_level === 0).length
  const privateCount = memories.filter((m) => m.privacy_level === 1).length
  const locCount = {}
  memories.forEach((m) => { const n = m.location_name?.split('·')[0] || '未知'; locCount[n] = (locCount[n] || 0) + 1 })
  const topLocations = Object.entries(locCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const seasonCount = memories.reduce((acc, m) => { const s = getSeasonCN(m.happened_date); acc[s] = (acc[s] || 0) + 1; return acc }, {})
  const weatherCount = memories.reduce((acc, m) => { acc[m.weather_type] = (acc[m.weather_type] || 0) + 1; return acc }, {})
  const monthlyCount = Array(12).fill(0)
  memories.forEach((m) => { monthlyCount[new Date(m.happened_date).getMonth()]++ })
  const yearData = memoryStore.memoriesByYear.map((g) => ({ year: g.year, count: g.items.length })).reverse()
  const dateRange = memories.length > 0
    ? `${formatDateCN(memories[memories.length - 1]?.happened_date)} — ${formatDateCN(memories[0]?.happened_date)}`
    : '暂无'
  return { memories, countries, totalPhotos, publicCount, privateCount, topLocations, seasonCount, weatherCount, monthlyCount, yearData, dateRange }
})

function makeChart(refEl, option) {
  if (!refEl.value) return null
  try {
    const c = echarts.init(refEl.value)
    charts.push(c)
    c.setOption(option)
    return c
  } catch (e) { console.error('Chart init error:', e); return null }
}

function safeMapData(countries) {
  return countries.map((n) => ({ name: n, value: 1, itemStyle: { areaColor: '#5B8C5A' } }))
}

function initWorldMap() {
  const countries = stats.value.countries
  if (countries.length === 0 || !worldMapRef.value) return
  // 先显示加载中
  const c = echarts.init(worldMapRef.value)
  charts.push(c)
  c.setOption({
    title: { text: '🌍 世界足迹', subtext: '加载地图数据...', left: 'center', top: 'middle',
      textStyle: { fontSize: 14, color: '#5A4F44' }, subtextStyle: { fontSize: 12, color: '#8C7C6B' } },
  })
  // 加载 GeoJSON
  fetch('https://echarts.apache.org/examples/data/asset/geo/world.json')
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
    .then((geo) => {
      echarts.registerMap('world', geo)
      c.setOption({
        title: { text: '🌍 世界足迹', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
        tooltip: { trigger: 'item' },
        series: [{ type: 'map', map: 'world', roam: true, zoom: 1.2, center: [20, 20],
          itemStyle: { areaColor: '#E8D5B5', borderColor: '#fff', borderWidth: 0.5 },
          emphasis: { label: { show: true, color: '#1E3A4D' }, itemStyle: { areaColor: '#C8A96E' } },
          data: safeMapData(countries),
        }],
      })
    })
    .catch((err) => {
      console.warn('[Stats] 地图加载失败，使用柱状图替代:', err.message)
      c.setOption({
        title: { text: '🌍 已探索国家', left: 'center', top: 10, textStyle: { fontSize: 14, color: '#5A4F44' } },
        xAxis: { type: 'category', data: countries, axisLabel: { rotate: 45, fontSize: 10 } },
        yAxis: { type: 'value', show: false },
        series: [{ type: 'bar', data: countries.map(() => 1), itemStyle: { color: '#5B8C5A', borderRadius: [4, 4, 0, 0] } }],
      })
    })
}

function initMonthly() {
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  makeChart(monthlyRef, { title: { text: '📅 月度出行频率', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
    tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: months, axisLabel: { fontSize: 10 } }, yAxis: { type: 'value', show: false },
    series: [{ type: 'bar', barWidth: '60%', data: stats.value.monthlyCount.map((v) => ({ value: v,
      itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{ offset:0, color:'#C8A96E' },{ offset:1, color:'#E8D5B5' }]), borderRadius: [6,6,0,0] } })),
    }], grid: { top: 40, bottom: 20, left: 10, right: 10 },
  })
}

function initWeather() {
  const lm = { sunny:'晴', rain:'雨', snow:'雪', cloudy:'多云', fog:'雾', wind:'风' }
  const cm = { sunny:'#D9A05B', rain:'#5A7D9A', snow:'#A0C4D8', cloudy:'#8C7C6B', fog:'#B5A89A', wind:'#7A9A7E' }
  makeChart(weatherRef, { title: { text: '🌤️ 天气偏好', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)' },
    series: [{ type: 'pie', radius: ['40%','70%'], center: ['50%','55%'],
      data: Object.entries(stats.value.weatherCount).map(([k,v]) => ({ name: lm[k]||k, value: v, itemStyle: { color: cm[k]||'#C8A96E' } })),
      label: { fontSize: 11 }, emphasis: { label: { fontSize: 16, fontWeight: 'bold' } },
    }],
  })
}

function initSeason() {
  const labels = ['春','夏','秋','冬']; const colors = ['#7A9A7E','#D9A05B','#C67A4A','#5A7D9A']; const d = stats.value.seasonCount
  makeChart(seasonRef, { title: { text: '🍂 出行季节', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
    tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: labels }, yAxis: { show: false },
    series: [{ type: 'bar', barWidth: '50%', data: labels.map((l,i) => ({ value: d[l]||0, itemStyle: { color: colors[i], borderRadius: [6,6,0,0] } })) }],
    grid: { top: 40, bottom: 20, left: 10, right: 10 },
  })
}

function initTopLoc() {
  const data = stats.value.topLocations
  if (!data.length) return
  makeChart(topLocRef, { title: { text: '🏆 最常访问目的地', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }, xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', data: data.map((d) => d[0]).reverse(), axisLabel: { fontSize: 10 } },
    series: [{ type: 'bar', barWidth: '50%', data: data.map((d) => ({ value: d[1],
      itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0, [{ offset:0, color:'#3A5F78' },{ offset:1, color:'#5A7D9A' }]), borderRadius: [0,4,4,0] } })),
    }], grid: { top: 35, bottom: 10, left: 60, right: 15 },
  })
}

function initPrivacy() {
  makeChart(privacyRef, { title: { text: '🔒 隐私比例', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} 条 ({d}%)' },
    series: [{ type: 'pie', radius: ['50%','75%'], center: ['50%','55%'],
      data: [
        { name: '公开', value: stats.value.publicCount, itemStyle: { color: '#5B8C5A' } },
        { name: '仅自己', value: stats.value.privateCount, itemStyle: { color: '#B55A5A' } },
      ], label: { fontSize: 12, fontWeight: 600 },
    }],
  })
}

function initYearCompare() {
  const data = stats.value.yearData
  if (data.length < 2) {
    makeChart(yearCompareRef, { title: { text: '📈 年度对比 (需≥2年)', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
      graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '数据不足', fontSize: 16, fill: '#8C7C6B' } } })
    return
  }
  makeChart(yearCompareRef, { title: { text: '📈 年度出行趋势', left: 'center', top: 5, textStyle: { fontSize: 14, color: '#5A4F44' } },
    tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: data.map((d) => String(d.year)), axisLabel: { fontSize: 10 } }, yAxis: { type: 'value', show: false },
    series: [{ type: 'line', data: data.map((d) => d.count), smooth: true, symbol: 'circle', symbolSize: 10,
      lineStyle: { color: '#C8A96E', width: 3 }, itemStyle: { color: '#C8A96E', borderColor: '#fff', borderWidth: 2 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1, [{ offset:0, color:'rgba(200,169,110,0.35)' },{ offset:1, color:'rgba(200,169,110,0.02)' }]) },
    }], grid: { top: 40, bottom: 20, left: 15, right: 15 },
  })
}

function resizeAll() { charts.forEach((c) => { try { c.resize() } catch {} }) }

onMounted(async () => {
  // 等待 Pinia 恢复（最多 2s）
  for (let i = 0; i < 5 && !userStore.userId; i++) {
    await new Promise((r) => setTimeout(r, 400))
  }
  if (userStore.userId) {
    await memoryStore.fetchMemories(userStore.userId)
  }
  console.log('[Stats] userId:', userStore.userId, 'memories:', memoryStore.memories.length)
  loading.value = false
  await nextTick()
  await new Promise((r) => setTimeout(r, 300))
  initWorldMap()
  initMonthly()
  initWeather()
  initSeason()
  initTopLoc()
  initPrivacy()
  initYearCompare()
  window.addEventListener('resize', resizeAll)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeAll)
  charts.forEach((c) => c.dispose())
})
</script>

<template>
  <div class="stats-page">
    <AppHeader />
    <Loader :visible="loading" text="计算数据..." />
    <main v-if="!loading" class="stats-page__main">
      <h1 class="stats__title"><i class="fa-solid fa-chart-pie"></i> 足迹·数据仪表盘</h1>
      <div class="summary-cards">
        <div class="summary-card glass"><span class="summary-card__value">{{ stats.memories.length }}</span><span class="summary-card__label">总记忆</span></div>
        <div class="summary-card glass"><span class="summary-card__value">{{ stats.countries.length }}</span><span class="summary-card__label">个国家/地区</span></div>
        <div class="summary-card glass"><span class="summary-card__value">{{ memoryStore.memoriesByYear.length }}</span><span class="summary-card__label">个年份</span></div>
        <div class="summary-card glass"><span class="summary-card__value">{{ stats.totalPhotos }}</span><span class="summary-card__label">张照片</span></div>
        <div class="summary-card glass"><span class="summary-card__value">{{ stats.publicCount }}</span><span class="summary-card__label">公开记忆</span></div>
        <div class="summary-card glass"><span class="summary-card__value">{{ stats.dateRange }}</span><span class="summary-card__label">时间跨度</span></div>
      </div>
      <div class="chart-card glass chart-card--wide"><div ref="worldMapRef" class="chart-box chart-box--tall"></div></div>
      <div class="charts-grid">
        <div class="chart-card glass"><div ref="monthlyRef" class="chart-box"></div></div>
        <div class="chart-card glass"><div ref="weatherRef" class="chart-box"></div></div>
        <div class="chart-card glass"><div ref="seasonRef" class="chart-box"></div></div>
        <div class="chart-card glass"><div ref="topLocRef" class="chart-box"></div></div>
        <div class="chart-card glass"><div ref="privacyRef" class="chart-box"></div></div>
        <div class="chart-card glass"><div ref="yearCompareRef" class="chart-box"></div></div>
      </div>
      <div v-if="stats.memories.length === 0" class="stats__empty">
        <i class="fa-solid fa-chart-simple"></i>
        <p>还没有数据，去 <router-link to="/memory/add">添加记忆</router-link> 吧</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.stats-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.stats-page__main { max-width: var(--container-max); margin: 0 auto; padding: var(--space-6); }
.stats__title { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-5); }
.stats__title i { color: var(--color-accent); margin-right: var(--space-2); }
.summary-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
.summary-card { text-align: center; padding: var(--space-4); }
.summary-card__value { display: block; font-family: var(--font-serif); font-size: 28px; font-weight: 700; color: var(--color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.summary-card__label { font-size: var(--text-xs); color: var(--color-text-muted); }
.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); margin-top: var(--space-4); }
.chart-card { padding: var(--space-4); min-height: 300px; }
.chart-card--wide { margin-bottom: var(--space-4); }
.chart-box { width: 100%; height: 100%; min-height: 260px; }
.chart-box--tall { min-height: 380px; }
.stats__empty { text-align: center; padding: var(--space-8); color: var(--color-text-muted); }
.stats__empty i { font-size: 48px; margin-bottom: var(--space-3); display: block; }
.stats__empty a { color: var(--color-accent); text-decoration: underline; }
@media (max-width: 1024px) { .summary-cards { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .summary-cards { grid-template-columns: repeat(2, 1fr); } .charts-grid { grid-template-columns: 1fr; } }
</style>
