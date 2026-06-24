<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { memoryAPI } from '@/api/modules/memory'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const memoryStore = useMemoryStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const loading = ref(true)
const adding = ref(false)

const newWish = ref({ location_name: '', lat: '', lng: '', note: '' })

const wishlist = computed(() => memoryStore.wishlist)
const pending = computed(() => wishlist.value.filter((w) => !w.is_achieved).sort((a, b) => a.priority - b.priority))
const achieved = computed(() => wishlist.value.filter((w) => w.is_achieved))

function toggleAchieved(item) {
  const updated = { ...item, is_achieved: !item.is_achieved }
  // 通过 json-server 更新
  fetch(`/api/wishlist/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    body: JSON.stringify(updated),
  })
    .then(() => {
      const idx = memoryStore.wishlist.findIndex((w) => w.id === item.id)
      if (idx !== -1) memoryStore.wishlist[idx] = updated
      uiStore.showToast(updated.is_achieved ? '🎉 愿望已实现！' : '已移回愿望清单', 'success')
    })
    .catch(() => uiStore.showToast('更新失败', 'error'))
}

async function addWish() {
  if (!newWish.value.location_name.trim()) {
    uiStore.showToast('请输入目的地名称', 'warning'); return
  }
  adding.value = true
  try {
    await memoryAPI.addWish?.({
      user_id: userStore.userId,
      location_name: newWish.value.location_name,
      lat: parseFloat(newWish.value.lat) || 0,
      lng: parseFloat(newWish.value.lng) || 0,
      note: newWish.value.note,
      is_achieved: false,
      priority: pending.value.length + 1,
    }) || fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({
        user_id: userStore.userId,
        location_name: newWish.value.location_name,
        lat: parseFloat(newWish.value.lat) || 0,
        lng: parseFloat(newWish.value.lng) || 0,
        note: newWish.value.note,
        is_achieved: false,
        priority: pending.value.length + 1,
      }),
    }).then((r) => r.json())
    uiStore.showToast('愿望已加入清单 ✨', 'success')
    newWish.value = { location_name: '', lat: '', lng: '', note: '' }
    await memoryStore.fetchWishlist(userStore.userId)
  } catch {
    uiStore.showToast('添加失败', 'error')
  } finally { adding.value = false }
}

onMounted(async () => {
  if (userStore.userId) await memoryStore.fetchWishlist(userStore.userId)
  loading.value = false
})
</script>

<template>
  <div class="wishlist-page">
    <AppHeader />
    <Loader :visible="loading" />
    <main v-if="!loading" class="wishlist-page__main container">
      <h1 class="wishlist__title"><i class="fa-solid fa-map-pin"></i> 远方·愿望清单</h1>

      <!-- 添加愿望 -->
      <div class="wish-add glass">
        <input v-model="newWish.location_name" placeholder="想去的地方..." class="wish-add__input" />
        <input v-model="newWish.lat" placeholder="纬度 (可选)" class="wish-add__coord" />
        <input v-model="newWish.lng" placeholder="经度 (可选)" class="wish-add__coord" />
        <input v-model="newWish.note" placeholder="备注 (可选)" class="wish-add__note" />
        <button class="btn btn--add" :disabled="adding" @click="addWish">
          <i class="fa-solid fa-plus"></i> 添加
        </button>
      </div>

      <!-- 未实现：灰色图钉 -->
      <section class="wish-section">
        <h2><i class="fa-solid fa-thumbtack" style="color:#8C7C6B;"></i> 待出发 ({{ pending.length }})</h2>
        <div v-if="pending.length === 0" class="wish-empty text-muted">暂时没有愿望，快添加一个吧 ✈️</div>
        <div v-for="w in pending" :key="w.id" class="wish-card glass">
          <div class="wish-card__info">
            <h3>{{ w.location_name }}</h3>
            <p class="text-muted">{{ w.note }}</p>
            <span class="wish-card__coords text-muted" v-if="w.lat && w.lng">
              📍 {{ w.lat.toFixed(2) }}, {{ w.lng.toFixed(2) }}
            </span>
          </div>
          <button class="wish-card__toggle" title="标记为已实现" @click="toggleAchieved(w)">
            <i class="fa-solid fa-thumbtack" style="color:#8C7C6B;"></i>
          </button>
        </div>
      </section>

      <!-- 已实现：金色图钉 -->
      <section class="wish-section" v-if="achieved.length">
        <h2><i class="fa-solid fa-thumbtack" style="color:#C8A96E;"></i> 已到达 ({{ achieved.length }})</h2>
        <div v-for="w in achieved" :key="w.id" class="wish-card wish-card--done glass">
          <div class="wish-card__info">
            <h3>{{ w.location_name }} <span class="wish-card__check">✓</span></h3>
            <p class="text-muted">{{ w.note }}</p>
          </div>
          <button class="wish-card__toggle" title="撤销" @click="toggleAchieved(w)">
            <i class="fa-solid fa-thumbtack" style="color:#C8A96E;"></i>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.wishlist-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.wishlist-page__main { padding: var(--space-6); max-width: 700px; }
.wishlist__title { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-5); }
.wishlist__title i { color: var(--color-accent); }

.wish-add { display: flex; gap: var(--space-2); padding: var(--space-3); margin-bottom: var(--space-5); flex-wrap: wrap; align-items: center; }
.wish-add__input { flex: 2; min-width: 150px; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
.wish-add__coord { flex: 1; min-width: 100px; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--text-xs); }
.wish-add__note { flex: 1; min-width: 100px; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--text-xs); }
.btn--add { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: #fff; border-radius: var(--radius-pill); font-weight: 600; white-space: nowrap; }
.btn--add:disabled { opacity: 0.5; }

.wish-section { margin-bottom: var(--space-5); }
.wish-section h2 { font: var(--text-h2); color: var(--color-text-secondary); margin-bottom: var(--space-3); }

.wish-card { display: flex; align-items: center; padding: var(--space-4); margin-bottom: var(--space-2); }
.wish-card--done { opacity: 0.7; }
.wish-card__info { flex: 1; }
.wish-card__info h3 { font: var(--text-h3); }
.wish-card__check { color: var(--color-success); font-weight: 700; }
.wish-card__coords { font-size: var(--text-xs); font-family: var(--font-mono); }
.wish-card__toggle { font-size: 24px; padding: var(--space-2); transition: transform 0.2s; }
.wish-card__toggle:hover { transform: scale(1.3); }
.wish-empty { text-align: center; padding: var(--space-5); }
</style>
