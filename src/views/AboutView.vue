<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const router = useRouter()
const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const loading = ref(true)
const shuffling = ref(false)
const highlightId = ref(null)
const visitorCount = ref(18)
let visitorTimer = null

const STORAGE_KEY = 'memento_explore_stats'
function loadStats() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} } }
function saveStats(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }

// ---- 收藏 ----
const FA_KEY = 'memento_favorites'
function loadFavs() { try { return JSON.parse(localStorage.getItem(FA_KEY) || '[]') } catch { return [] } }
function saveFavs(list) { localStorage.setItem(FA_KEY, JSON.stringify(list)) }
const favList = ref(loadFavs())
function isFaved(id) { return favList.value.some((f) => f.id === id) }
function getName(uid) {
  const map = { 2: '游牧诗人', 3: '极地探险家', 4: '海岛摄影师', 5: '古城拾荒者', 6: '雪山追光者', 7: '尼罗河行者', 8: '安第斯守望者', 9: '东非草原旅人' }
  return map[uid] || '旅人'
}
function toggleFav(memory, e) {
  e.stopPropagation()
  const list = loadFavs()
  const idx = list.findIndex((f) => f.id === memory.id)
  if (idx >= 0) { list.splice(idx, 1); uiStore.showToast('已取消收藏', 'info') }
  else {
    list.push({ id: memory.id, title: memory.title, image: memory.images?.[0] || '', location: memory.location_name?.split('·')[0] || '', author: getName(memory.user_id), date: memory.happened_date })
    uiStore.showToast('已加入收藏 ⭐', 'success')
  }
  saveFavs(list); favList.value = list
}

const likeStore = ref(loadStats())
function getLikes(id) { return likeStore.value[id]?.likes || 0 }
function getViews(id) { return likeStore.value[id]?.views || Math.floor(Math.random() * 80 + 20) }
function addLike(id) {
  const s = loadStats()
  if (!s[id]) s[id] = { likes: 0, views: Math.floor(Math.random() * 80 + 20) }
  if (s[id]._liked) return
  s[id].likes++; s[id]._liked = true
  saveStats(s); likeStore.value = s
}
function addView(id) {
  const s = loadStats()
  if (!s[id]) s[id] = { likes: 0, views: Math.floor(Math.random() * 80 + 20) }
  s[id].views++; saveStats(s); likeStore.value = s
}

const explorerMemories = computed(() =>
  memoryStore.memories.filter((m) => m.privacy_level === 0 && m.user_id !== userStore.userId)
    .map((m) => ({ ...m, _likes: getLikes(m.id), _views: getViews(m.id) }))
)

function shuffle() {
  if (shuffling.value || explorerMemories.value.length === 0) return
  shuffling.value = true; highlightId.value = null
  let count = 0; const max = 15
  const interval = setInterval(() => {
    highlightId.value = explorerMemories.value[Math.floor(Math.random() * explorerMemories.value.length)].id
    if (++count >= max) { clearInterval(interval); shuffling.value = false; const el = document.getElementById('explore-card-' + highlightId.value); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  }, 80)
}

function startVisitorCounter() {
  visitorCount.value = Math.floor(Math.random() * 26) + 12
  visitorTimer = setInterval(() => { visitorCount.value = Math.max(12, Math.min(38, visitorCount.value + Math.floor(Math.random() * 5) - 2)) }, 5000)
}

function openMemory(memory) { addView(memory.id); router.push(`/memory/${memory.id}?from=explore`) }

onMounted(async () => {
  for (let i = 0; i < 5 && !userStore.userId; i++) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) {
    await memoryStore.fetchMemories(userStore.userId)
    try {
      const { companionAPI } = await import('@/api/modules/companion')
      for (let uid = 2; uid <= 9; uid++) {
        try { const mems = await companionAPI.getMemories(uid); mems.forEach((m) => { if (!memoryStore.memories.find((x) => x.id === m.id)) memoryStore.memories.push(m) }) } catch {}
      }
    } catch {}
  }
  loading.value = false; startVisitorCounter()
})
onUnmounted(() => { if (visitorTimer) clearInterval(visitorTimer) })
</script>

