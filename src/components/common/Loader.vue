<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  text: { type: String, default: '加载中...' },
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="loader-overlay">
        <div class="loader">
          <!-- 指南针旋转动画 -->
          <div class="loader__compass">
            <i class="fa-solid fa-compass"></i>
          </div>
          <p class="loader__text">{{ text }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.loader-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-glass);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lg);
}

.loader__compass {
  font-size: 48px;
  color: var(--color-accent);
  animation: compass-spin 2s linear infinite;
}

.loader__text {
  font-family: var(--font-serif);
  font-size: var(--text-body);
  color: var(--color-text-secondary);
}

@keyframes compass-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
