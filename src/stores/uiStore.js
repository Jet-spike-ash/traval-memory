/* AI 辅助生成：DeepSeek V4 + Claude */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * UI 全局状态管理
 * 管理主题切换、加载状态、Toast 消息、弹窗控制
 */
export const useUiStore = defineStore(
  'ui',
  () => {
    // ---- State ----
    const theme = ref('light') // 'light' | 'dark'
    const isLoading = ref(false)
    const toast = ref({
      visible: false,
      message: '',
      type: 'info', // 'success' | 'error' | 'warning' | 'info'
      duration: 3000,
    })
    const modal = ref({
      visible: false,
      title: '',
      content: '',
      confirmText: '确认',
      cancelText: '取消',
      onConfirm: null,
      onCancel: null,
    })

    // ---- Getters ----
    const isDark = computed(() => theme.value === 'dark')

    // ---- Actions ----
    /** 切换主题 */
    function toggleTheme() {
      theme.value = theme.value === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', theme.value)
    }

    /** 设置主题 */
    function setTheme(t) {
      theme.value = t
      document.documentElement.setAttribute('data-theme', t)
    }

    /** 显示 Toast 消息 */
    function showToast(message, type = 'info', duration = 3000) {
      // 清除上一个定时器
      if (toast.value._timer) clearTimeout(toast.value._timer)

      toast.value = {
        visible: true,
        message,
        type,
        duration,
      }

      toast.value._timer = setTimeout(() => {
        toast.value.visible = false
      }, duration)
    }

    /** 隐藏 Toast */
    function hideToast() {
      toast.value.visible = false
    }

    /** 显示全局加载 */
    function showLoading() {
      isLoading.value = true
    }

    /** 隐藏全局加载 */
    function hideLoading() {
      isLoading.value = false
    }

    /** 显示弹窗 */
    function showModal({ title, content, confirmText, cancelText, onConfirm, onCancel }) {
      modal.value = {
        visible: true,
        title: title ?? '',
        content: content ?? '',
        confirmText: confirmText ?? '确认',
        cancelText: cancelText ?? '取消',
        onConfirm: onConfirm ?? null,
        onCancel: onCancel ?? null,
      }
    }

    /** 隐藏弹窗 */
    function hideModal() {
      modal.value.visible = false
    }

    return {
      theme,
      isLoading,
      toast,
      modal,
      isDark,
      toggleTheme,
      setTheme,
      showToast,
      hideToast,
      showLoading,
      hideLoading,
      showModal,
      hideModal,
    }
  },
  {
    persist: {
      key: 'memento-ui',
      storage: localStorage,
      pick: ['theme'],
    },
  }
)
