<!-- AI 辅助生成：DeepSeek V4 + Claude -->
<script setup>
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()

function handleConfirm() {
  uiStore.modal.onConfirm?.()
  uiStore.hideModal()
}

function handleCancel() {
  uiStore.modal.onCancel?.()
  uiStore.hideModal()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="uiStore.modal.visible" class="modal-overlay" @click.self="handleCancel">
        <div class="modal glass">
          <h3 class="modal__title">{{ uiStore.modal.title }}</h3>
          <p class="modal__content">{{ uiStore.modal.content }}</p>
          <div class="modal__actions">
            <button class="btn btn--outline" @click="handleCancel">
              {{ uiStore.modal.cancelText }}
            </button>
            <button class="btn btn--primary" @click="handleConfirm">
              {{ uiStore.modal.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
}

.modal {
  width: 90%;
  max-width: 440px;
  padding: var(--space-6);
  text-align: center;
}

.modal__title {
  margin-bottom: var(--space-3);
  font: var(--text-h3);
}

.modal__content {
  margin-bottom: var(--space-5);
  color: var(--color-text-secondary);
  font: var(--text-body);
  line-height: 1.6;
}

.modal__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.btn {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-pill);
  font: var(--text-btn);
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn--primary {
  background: var(--color-primary);
  color: #fff;
}
.btn--primary:hover {
  background: var(--color-primary-light);
}

.btn--outline {
  border: var(--border-width-thick) solid var(--color-border);
  color: var(--color-text-secondary);
}
.btn--outline:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
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
