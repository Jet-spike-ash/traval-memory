/* AI 辅助生成：DeepSeek V4 + Claude */
import http from '@/api/index'

/**
 * 同伴/游者 API
 */
export const companionAPI = {
  /** 获取当前用户的同伴列表 */
  getCompanions(userId) {
    return http.get(`/companions?user_id=${userId}`).then((res) => res.data)
  },

  /** 获取指定游者的用户信息 */
  getUser(userId) {
    return http.get(`/users/${userId}`).then((res) => res.data)
  },

  /** 获取指定游者的所有记忆 */
  getMemories(userId) {
    return http.get(`/memories?user_id=${userId}`).then((res) => res.data)
  },
}
