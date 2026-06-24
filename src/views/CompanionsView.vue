<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { companionAPI } from '@/api/modules/companion'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const travelers = ref([])

const allMemories = computed(() =>
  travelers.value.flatMap((t) => t.memories.map((m) => ({ ...m, traveler: t })))
    .sort((a, b) => new Date(b.happened_date) - new Date(a.happened_date))
)

onMounted(async () => {
  if (!userStore.userId) { loading.value = false; return }
  try {
    const companions = await companionAPI.getCompanions(userStore.userId)
    const list = await Promise.all(companions.map(async (c) => {
      try {
        const [user, memories] = await Promise.all([companionAPI.getUser(c.companion_id), companionAPI.getMemories(c.companion_id)])
        return { ...user, memories }
      } catch { return null }
    }))
    travelers.value = list.filter(Boolean)
  } catch (e) { console.error(e) }
  loading.value = false
})
</script>

<template>
  <div class="companions-page">
    <AppHeader />
    <Loader :visible="loading" />
    <main v-if="!loading" class="companions-page__main container">
      <h1 class="comp__title"><i class="fa-solid fa-users"></i> 结伴·同行人</h1>
      <p class="text-muted comp__subtitle">与 {{ travelers.length }} 位旅人共同记录的 {{ allMemories.length }} 段记忆</p>

      <!-- 共忆流 -->
      <div class="comp-feed">
        <article v-for="m in allMemories" :key="m.id" class="comp-card glass" @click="router.push(`/memory/${m.id}`)">
          <div class="comp-card__header">
            <img :src="m.traveler.avatar" class="comp-card__avatar" />
            <div>
              <span class="comp-card__name">{{ m.traveler.username }}</span>
              <span class="comp-card__date text-muted">{{ formatDateCN(m.happened_date) }}</span>
            </div>
          </div>
          <div class="comp-card__body">
            <div class="comp-card__img" v-if="m.images?.length">
              <img :src="m.images[0]" :alt="m.title" loading="lazy" />
            </div>
            <div class="comp-card__text">
              <h3>{{ m.title }}</h3>
              <p class="text-muted"><i class="fa-solid fa-location-dot"></i> {{ m.location_name }}</p>
              <p class="text-muted comp-card__excerpt">{{ m.story?.replace(/[#*`\n]/g, ' ').slice(0, 80) }}...</p>
            </div>
          </div>
        </article>
      </div>

      <div v-if="allMemories.length === 0" class="comp__empty text-muted">
        <i class="fa-solid fa-user-group"></i>
        <p>还没有同行旅人，去首页探索吧</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.companions-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.companions-page__main { padding: var(--space-6); max-width: 800px; }
.comp__title { font: var(--text-h1); color: var(--color-primary-dark); }
.comp__title i { color: var(--color-accent); }
.comp__subtitle { margin-bottom: var(--space-5); }

.comp-feed { display: flex; flex-direction: column; gap: var(--space-4); }
.comp-card { padding: var(--space-4); cursor: pointer; transition: all var(--duration-fast); }
.comp-card:hover { transform: translateX(4px); box-shadow: var(--shadow-md); border-color: var(--color-accent); }

.comp-card__header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.comp-card__avatar { width: 36px; height: 36px; border-radius: var(--radius-round); border: 2px solid var(--color-accent); }
.comp-card__name { font-weight: 600; display: block; }
.comp-card__date { font-size: var(--text-xs); }

.comp-card__body { display: flex; gap: var(--space-4); }
.comp-card__img { width: 120px; height: 80px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; }
.comp-card__img img { width: 100%; height: 100%; object-fit: cover; }
.comp-card__text { flex: 1; min-width: 0; }
.comp-card__text h3 { font: var(--text-h3); margin-bottom: 2px; }
.comp-card__excerpt { font-size: var(--text-xs); margin-top: var(--space-1); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.comp__empty { text-align: center; padding: var(--space-8); }
.comp__empty i { font-size: 48px; margin-bottom: var(--space-3); display: block; }
</style>
