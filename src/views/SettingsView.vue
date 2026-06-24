<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useMemoryStore } from '@/stores/memoryStore'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/composables/useAuth'
import JSZip from 'jszip'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const userStore = useUserStore()
const memoryStore = useMemoryStore()
const uiStore = useUiStore()
const { logout } = useAuth()
const exporting = ref(false)
const clearing = ref(false)

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  uiStore.setTheme(isDark.value ? 'dark' : 'light')
}

async function exportData() {
  exporting.value = true
  try {
    const zip = new JSZip()
    zip.file('memento-data.json', JSON.stringify({
      user: userStore.user,
      memories: memoryStore.memories,
      wishlist: memoryStore.wishlist,
      exportedAt: new Date().toISOString(),
    }, null, 2))
    const images = [...new Set(memoryStore.memories.flatMap((m) => m.images || []))]
    zip.file('image-urls.txt', images.join('\n'))
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `memento-backup-${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    uiStore.showToast('数据已导出 ✅', 'success')
  } catch { uiStore.showToast('导出失败', 'error') }
  finally { exporting.value = false }
}

function clearCache() {
  uiStore.showModal({
    title: '清空本地缓存',
    content: '将清空本地缓存的收藏、点赞数据和浏览记录。记忆数据不受影响。确定继续？',
    confirmText: '清空',
    cancelText: '取消',
    onConfirm: () => {
      clearing.value = true
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('memento_'))
      keys.forEach((k) => localStorage.removeItem(k))
      setTimeout(() => { clearing.value = false; uiStore.showToast('缓存已清空 🧹', 'success') }, 500)
    },
  })
}
</script>

<template>
  <div class="settings-page">
    <AppHeader />
    <main class="settings-page__main container">
      <h1 class="settings__title"><i class="fa-solid fa-sliders"></i> 设置中心</h1>

      <!-- 外观 -->
      <section class="settings-section glass">
        <h2><i class="fa-solid fa-palette"></i> 外观</h2>
        <div class="settings-row">
          <div>
            <span class="settings-row__label">深色模式</span>
            <span class="settings-row__hint text-muted">切换深色/浅色主题</span>
          </div>
          <button class="toggle-switch" :class="{ 'toggle-switch--on': isDark }" @click="toggleTheme">
            <span class="toggle-switch__knob"></span>
          </button>
        </div>
      </section>

      <!-- 数据 -->
      <section class="settings-section glass">
        <h2><i class="fa-solid fa-database"></i> 数据管理</h2>
        <div class="settings-row">
          <div>
            <span class="settings-row__label">导出数据备份</span>
            <span class="settings-row__hint text-muted">记忆 + 愿望清单 + 图片列表 → ZIP</span>
          </div>
          <button class="btn btn--action" :disabled="exporting" @click="exportData">
            <i v-if="exporting" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-file-zipper"></i>
            {{ exporting ? '打包中...' : '导出' }}
          </button>
        </div>
        <div class="settings-row">
          <div>
            <span class="settings-row__label">清空本地缓存</span>
            <span class="settings-row__hint text-muted">清除收藏、点赞、浏览记录</span>
          </div>
          <button class="btn btn--danger" :disabled="clearing" @click="clearCache">
            <i class="fa-solid fa-broom"></i> 清空
          </button>
        </div>
      </section>

      <!-- 账户 -->
      <section class="settings-section glass">
        <h2><i class="fa-solid fa-user-gear"></i> 账户</h2>
        <div class="settings-row">
          <div>
            <span class="settings-row__label">个人信息</span>
            <span class="settings-row__hint text-muted">编辑用户名、邮箱、签名</span>
          </div>
          <button class="btn btn--action" @click="router.push('/profile')">
            <i class="fa-solid fa-arrow-right"></i> 前往
          </button>
        </div>
        <div class="settings-row">
          <div>
            <span class="settings-row__label">退出登录</span>
            <span class="settings-row__hint text-muted">返回登录页面</span>
          </div>
          <button class="btn btn--danger" @click="logout">
            <i class="fa-solid fa-right-from-bracket"></i> 退出
          </button>
        </div>
      </section>

      <!-- 关于 -->
      <section class="settings-section glass">
        <h2><i class="fa-solid fa-circle-info"></i> 关于</h2>
        <p class="text-muted" style="font-size: var(--text-sm); line-height: 1.8;">
          <strong>Memento·迹</strong> — 时空旅人 · 交互式记忆博物馆<br />
          版本 1.0 · Vue 3 + Leaflet + ECharts<br />
          AI 辅助生成：DeepSeek V4 + Claude<br />
          班级 [班级] · 学号 [学号] · 姓名 [姓名]
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.settings-page { min-height: 100vh; background: var(--color-bg); padding-top: 64px; }
.settings-page__main { padding: var(--space-6); max-width: 600px; }
.settings__title { font: var(--text-h1); color: var(--color-primary-dark); margin-bottom: var(--space-5); }
.settings__title i { color: var(--color-accent); margin-right: var(--space-2); }

.settings-section { padding: var(--space-5); margin-bottom: var(--space-4); }
.settings-section h2 { font: var(--text-h2); font-size: 18px; margin-bottom: var(--space-4); }
.settings-section h2 i { color: var(--color-accent); margin-right: var(--space-2); }

.settings-row { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); gap: var(--space-4); }
.settings-row:last-child { border-bottom: none; }
.settings-row__label { font-weight: 600; font-size: var(--text-sm); display: block; }
.settings-row__hint { font-size: var(--text-xs); }

.btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-pill); font-weight: 600; font-size: var(--text-sm); display: flex; align-items: center; gap: var(--space-1); white-space: nowrap; transition: all var(--duration-fast); }
.btn--action { background: var(--color-primary); color: #fff; }
.btn--action:disabled { opacity: 0.5; }
.btn--danger { background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); }
.btn--danger:hover { background: var(--color-danger); color: #fff; }

/* 开关 */
.toggle-switch { width: 52px; height: 28px; border-radius: 14px; background: var(--color-border); position: relative; transition: background var(--duration-fast); flex-shrink: 0; }
.toggle-switch--on { background: var(--color-success); }
.toggle-switch__knob { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2); transition: transform var(--duration-fast); }
.toggle-switch--on .toggle-switch__knob { transform: translateX(24px); }
</style>
