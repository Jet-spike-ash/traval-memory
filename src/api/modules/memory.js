/* AI 辅助生成：DeepSeek V4 + Claude */
import http from '@/api/index'

/**
 * 记忆与愿望清单 CRUD API
 */
export const memoryAPI = {
  /** 获取指定用户的所有记忆 */
  getByUser(userId) {
    return http.get(`/memories?user_id=${userId}`)
  },

  /** 获取单条记忆 */
  getById(id) {
    return http.get(`/memories/${id}`)
  },

  /** 新增记忆 */
  create(data) {
    return http.post('/memories', data)
  },

  /** 更新记忆 */
  update(id, data) {
    return http.put(`/memories/${id}`, data)
  },

  /** 删除记忆 */
  delete(id) {
    return http.delete(`/memories/${id}`)
  },

  /** 获取愿望清单 */
  getWishlist(userId) {
    return http.get(`/wishlist?user_id=${userId}`)
  },
}
