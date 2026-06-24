/* AI 辅助生成：DeepSeek V4 + Claude */
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

/**
 * dayjs 格式化封装
 */

/** 格式化为标准日期字符串：YYYY-MM-DD */
export function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD')
}

/** 格式化为中文日期：2025年12月1日 */
export function formatDateCN(date) {
  return dayjs(date).format('YYYY年M月D日')
}

/** 格式化为完整中文日期时间 */
export function formatDateTimeCN(date) {
  return dayjs(date).format('YYYY年M月D日 HH:mm')
}

/** 格式化为相对时间：3天前、2小时前 */
export function formatRelative(date) {
  const now = dayjs()
  const target = dayjs(date)
  const diffMinutes = now.diff(target, 'minute')
  const diffHours = now.diff(target, 'hour')
  const diffDays = now.diff(target, 'day')
  const diffMonths = now.diff(target, 'month')
  const diffYears = now.diff(target, 'year')

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 30) return `${diffDays}天前`
  if (diffMonths < 12) return `${diffMonths}个月前`
  return `${diffYears}年前`
}

/** 获取季节 */
export function getSeason(date) {
  const month = dayjs(date).month() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

/** 获取季节中文名 */
export function getSeasonCN(date) {
  const map = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }
  return map[getSeason(date)] || '未知'
}

/** 获取年份 */
export function getYear(date) {
  return dayjs(date).year()
}

export { dayjs }
