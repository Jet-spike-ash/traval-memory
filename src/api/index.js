/* AI 辅助生成：DeepSeek V4 + Claude */
import axios from 'axios'
import { useUiStore } from '@/stores/uiStore'

/**
 * Axios 实例
 * - baseURL 使用 Vite 代理（开发环境）或直接请求（生产环境）
 * - 自动携带 Authorization Token
 * - 统一错误拦截
 */
const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器 — 自动附加 Token
 */
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器 — 统一错误处理
 */
http.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const uiStore = useUiStore()

    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Token 过期或未登录 → 清除登录态并跳转
          localStorage.removeItem('access_token')
          uiStore.showToast('登录已过期，请重新登录', 'warning')
          // 延迟跳转，让用户看到提示
          setTimeout(() => {
            window.location.hash = '#/'
          }, 1500)
          break
        case 403:
          uiStore.showToast('没有权限执行此操作', 'error')
          break
        case 404:
          uiStore.showToast('请求的资源不存在', 'error')
          break
        case 409:
          uiStore.showToast(data?.message || '数据冲突', 'warning')
          break
        case 422:
          uiStore.showToast(data?.message || '请求参数有误', 'warning')
          break
        case 500:
          uiStore.showToast(data?.message || '服务器内部错误，请确认后端已启动 (npm run server)', 'error')
          break
        default:
          uiStore.showToast(data?.message || `请求失败 (${status})`, 'error')
      }
    } else if (error.request) {
      // 请求已发出但未收到响应（服务器未启动等）
      uiStore.showToast('无法连接服务器，请确认已执行 npm run server', 'error')
    } else {
      uiStore.showToast('请求配置错误', 'error')
    }

    return Promise.reject(error)
  }
)

export default http
