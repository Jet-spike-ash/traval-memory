/* AI 辅助生成：DeepSeek V4 + Claude */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api/modules/auth'

/**
 * 用户状态管理
 * 管理登录态、用户信息、Token
 * 使用 pinia-plugin-persistedstate 持久化到 localStorage
 */
export const useUserStore = defineStore(
  'user',
  () => {
    // ---- State ----
    const user = ref(null)
    const token = ref(null)
    const isLoggedIn = computed(() => !!token.value && !!user.value)

    // ---- Getters ----
    const userId = computed(() => user.value?.id ?? null)
    const username = computed(() => user.value?.username ?? '旅人')
    const avatar = computed(() => user.value?.avatar ?? '')
    const homePosition = computed(() => ({
      lat: user.value?.home_lat ?? 39.9042,
      lng: user.value?.home_lng ?? 116.4074,
    }))

    // ---- Actions ----
    /** 登录 */
    async function login(email, password) {
      const res = await authAPI.login({ email, password })
      token.value = res.access_token
      user.value = res.user
      localStorage.setItem('access_token', res.access_token)
      return res
    }

    /** 注册 */
    async function register(email, password, username) {
      const res = await authAPI.register({ email, password, username })
      token.value = res.access_token
      user.value = res.user
      localStorage.setItem('access_token', res.access_token)
      return res
    }

    /** 退出登录 */
    function logout() {
      token.value = null
      user.value = null
      localStorage.removeItem('access_token')
    }

    /** 从 localStorage 恢复 token */
    function restoreToken() {
      const saved = localStorage.getItem('access_token')
      if (saved) {
        token.value = saved
      }
    }

    return {
      user,
      token,
      isLoggedIn,
      userId,
      username,
      avatar,
      homePosition,
      login,
      register,
      logout,
      restoreToken,
    }
  },
  {
    persist: {
      key: 'memento-user',
      storage: localStorage,
      pick: ['user', 'token'],
    },
  }
)
