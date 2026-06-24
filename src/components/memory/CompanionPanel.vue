<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref, onMounted } from 'vue'
import { companionAPI } from '@/api/modules/companion'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'

const emit = defineEmits(['select'])

const userStore = useUserStore()
const uiStore = useUiStore()

const travelers = ref([])
const loading = ref(true)
const collapsed = ref(false)

async function loadCompanions() {
  if (!userStore.userId) {
    // 等待 store 恢复（pinia 持久化可能需要时间）
    await new Promise((r) => setTimeout(r, 500))
  }
  if (!userStore.userId) {
    console.warn('[CompanionPanel] 用户未登录，无法加载游者列表')
    loading.value = false
    return
  }

  try {
    // 获取当前用户的同伴关系
    const companions = await companionAPI.getCompanions(userStore.userId)
    console.log(`[CompanionPanel] 获取到 ${companions.length} 条同伴关系`, companions)

    if (!companions.length) {
      console.warn('[CompanionPanel] 同伴列表为空 —— 请确认 json-server 已重启加载最新 db.json')
      loading.value = false
      return
    }

    // 获取每个同伴的详细信息和记忆
    const travelerList = await Promise.all(
      companions.map(async (c) => {
        try {
          const [user, memories] = await Promise.all([
            companionAPI.getUser(c.companion_id),
            companionAPI.getMemories(c.companion_id),
          ])
          // 守卫：跳过无效数据
          if (!user || !user.id) {
            console.warn(`[CompanionPanel] 游者 ${c.companion_id} 数据无效`)
            return null
          }
          return {
            ...user,
            memories,
            // 用最近记忆的位置作为地图定位点
            primaryLat: memories[0]?.lat || user.home_lat,
            primaryLng: memories[0]?.lng || user.home_lng,
            // 最近记忆的一小段简介
            recentStory: memories[0]?.story?.replace(/[#*`\n]/g, ' ').slice(0, 50) + '...',
          }
        } catch {
          return null
        }
      })
    )

    travelers.value = travelerList.filter(Boolean)
  } catch (err) {
    console.error('加载游者列表失败:', err)
  } finally {
    loading.value = false
  }
}

function selectTraveler(traveler) {
  emit('select', traveler)
}

onMounted(loadCompanions)

defineExpose({ travelers, loading, loadCompanions })
</script>

<template>
  <div class="companion-panel" :class="{ 'companion-panel--collapsed': collapsed }">
    <!-- 面板标题栏 -->
    <div class="companion-panel__header" @click="collapsed = !collapsed">
      <div class="companion-panel__title-row">
        <i class="fa-solid fa-users"></i>
        <span v-if="!collapsed" class="companion-panel__title">同行旅人</span>
      </div>
      <button class="companion-panel__toggle">
        <i class="fa-solid" :class="collapsed ? 'fa-chevron-left' : 'fa-chevron-down'"></i>
      </button>
    </div>

    <!-- 游者列表 -->
    <Transition name="collapse">
      <div v-if="!collapsed" class="companion-panel__list">
        <!-- 加载状态 -->
        <div v-if="loading" class="companion-panel__loading">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>寻找旅人...</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="travelers.length === 0" class="companion-panel__empty">
          <i class="fa-solid fa-person-walking"></i>
          <span>暂无同行旅人</span>
        </div>

        <!-- 游者卡片列表 -->
        <button
          v-for="traveler in travelers"
          :key="traveler.id"
          class="traveler-card"
          @click="selectTraveler(traveler)"
        >
          <div class="traveler-card__avatar">
            <img :src="traveler.avatar" :alt="traveler.username" />
            <div class="traveler-card__dot"></div>
          </div>
          <div class="traveler-card__info">
            <span class="traveler-card__name">{{ traveler.username }}</span>
            <span class="traveler-card__location">
              <i class="fa-solid fa-location-dot"></i>
              {{ traveler.memories[0]?.location_name?.split('·')[0] || '未知' }}
            </span>
            <span class="traveler-card__bio">{{ traveler.bio?.slice(0, 28) || '正在探索世界...' }}</span>
          </div>
          <i class="fa-solid fa-chevron-right traveler-card__arrow"></i>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.companion-panel {
  position: absolute;
  top: 120px;
  right: var(--space-5);
  z-index: var(--z-popup);
  width: 240px;
  max-height: calc(100vh - 200px);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(200, 169, 110, 0.25);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);
}

.companion-panel--collapsed {
  width: 48px;
}

/* ====== 标题栏 ====== */
.companion-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.companion-panel__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: var(--font-serif);
}

.companion-panel__toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-round);
  color: var(--color-text-muted);
  font-size: 12px;
  transition: all var(--duration-fast);
}
.companion-panel__toggle:hover {
  background: var(--color-accent-light);
  color: var(--color-primary);
}

/* ====== 列表 ====== */
.companion-panel__list {
  overflow-y: auto;
  padding: var(--space-2);
  flex: 1;
}

.companion-panel__loading,
.companion-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.companion-panel__loading i,
.companion-panel__empty i {
  font-size: 20px;
  color: var(--color-accent);
}

/* ====== 游者卡片 ====== */
.traveler-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  text-align: left;
  transition: all var(--duration-fast);
  margin-bottom: var(--space-1);
}

.traveler-card:hover {
  background: rgba(200, 169, 110, 0.12);
}

.traveler-card__avatar {
  position: relative;
  flex-shrink: 0;
}

.traveler-card__avatar img {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-round);
  border: 2px solid var(--color-accent);
}

.traveler-card__dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-success);
  border: 2px solid #fff;
}

.traveler-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.traveler-card__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-serif);
}

.traveler-card__location {
  font-size: 11px;
  color: var(--color-text-muted);
}
.traveler-card__location i {
  color: var(--color-accent);
  font-size: 10px;
  margin-right: 2px;
}

.traveler-card__bio {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.traveler-card__arrow {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0;
  transition: all var(--duration-fast);
}
.traveler-card:hover .traveler-card__arrow {
  opacity: 1;
  color: var(--color-accent);
}

/* ====== 折叠动画 ====== */
.collapse-enter-active,
.collapse-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
  max-height: 600px;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* ====== 响应式 ====== */
@media (max-width: 768px) {
  .companion-panel {
    top: auto;
    bottom: 80px;
    right: var(--space-3);
    width: 200px;
    max-height: 40vh;
  }
}
</style>