<template>
  <div class="explore-page">
    <AppHeader />
    <Loader :visible="loading" text="漂流中..." />
    <main v-if="!loading" class="explore-page__main">
      <div class="explore-hero">
        <div class="explore-hero__text">
          <h1 class="explore__title"><i class="fa-solid fa-paper-plane"></i> 漂流广场</h1>
          <p class="text-muted">浏览世界各地的公开记忆，与陌生的旅人偶然相遇</p>
        </div>
        <button class="btn btn--shuffle" :disabled="shuffling" @click="shuffle">
          <i class="fa-solid fa-dice"></i> {{ shuffling ? '邂逅中...' : '🎲 随缘遇见' }}
        </button>
      </div>
      <div v-if="explorerMemories.length" class="explore-grid">
        <article v-for="m in explorerMemories" :key="m.id" :id="`explore-card-${m.id}`" class="explore-card glass" :class="{ 'explore-card--highlight': highlightId === m.id, 'explore-card--shuffling': shuffling }" @click="openMemory(m)">
          <div class="explore-card__author">
            <button class="explore-card__author-btn" @click.stop="router.push(`/traveler/${m.user_id}`)">
              <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id || m.id}`" class="explore-card__avatar" alt="" />
              <span class="explore-card__username">{{ getName(m.user_id) }}</span>
              <i class="fa-solid fa-chevron-right explore-card__author-arrow"></i>
            </button>
          </div>
          <div class="explore-card__image">
            <img v-if="m.images?.length" :src="m.images[0]" :alt="m.title" loading="lazy" />
            <div v-else class="explore-card__img-plh"><i class="fa-solid fa-image"></i></div>
          </div>
          <div class="explore-card__body">
            <h3 class="explore-card__title">{{ m.title }}</h3>
            <p class="explore-card__location text-muted"><i class="fa-solid fa-location-dot"></i> {{ m.location_name?.split('·').slice(0, 2).join('·') }}</p>
            <p class="explore-card__date text-muted">{{ formatDateCN(m.happened_date) }}</p>
          </div>
          <div class="explore-card__actions">
            <button class="explore-card__star" :class="{ 'explore-card__star--active': isFaved(m.id) }" @click.stop="toggleFav(m, $event)" title="收藏">
              <i class="fa-solid fa-star"></i>
            </button>
            <button class="explore-card__like" @click.stop="addLike(m.id); m._likes++">
              <i class="fa-solid fa-heart" :class="{ 'explore-card__like--loved': likeStore[m.id]?._liked }"></i> {{ m._likes }}
            </button>
            <span class="explore-card__views"><i class="fa-solid fa-eye"></i> {{ m._views }}</span>
          </div>
        </article>
      </div>
      <div v-else class="explore__empty"><i class="fa-solid fa-compass"></i><p>暂时没有来自其他旅人的公开记忆</p></div>
      <div class="explore-footer"><p class="explore-footer__text"><span class="explore-footer__pulse"></span> 此刻有 <strong>{{ visitorCount }}</strong> 位旅人在此驻足</p></div>
    </main>
  </div>
</template>

<style scoped>
.explore-page { min-height: 100vh; background: linear-gradient(180deg, #f5efe4 0%, var(--color-bg) 30%); padding-top: 64px; }
.explore-page__main { max-width: var(--container-max); margin: 0 auto; padding: var(--space-6); }
.explore-hero { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-5); }
.explore__title { font: var(--text-h1); color: var(--color-primary-dark); }
.explore__title i { color: var(--color-accent); margin-right: var(--space-2); }
.btn--shuffle { padding: var(--space-3) var(--space-6); background: linear-gradient(135deg, #6C5CE7, #a29bfe); color: #fff; border-radius: var(--radius-pill); font-weight: 700; font-size: var(--text-btn); box-shadow: 0 6px 24px rgba(108, 92, 231, 0.35); display: flex; align-items: center; gap: var(--space-2); }
.btn--shuffle:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(108, 92, 231, 0.5); }
.btn--shuffle:disabled { opacity: 0.6; cursor: not-allowed; }
.explore-grid { columns: 3; column-gap: var(--space-4); }
.explore-card { break-inside: avoid; margin-bottom: var(--space-4); overflow: hidden; cursor: pointer; transition: all var(--duration-normal); }
.explore-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.explore-card--highlight { border-color: #6C5CE7; box-shadow: 0 0 24px rgba(108, 92, 231, 0.3); transform: scale(1.02); z-index: 10; }
.explore-card--shuffling { animation: card-shuffle 0.08s ease-in-out infinite; }
@keyframes card-shuffle { 0%,100% { transform: rotate(0); } 50% { transform: rotate(0.5deg) scale(0.99); } }
.explore-card__author { padding: var(--space-3) var(--space-3) 0; }
.explore-card__author-btn { display: flex; align-items: center; gap: var(--space-2); width: 100%; text-align: left; padding: var(--space-1); border-radius: var(--radius-sm); }
.explore-card__author-btn:hover { background: rgba(200, 169, 110, 0.12); }
.explore-card__avatar { width: 28px; height: 28px; border-radius: var(--radius-round); border: 2px solid var(--color-accent); flex-shrink: 0; }
.explore-card__username { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); flex: 1; }
.explore-card__author-arrow { font-size: 10px; color: var(--color-text-muted); opacity: 0; }
.explore-card__author-btn:hover .explore-card__author-arrow { opacity: 1; color: var(--color-accent); }
.explore-card__image { width: 100%; overflow: hidden; }
.explore-card__image img { width: 100%; display: block; }
.explore-card__img-plh { width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; background: var(--color-accent-light); color: var(--color-text-muted); font-size: 32px; }
.explore-card__body { padding: var(--space-3); }
.explore-card__title { font: 16px/1.3 var(--font-serif); color: var(--color-primary-dark); margin-bottom: 2px; }
.explore-card__location { font-size: 12px; }
.explore-card__date { font-size: 11px; }
.explore-card__actions { display: flex; align-items: center; gap: var(--space-1); padding: 0 var(--space-3) var(--space-3); }
.explore-card__star { width: 32px; height: 32px; border-radius: var(--radius-round); display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--color-border); transition: all var(--duration-fast); flex-shrink: 0; }
.explore-card__star:hover { color: #D9A05B; background: rgba(217,160,91,0.1); }
.explore-card__star--active { color: #D9A05B; }
.explore-card__like { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-text-muted); padding: 4px 10px; border-radius: var(--radius-pill); }
.explore-card__like:hover { background: rgba(181, 90, 90, 0.1); color: var(--color-danger); }
.explore-card__like--loved { color: var(--color-danger); }
.explore-card__views { font-size: 12px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; margin-left: auto; }
.explore__empty { text-align: center; padding: var(--space-8); color: var(--color-text-muted); }
.explore__empty i { font-size: 48px; margin-bottom: var(--space-3); display: block; }
.explore-footer { text-align: center; padding: var(--space-6) 0 var(--space-8); }
.explore-footer__text { font-size: var(--text-sm); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; gap: var(--space-2); }
.explore-footer__pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--color-success); animation: pulse-dot 2s ease-in-out infinite; display: inline-block; }
@keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
@media (max-width: 1024px) { .explore-grid { columns: 2; } }
@media (max-width: 600px)  { .explore-grid { columns: 1; } }
</style>
