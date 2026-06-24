/* AI 辅助生成：DeepSeek V4 + Claude */
import http from '@/api/index'

/**
 * 统计数据 API（预留）
 */
export const statsAPI = {
  /** 获取用户统计数据汇总 */
  getSummary(userId) {
    return http.get(`/memories?user_id=${userId}`).then((res) => {
      const memories = res.data
      return {
        total: memories.length,
        countries: [...new Set(memories.map((m) => m.location_name?.split('·')[0]))],
        weatherDistribution: memories.reduce((acc, m) => {
          acc[m.weather_type] = (acc[m.weather_type] || 0) + 1
          return acc
        }, {}),
        memoriesByMonth: memories.reduce((acc, m) => {
          const month = new Date(m.happened_date).getMonth() + 1
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {}),
      }
    })
  },
}
