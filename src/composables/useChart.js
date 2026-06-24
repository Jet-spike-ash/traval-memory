/* AI 辅助生成：DeepSeek V4 + Claude */
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'

/**
 * ECharts 响应式渲染组合式函数
 * 阶段 4 将在 StatsView 中使用
 */
export function useChart() {
  const chartInstance = shallowRef(null)
  const chartRef = ref(null)

  /** 初始化图表 */
  function initChart(options = {}) {
    // 阶段 4 实现: 通过 vue-echarts 或 echarts.init 初始化
    return chartInstance
  }

  /** 更新图表配置 */
  function setOption(option) {
    if (!chartInstance.value) return
    // chartInstance.value.setOption(option)
  }

  /** 响应式调整大小 */
  function resize() {
    if (!chartInstance.value) return
    // chartInstance.value.resize()
  }

  let resizeHandler = null

  onMounted(() => {
    resizeHandler = () => resize()
    window.addEventListener('resize', resizeHandler)
  })

  onUnmounted(() => {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
    if (chartInstance.value) {
      // chartInstance.value.dispose()
      chartInstance.value = null
    }
  })

  return {
    chartInstance,
    chartRef,
    initChart,
    setOption,
    resize,
  }
}
