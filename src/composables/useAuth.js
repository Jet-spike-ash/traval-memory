/* AI 辅助生成：DeepSeek V4 + Claude */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

/**
 * 认证组合式函数
 * 封装登录态检查和 Token 管理
 */
export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()

  const isAuthenticated = computed(() => userStore.isLoggedIn)
  const currentUser = computed(() => userStore.user)

  /** 检查登录态，未登录则跳转 */
  function requireAuth() {
    if (!userStore.isLoggedIn) {
      router.push({ path: '/', query: { redirect: router.currentRoute.value.fullPath } })
      return false
    }
    return true
  }

  /** 退出登录 */
  function logout() {
    userStore.logout()
    router.push('/')
  }

  return {
    isAuthenticated,
    currentUser,
    requireAuth,
    logout,
  }
}
