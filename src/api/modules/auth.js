/* AI 辅助生成：DeepSeek V4 + Claude */
import http from '@/api/index'

/**
 * 认证相关 API
 */
export const authAPI = {
  /** 登录 */
  login(data) {
    return http.post('/login', data).then((res) => res.data)
  },

  /** 注册 */
  register(data) {
    return http.post('/register', data).then((res) => res.data)
  },
}
