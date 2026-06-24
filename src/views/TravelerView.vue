<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { companionAPI } from '@/api/modules/companion'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const uiStore = useUiStore()
const loading = ref(true)
const traveler = ref(null)
const memories = ref([])
const requesting = ref(false)
const isFriend = ref(false)

const stats = computed(() => ({
  memoryCount: memories.value.length,
  countries: [...new Set(memories.value.map((m) => m.location_name?.split('·')[0]))],
  totalPhotos: memories.value.reduce((s, m) => s + (m.images?.length || 0), 0),
}))

const travelerId = computed(() => Number(route.params.id))

async function checkFriend() {
  if (!userStore.userId || !travelerId.value) return
  try {
    const list = await companionAPI.getCompanions(userStore.userId)
    isFriend.value = list.some((c) => c.companion_id === travelerId.value)
  } catch { isFriend.value = false }
}

async function sendFriendRequest() {
  if (isFriend.value || requesting.value || !userStore.userId) return
  requesting.value = true
  try {
    await fetch('/api/companions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({ user_id: userStore.userId, companion_id: travelerId.value, permission: 'read' }),
    })
    isFriend.value = true
    uiStore.showToast('好友申请已发送 🤝', 'success')
  } catch {
    uiStore.showToast('发送失败，请稍后重试', 'error')
  } finally { requesting.value = false }
}

async function loadTraveler() {
  if (!travelerId.value) { router.back(); return }
  try {
    const [user, mems] = await Promise.all([
      companionAPI.getUser(travelerId.value),
      companionAPI.getMemories(travelerId.value),
    ])
    traveler.value = user
    memories.value = (mems || []).filter((m) => m.privacy_level === 0)
    await checkFriend()
  } catch {
    uiStore.showToast('加载作者信息失败', 'error')
    router.back()
  } finally { loading.value = false }
}

onMounted(loadTraveler)
</script>

<template>
  <div class="traveler-page">
    <AppHeader />
    <Loader :visible="loading" text="加载旅人信息..." />

    <main v-if="!loading && traveler" class="traveler-page__main container">
      <button class="back-btn" @click="router.back()">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>

      <!-- 作者头部 -->
      <div class="traveler-hero glass">
        <img :src="traveler.avatar" :alt="traveler.username" class="traveler-hero__avatar" />
        <div class="traveler-hero__info">
          <h1 class="traveler-hero__name">{{ traveler.username }}</h1>
          <p class="traveler-hero__bio">{{ traveler.bio || '一位安静的旅人' }}</p>
          <div class="traveler-hero__stats">
            <span><i class="fa-solid fa-map-pin"></i> {{ stats.memoryCount }} 段记忆</span>
            <span><i class="fa-solid fa-earth-americas"></i> {{ stats.countries.length }} 个国家</span>
            <span><i class="fa-solid fa-camera"></i> {{ stats.totalPhotos }} 张照片</span>
          </div>
        </div>
        <button
          class="btn btn--friend"
          :class="{ 'btn--friend-added': isFriend }"
          :disabled="isFriend || requesting"
          @click="sendFriendRequest"
        >
          <i v-if="requesting" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid" :class="isFriend ? 'fa-user-check' : 'fa-user-plus'"></i>
          {{ isFriend ? '已是好友' : requesting ? '发送中...' : '加为好友' }}
        </button>
      </div>

      <!-- 记忆瀑布流 -->
      <div class="traveler-grid" v-if="memories.length">
        <article
          v-for="m in memories"
          :key="m.id"
          class="traveler-card glass"
          @click="router.push(`/memory/${m.id}?from=traveler&tid=${traveler.id}`)"
        >
          <div class="traveler-card__image">
            <img v-if="m.images?.length" :src="m.images[0]" :alt="m.title" loading="lazy" />
            <div v-else class="traveler-card__img-plh"><i class="fa-solid fa-image"></i></div>
          </div>
          <div class="traveler-card__body">
            <h3>{{ m.title }}</h3>
            <p class="text-muted" style="font-size:12px;">
              <i class="fa-solid fa-location-dot"></i> {{ m.location_name?.split('·').slice(0, 2).join('·') }}
            </p>
            <p class="text-muted" style="font-size:11px;">{{ formatDateCN(m.happened_date) }}</p>
          </div>
        </article>
      </div>

      <div v-else class="traveler__empty text-muted">
        <i class="fa-solid fa-map"></i>
        <p>这位旅人还没有公开的记忆</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.traveler-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.traveler-page__main { padding: var(--space-6); max-width: 900px; }

.back-btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-pill);
  background: var(--color-glass); backdrop-filter: blur(8px);
  border: var(--border-width) solid var(--color-border);
  font-size: var(--text-sm); color: var(--color-text-secondary);
  margin-bottom: var(--space-5); transition: all var(--duration-fast);
}
.back-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

/* 作者头部 */
.traveler-hero {
  display: flex; align-items: center; gap: var(--space-5); padding: var(--space-5);
  margin-bottom: var(--space-5); flex-wrap: wrap;
}
.traveler-hero__avatar { width: 90px; height: 90px; border-radius: var(--radius-round); border: 3px solid var(--color-accent); }
.traveler-hero__info { flex: 1; min-width: 200px; }
.traveler-hero__name { font: var(--text-h1); color: var(--color-primary-dark); }
.traveler-hero__bio { font-size: var(--text-sm); color: var(--color-text-secondary); font-style: italic; margin-bottom: var(--space-2); }
.traveler-hero__stats { display: flex; gap: var(--space-4); font-size: var(--text-xs); color: var(--color-text-muted); flex-wrap: wrap; }
.traveler-hero__stats i { color: var(--color-accent); margin-right: 2px; }

.btn--friend {
  padding: var(--space-3) var(--space-5); border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #5B8C5A, #7aad7a);
  color: #fff; font-weight: 600; white-space: nowrap;
  display: flex; align-items: center; gap: var(--space-2);
  box-shadow: 0 4px 16px rgba(91,140,90,0.3); transition: all var(--duration-fast);
}
.btn--friend:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(91,140,90,0.45); }
.btn--friend:disabled { cursor: default; }
.btn--friend-added { background: #8C7C6B; box-shadow: none; opacity: 0.7; }

/* 瀑布流 */
.traveler-grid { columns: 3; column-gap: var(--space-4); }
.traveler-card { break-inside: avoid; margin-bottom: var(--space-4); overflow: hidden; cursor: pointer; transition: all var(--duration-fast); }
.traveler-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.traveler-card__image { width: 100%; overflow: hidden; }
.traveler-card__image img { width: 100%; display: block; }
.traveler-card__img-plh { width: 100%; height: 140px; display: flex; align-items: center; justify-content: center; background: var(--color-accent-light); color: var(--color-text-muted); font-size: 28px; }
.traveler-card__body { padding: var(--space-3); }
.traveler-card__body h3 { font: 15px/1.3 var(--font-serif); color: var(--color-primary-dark); }

.traveler__empty { text-align: center; padding: var(--space-8); }
.traveler__empty i { font-size: 48px; margin-bottom: var(--space-3); display: block; }

@media (max-width: 768px) { .traveler-grid { columns: 2; } .traveler-hero { text-align: center; flex-direction: column; } }
@media (max-width: 480px) { .traveler-grid { columns: 1; } }
</style>
