/* AI 辅助生成：DeepSeek V4 + Claude */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { memoryAPI } from '@/api/modules/memory'
import { useUiStore } from './uiStore'

/**
 * 记忆数据状态管理
 * 管理记忆列表、当前选中记忆、增删改查
 */
export const useMemoryStore = defineStore('memory', () => {
  // ---- State ----
  const memories = ref([])
  const currentMemory = ref(null)
  const loading = ref(false)
  const wishlist = ref([])

  // ---- Getters ----
  const memoriesByYear = computed(() => {
    const map = {}
    memories.value.forEach((m) => {
      const year = new Date(m.happened_date).getFullYear()
      if (!map[year]) map[year] = []
      map[year].push(m)
    })
    // 按年份降序排列
    return Object.entries(map)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({
        year: Number(year),
        items: items.sort(
          (a, b) => new Date(b.happened_date) - new Date(a.happened_date)
        ),
      }))
  })

  const publicMemories = computed(() =>
    memories.value.filter((m) => m.privacy_level === 0)
  )

  const memoryCount = computed(() => memories.value.length)

  // ---- Actions ----
  const uiStore = () => useUiStore()

  /** 获取当前用户的所有记忆 */
  async function fetchMemories(userId) {
    loading.value = true
    try {
      const res = await memoryAPI.getByUser(userId)
      memories.value = res.data ?? res
    } catch (err) {
      useUiStore().showToast('获取记忆列表失败', 'error')
      console.error('fetchMemories error:', err)
    } finally {
      loading.value = false
    }
  }

  /** 获取单条记忆详情 */
  async function fetchMemoryById(id) {
    loading.value = true
    try {
      const res = await memoryAPI.getById(id)
      currentMemory.value = res.data ?? res
      return currentMemory.value
    } catch (err) {
      useUiStore().showToast('获取记忆详情失败', 'error')
      console.error('fetchMemoryById error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /** 新增记忆 */
  async function addMemory(data) {
    try {
      const res = await memoryAPI.create(data)
      memories.value.unshift(res.data ?? res)
      useUiStore().showToast('记忆已镌刻', 'success')
      return res.data ?? res
    } catch (err) {
      useUiStore().showToast('保存记忆失败', 'error')
      console.error('addMemory error:', err)
      throw err
    }
  }

  /** 更新记忆 */
  async function updateMemory(id, data) {
    try {
      const res = await memoryAPI.update(id, data)
      const idx = memories.value.findIndex((m) => m.id === id)
      if (idx !== -1) memories.value[idx] = res.data ?? res
      if (currentMemory.value?.id === id) currentMemory.value = res.data ?? res
      useUiStore().showToast('记忆已更新', 'success')
      return res.data ?? res
    } catch (err) {
      useUiStore().showToast('更新记忆失败', 'error')
      console.error('updateMemory error:', err)
      throw err
    }
  }

  /** 删除记忆 */
  async function deleteMemory(id) {
    try {
      await memoryAPI.delete(id)
      memories.value = memories.value.filter((m) => m.id !== id)
      if (currentMemory.value?.id === id) currentMemory.value = null
      useUiStore().showToast('记忆已删除', 'success')
    } catch (err) {
      useUiStore().showToast('删除记忆失败', 'error')
      console.error('deleteMemory error:', err)
      throw err
    }
  }

  /** 获取愿望清单 */
  async function fetchWishlist(userId) {
    try {
      const res = await memoryAPI.getWishlist(userId)
      wishlist.value = res.data ?? res
    } catch (err) {
      useUiStore().showToast('获取愿望清单失败', 'error')
      console.error('fetchWishlist error:', err)
    }
  }

  /** 设置当前记忆 */
  function setCurrent(memory) {
    currentMemory.value = memory
  }

  /** 清空当前记忆 */
  function clearCurrent() {
    currentMemory.value = null
  }

  return {
    memories,
    currentMemory,
    loading,
    wishlist,
    memoriesByYear,
    publicMemories,
    memoryCount,
    fetchMemories,
    fetchMemoryById,
    addMemory,
    updateMemory,
    deleteMemory,
    fetchWishlist,
    setCurrent,
    clearCurrent,
  }
})
