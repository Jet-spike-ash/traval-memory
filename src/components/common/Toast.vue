<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { useUiStore } from '@/stores/uiStore'
import { computed } from 'vue'

const uiStore = useUiStore()

const iconMap = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
}

const iconClass = computed(() => iconMap[uiStore.toast.type] || iconMap.info)
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div
        v-if="uiStore.toast.visible"
        class="toast"
        :class="`toast--${uiStore.toast.type}`"
        role="alert"
      >
        <i class="fa-solid toast__icon" :class="iconClass"></i>
        <span class="toast__message">{{ uiStore.toast.message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  top: var(--space-5);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 500;
  color: #fff;
  box-shadow: var(--shadow-md);
  min-width: 200px;
  max-width: 480px;
  pointer-events: auto;
}

.toast--success { background: var(--color-success); }
.toast--error   { background: var(--color-danger); }
.toast--warning { background: var(--color-warning); color: var(--color-text-primary); }
.toast--info    { background: var(--color-info); }

.toast__icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast__message {
  flex: 1;
  line-height: 1.4;
}

/* 动画 */
.toast-slide-enter-active {
  transition: all var(--duration-normal) var(--ease-spring);
}
.toast-slide-leave-active {
  transition: all var(--duration-fast) var(--ease-in);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
</style>
