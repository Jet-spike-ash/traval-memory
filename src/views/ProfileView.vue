<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUiStore } from '@/stores/uiStore'
import { companionAPI } from '@/api/modules/companion'
import { formatDateCN } from '@/utils/date'
import AppHeader from '@/components/layout/AppHeader.vue'
import Loader from '@/components/common/Loader.vue'

const router = useRouter()
const userStore = useUserStore()
const memoryStore = useMemoryStore()
const uiStore = useUiStore()
const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const companions = ref([])

const form = ref({
  username: '',
  email: '',
  bio: '',
  home_lat: 39.9042,
  home_lng: 116.4074,
})

const stats = computed(() => ({
  memoryCount: memoryStore.memoryCount,
  countryCount: [...new Set(memoryStore.memories.map((m) => m.location_name?.split('·')[0]))].length,
  friendCount: companions.value.length,
}))

function startEdit() {
  form.value = {
    username: userStore.user?.username || '',
    email: userStore.user?.email || '',
    bio: userStore.user?.bio || '',
    home_lat: userStore.user?.home_lat || 39.9042,
    home_lng: userStore.user?.home_lng || 116.4074,
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveProfile() {
  if (!form.value.username.trim()) {
    uiStore.showToast('用户名不能为空', 'warning'); return
  }
  saving.value = true
  try {
    const res = await fetch(`/api/users/${userStore.userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({ ...userStore.user, ...form.value }),
    })
    if (res.ok) {
      const updated = await res.json()
      userStore.user = updated
      uiStore.showToast('个人信息已更新', 'success')
      editing.value = false
    }
  } catch { uiStore.showToast('保存失败', 'error') }
  finally { saving.value = false }
}

async function loadCompanions() {
  try {
    const list = await companionAPI.getCompanions(userStore.userId)
    const users = await Promise.all(
      list.map(async (c) => {
        try { return await companionAPI.getUser(c.companion_id) } catch { return null }
      })
    )
    companions.value = users.filter(Boolean)
  } catch { /* 静默失败 */ }
}

onMounted(async () => {
  for (let i = 0; i < 5 && !userStore.userId; i++) await new Promise((r) => setTimeout(r, 400))
  if (userStore.userId) {
    await memoryStore.fetchMemories(userStore.userId)
    await loadCompanions()
  }
  loading.value = false
})
</script>

<template>
  <div class="profile-page">
    <AppHeader />
    <Loader :visible="loading" text="加载中..." />

    <main v-if="!loading" class="profile-page__main container">
      <h1 class="profile__title"><i class="fa-solid fa-id-card"></i> 个人信息</h1>

      <!-- 头像 + 统计 -->
      <div class="profile-hero glass">
        <img :src="userStore.avatar" :alt="userStore.username" class="profile-hero__avatar" />
        <div class="profile-hero__stats">
          <div class="profile-stat">
            <span class="profile-stat__value">{{ stats.memoryCount }}</span>
            <span class="profile-stat__label">记忆</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat__value">{{ stats.countryCount }}</span>
            <span class="profile-stat__label">国家</span>
          </div>
          <div class="profile-stat">
            <span class="profile-stat__value">{{ stats.friendCount }}</span>
            <span class="profile-stat__label">朋友</span>
          </div>
        </div>
      </div>

      <!-- 信息表单 -->
      <div class="profile-section glass">
        <div class="profile-section__header">
          <h2><i class="fa-solid fa-user-pen"></i> 基本资料</h2>
          <button v-if="!editing" class="btn btn--edit" @click="startEdit">
            <i class="fa-solid fa-pen-to-square"></i> 编辑
          </button>
        </div>

        <div v-if="!editing" class="profile-fields">
          <div class="profile-field">
            <span class="profile-field__label">用户名</span>
            <span class="profile-field__value">{{ userStore.username }}</span>
          </div>
          <div class="profile-field">
            <span class="profile-field__label">邮箱</span>
            <span class="profile-field__value">{{ userStore.user?.email }}</span>
          </div>
          <div class="profile-field">
            <span class="profile-field__label">个性签名</span>
            <span class="profile-field__value text-muted">{{ userStore.user?.bio || '未设置' }}</span>
          </div>
          <div class="profile-field">
            <span class="profile-field__label">常住地</span>
            <span class="profile-field__value text-muted">{{ userStore.homePosition.lat.toFixed(4) }}, {{ userStore.homePosition.lng.toFixed(4) }}</span>
          </div>
        </div>

        <div v-else class="profile-form">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="form.username" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="form.email" type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">个性签名</label>
            <input v-model="form.bio" type="text" class="form-input" placeholder="写一句话介绍自己..." />
          </div>
          <div class="form-row">
            <div class="form-group form-group--half">
              <label class="form-label">常住纬度</label>
              <input v-model.number="form.home_lat" type="number" step="0.0001" class="form-input" />
            </div>
            <div class="form-group form-group--half">
              <label class="form-label">常住经度</label>
              <input v-model.number="form.home_lng" type="number" step="0.0001" class="form-input" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn--save" :disabled="saving" @click="saveProfile">
              <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-check"></i>
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button class="btn btn--cancel" @click="cancelEdit">取消</button>
          </div>
        </div>
      </div>

      <!-- 我的朋友 -->
      <div class="profile-section glass">
        <h2><i class="fa-solid fa-user-group"></i> 我的朋友 ({{ companions.length }})</h2>
        <div v-if="companions.length" class="friends-grid">
          <button
            v-for="c in companions"
            :key="c.id"
            class="friend-card"
            @click="router.push(`/traveler/${c.id}`)"
          >
            <img :src="c.avatar" :alt="c.username" class="friend-card__avatar" />
            <span class="friend-card__name">{{ c.username }}</span>
            <span class="friend-card__bio text-muted">{{ c.bio?.slice(0, 20) || '' }}</span>
            <i class="fa-solid fa-chevron-right friend-card__arrow"></i>
          </button>
        </div>
        <p v-else class="text-muted" style="text-align:center;">还没有朋友，去 <router-link to="/about">漂流广场</router-link> 认识旅人吧</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.profile-page__main { padding: var(--space-6); max-width: 700px; }
.profile__title { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-5); }
.profile__title i { color: var(--color-accent); margin-right: var(--space-2); }

/* 头像区 */
.profile-hero { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-5); margin-bottom: var(--space-4); }
.profile-hero__avatar { width: 100px; height: 100px; border-radius: var(--radius-round); border: 4px solid var(--color-accent); box-shadow: 0 4px 20px rgba(200,169,110,0.3); }
.profile-hero__stats { display: flex; gap: var(--space-6); flex: 1; justify-content: center; }
.profile-stat { text-align: center; }
.profile-stat__value { display: block; font-family: var(--font-serif); font-size: 32px; font-weight: 700; color: var(--color-primary); }
.profile-stat__label { font-size: var(--text-xs); color: var(--color-text-muted); }

/* 信息区 */
.profile-section { padding: var(--space-5); margin-bottom: var(--space-4); }
.profile-section h2 { font: var(--text-h2); margin-bottom: var(--space-4); font-size: 20px; }
.profile-section h2 i { color: var(--color-accent); margin-right: var(--space-2); }
.profile-section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
.profile-section__header h2 { margin-bottom: 0; }

.profile-field { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); font-size: var(--text-sm); }
.profile-field__label { color: var(--color-text-muted); font-weight: 500; }
.profile-field__value { color: var(--color-text-primary); }

.profile-form { display: flex; flex-direction: column; gap: var(--space-3); }
.form-group { flex: 1; }
.form-label { display: block; margin-bottom: var(--space-1); font-size: var(--text-xs); font-weight: 500; color: var(--color-text-secondary); }
.form-input { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--text-sm); }
.form-input:focus { outline: none; border-color: var(--color-accent); }
.form-row { display: flex; gap: var(--space-4); }
.form-actions { display: flex; gap: var(--space-2); margin-top: var(--space-2); }

.btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-pill); font-weight: 600; font-size: var(--text-sm); display: flex; align-items: center; gap: var(--space-1); transition: all var(--duration-fast); }
.btn--edit { background: var(--color-accent-light); color: var(--color-primary-dark); }
.btn--save { background: var(--color-primary); color: #fff; }
.btn--save:disabled { opacity: 0.5; }
.btn--cancel { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-secondary); }

/* 朋友 */
.friends-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.friend-card {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: var(--space-4); border-radius: var(--radius-md); text-align: center;
  transition: all var(--duration-fast); background: rgba(255,255,255,0.4);
}
.friend-card:hover { background: rgba(200,169,110,0.12); transform: translateY(-2px); }
.friend-card__avatar { width: 56px; height: 56px; border-radius: var(--radius-round); border: 2px solid var(--color-accent); }
.friend-card__name { font-weight: 600; font-size: var(--text-sm); }
.friend-card__bio { font-size: 11px; }
.friend-card__arrow { font-size: 10px; color: var(--color-text-muted); opacity: 0; transition: opacity var(--duration-fast); }
.friend-card:hover .friend-card__arrow { opacity: 1; }

@media (max-width: 768px) {
  .profile-hero { flex-direction: column; text-align: center; }
  .friends-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
