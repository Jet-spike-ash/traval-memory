<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { logout } = useAuth()

const navItems = [
  { path: '/home', label: '总览', icon: 'fa-globe' },
  { path: '/timeline', label: '时光', icon: 'fa-timeline' },
  { path: '/memory/add', label: '镌刻', icon: 'fa-feather-pointed' },
  { path: '/stats', label: '足迹', icon: 'fa-chart-pie' },
  { path: '/about', label: '漂流', icon: 'fa-paper-plane' },
  { path: '/story', label: '我的', icon: 'fa-clapperboard' },
  { path: '/profile', label: '资料', icon: 'fa-id-card' },
  { path: '/favorites', label: '收藏', icon: 'fa-star' },
]

function isActive(path) {
  return route.path === path
}
</script>

<template>
  <header class="app-header glass">
    <div class="app-header__inner">
      <!-- Logo -->
      <router-link to="/home" class="app-header__logo">
        <i class="fa-solid fa-hourglass-half"></i>
        <span class="app-header__brand">Memento·迹</span>
      </router-link>

      <!-- 导航菜单 -->
      <nav class="app-header__nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="app-header__link"
          :class="{ 'app-header__link--active': isActive(item.path) }"
        >
          <i class="fa-solid" :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- 用户区域 -->
      <div class="app-header__user">
        <img
          v-if="userStore.avatar"
          :src="userStore.avatar"
          :alt="userStore.username"
          class="app-header__avatar"
        />
        <span class="app-header__username">{{ userStore.username }}</span>
        <button class="app-header__logout" title="退出登录" @click="logout">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  height: 64px;
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-right: none;
}

.app-header__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-5);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-header__logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
  transition: color var(--duration-fast);
}
.app-header__logo:hover {
  color: var(--color-accent);
}

.app-header__nav {
  display: flex;
  gap: var(--space-1);
}

.app-header__link {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition: all var(--duration-fast) var(--ease-out);
}
.app-header__link:hover,
.app-header__link--active {
  background: var(--color-primary);
  color: #fff;
}

.app-header__user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-header__avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-round);
  border: 2px solid var(--color-accent);
}

.app-header__username {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__logout {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-round);
  color: var(--color-text-muted);
  transition: all var(--duration-fast);
}
.app-header__logout:hover {
  background: var(--color-danger);
  color: #fff;
}

@media (max-width: 768px) {
  .app-header__nav {
    display: none;
  }
  .app-header__username {
    display: none;
  }
}
</style>
